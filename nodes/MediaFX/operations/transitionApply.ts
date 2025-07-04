import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import ffmpeg = require('fluent-ffmpeg');
import { getTempFile, runFfmpeg, getDuration, fileHasAudio } from '../utils';
import { checkTransitionSupport } from '../utils/ffmpegVersion';
import * as fs from 'fs-extra';

export async function executeTransitionApply(
	this: IExecuteFunctions,
	inputs: string[],
	transition: string,
	duration: number,
	outputFormat: string,
	itemIndex: number,
): Promise<string> {
	if (inputs.length < 2) {
		throw new NodeOperationError(
			this.getNode(),
			'Transition (Apply) operation requires at least two source videos.',
			{ itemIndex },
		);
	}

	// Check if the requested transition is supported
	const transitionSupport = await checkTransitionSupport(transition);
	let effectiveTransition = transition;
	
	if (!transitionSupport.supported) {
		if (transitionSupport.alternative) {
			effectiveTransition = transitionSupport.alternative;
			console.warn(transitionSupport.message);
		} else {
			throw new NodeOperationError(
				this.getNode(),
				transitionSupport.message || 'Unsupported transition effect',
				{ itemIndex },
			);
		}
	}

	const outputPath = getTempFile(`.${outputFormat}`);
	const command = ffmpeg();
	inputs.forEach((input) => command.addInput(input));

	const durations = await Promise.all(inputs.map((input) => getDuration(input)));
	if (durations.some((d) => d === null)) {
		throw new NodeOperationError(this.getNode(), 'Could not get duration of one or more videos.', {
			itemIndex,
		});
	}

	// Check if all input videos have audio
	const audioChecks = await Promise.all(inputs.map((input) => fileHasAudio(input)));
	const allHaveAudio = audioChecks.every((hasAudio) => hasAudio);
	const someHaveAudio = audioChecks.some((hasAudio) => hasAudio);
	
	// Warn if only some videos have audio
	if (someHaveAudio && !allHaveAudio) {
		console.warn('Warning: Not all input videos have audio tracks. Audio will be excluded from the output.');
	}

	// Initialize video streams (always)
	const filterGraph: string[] = inputs.map((_, i) => `[${i}:v]settb=AVTB[v${i}]`);
	
	// Initialize audio streams only if audio exists
	if (allHaveAudio) {
		inputs.forEach((_, i) => {
			filterGraph.push(`[${i}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a${i}]`);
		});
	}

	let lastVideoOut = 'v0';
	let lastAudioOut = 'a0';
	let cumulativeDuration = durations[0]!;

	// Use different filter strategies based on transition type
	if (effectiveTransition === 'fade' || effectiveTransition === 'fadeblack' || effectiveTransition === 'fadewhite') {
		// Fallback implementation for fade transitions without xfade
		// Create properly timed overlays for transition duration only
		
		for (let i = 1; i < inputs.length; i++) {
			const nextVideo = `v${i}`;
			const nextAudio = `a${i}`;
			const currentVideoOut = `vout${i}`;
			const currentAudioOut = `aout${i}`;
			
			// Calculate timing - each video should transition at its end
			const transitionStart = cumulativeDuration - duration;
			
			// Extend the previous video segment to include the transition
			const extendedPrev = `ext${i}`;
			filterGraph.push(
				`[${lastVideoOut}]tpad=stop_duration=${duration}[${extendedPrev}]`
			);
			
			// Apply fade out to the extended previous video
			const fadeOutVideo = `fadeout${i}`;
			filterGraph.push(
				`[${extendedPrev}]fade=t=out:st=${transitionStart}:d=${duration}[${fadeOutVideo}]`
			);
			
			// Prepare the next video with fade in and delay it to start at transition time
			const fadeInVideo = `fadein${i}`;
			const delayedVideo = `delayed${i}`;
			
			filterGraph.push(
				`[${nextVideo}]fade=t=in:st=0:d=${duration}[${fadeInVideo}]`,
				`[${fadeInVideo}]tpad=start_duration=${transitionStart}[${delayedVideo}]`
			);
			
			// Overlay the videos during transition period only
			filterGraph.push(
				`[${fadeOutVideo}][${delayedVideo}]overlay[${currentVideoOut}]`
			);
			
			// Audio crossfade only if audio exists
			if (allHaveAudio) {
				// Extend previous audio and apply fade out
				const extendedPrevAudio = `aext${i}`;
				const fadeOutAudio = `afadeout${i}`;
				
				filterGraph.push(
					`[${lastAudioOut}]apad=pad_dur=${duration}[${extendedPrevAudio}]`,
					`[${extendedPrevAudio}]afade=t=out:st=${transitionStart}:d=${duration}[${fadeOutAudio}]`
				);
				
				// Prepare next audio with fade in and delay
				const fadeInAudio = `afadein${i}`;
				const delayedAudio = `adelayed${i}`;
				
				filterGraph.push(
					`[${nextAudio}]afade=t=in:st=0:d=${duration}[${fadeInAudio}]`,
					`[${fadeInAudio}]adelay=${Math.floor(transitionStart * 1000)}|${Math.floor(transitionStart * 1000)}[${delayedAudio}]`
				);
				
				// Mix the audio tracks
				filterGraph.push(
					`[${fadeOutAudio}][${delayedAudio}]amix=inputs=2:duration=longest[${currentAudioOut}]`
				);
			}

			lastVideoOut = currentVideoOut;
			if (allHaveAudio) {
				lastAudioOut = currentAudioOut;
			}
			cumulativeDuration += durations[i]! - duration;
		}
	} else {
		// Use xfade for supported transitions
		for (let i = 1; i < inputs.length; i++) {
			const nextVideo = `v${i}`;
			const nextAudio = `a${i}`;
			const currentVideoOut = `vout${i}`;
			const currentAudioOut = `aout${i}`;
			const offset = cumulativeDuration - duration;

			filterGraph.push(
				`[${lastVideoOut}][${nextVideo}]xfade=transition=${effectiveTransition}:duration=${duration}:offset=${offset}[${currentVideoOut}]`,
			);
			if (allHaveAudio) {
				filterGraph.push(
					`[${lastAudioOut}][${nextAudio}]acrossfade=d=${duration}[${currentAudioOut}]`,
				);
			}

			lastVideoOut = currentVideoOut;
			if (allHaveAudio) {
				lastAudioOut = currentAudioOut;
			}
			cumulativeDuration += durations[i]! - duration;
		}
	}

	// Build output options based on available streams
	const outputOptions = ['-map', `[${lastVideoOut}]`];
	if (allHaveAudio) {
		outputOptions.push('-map', `[${lastAudioOut}]`);
	}

	command
		.complexFilter(filterGraph)
		.outputOptions(outputOptions)
		.videoCodec('libx264');
	
	if (allHaveAudio) {
		command.audioCodec('aac');
	}
	
	command.save(outputPath);

	try {
		await runFfmpeg(command);
		
		// If we used a fallback transition, add a note to the result
		if (effectiveTransition !== transition && transitionSupport.message) {
			console.log(`Transition fallback: ${transitionSupport.message}`);
		}
		
		return outputPath;
	} catch (error) {
		// Clean up output file if creation failed
		await fs.remove(outputPath).catch(() => {});
		
		const errorMessage = (error as Error).message;
		let helpfulMessage = 'Error applying transition.';
		
		// Check for specific error patterns
		if (errorMessage.includes('No such filter: \'xfade\'')) {
			helpfulMessage = `Your FFmpeg version doesn't support the 'xfade' filter (requires FFmpeg 4.3+). ` +
				`The transition '${transition}' requires xfade. Please upgrade FFmpeg or use basic transitions like 'fade'.`;
		} else if (errorMessage.includes('Invalid argument')) {
			helpfulMessage = `Invalid transition parameters. The '${transition}' effect may not be supported by your FFmpeg version.`;
		}
		
		throw new NodeOperationError(
			this.getNode(),
			`${helpfulMessage} FFmpeg error: ${errorMessage}`,
			{ itemIndex },
		);
	}
} 