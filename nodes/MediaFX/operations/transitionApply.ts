import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import ffmpeg = require('fluent-ffmpeg');
import { getTempFile, runFfmpeg, getDuration } from '../utils';
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

	// Initialize video and audio streams
	const filterGraph: string[] = inputs.flatMap((_, i) => [
		`[${i}:v]settb=AVTB[v${i}]`,
		`[${i}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a${i}]`,
	]);

	let lastVideoOut = 'v0';
	let lastAudioOut = 'a0';
	let cumulativeDuration = durations[0]!;

	// Use different filter strategies based on transition type
	if (effectiveTransition === 'fade' || effectiveTransition === 'fadeblack' || effectiveTransition === 'fadewhite') {
		// Fallback implementation for fade transitions without xfade
		for (let i = 1; i < inputs.length; i++) {
			const nextVideo = `v${i}`;
			const nextAudio = `a${i}`;
			const currentVideoOut = `vout${i}`;
			const currentAudioOut = `aout${i}`;
			const fadeOutStart = cumulativeDuration - duration;
			
			// Fade out previous video, fade in next video, then overlay
			const fadeOutVideo = `fadeout${i}`;
			const fadeInVideo = `fadein${i}`;
			
			// Apply fade effects
			filterGraph.push(
				`[${lastVideoOut}]fade=t=out:st=${fadeOutStart}:d=${duration}[${fadeOutVideo}]`,
				`[${nextVideo}]fade=t=in:st=0:d=${duration}[${fadeInVideo}]`
			);
			
			// Overlay the videos during transition
			filterGraph.push(
				`[${fadeOutVideo}][${fadeInVideo}]overlay=enable='between(t,${fadeOutStart},${cumulativeDuration})'[${currentVideoOut}]`
			);
			
			// Audio crossfade
			filterGraph.push(
				`[${lastAudioOut}][${nextAudio}]acrossfade=d=${duration}[${currentAudioOut}]`,
			);

			lastVideoOut = currentVideoOut;
			lastAudioOut = currentAudioOut;
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
			filterGraph.push(
				`[${lastAudioOut}][${nextAudio}]acrossfade=d=${duration}[${currentAudioOut}]`,
			);

			lastVideoOut = currentVideoOut;
			lastAudioOut = currentAudioOut;
			cumulativeDuration += durations[i]! - duration;
		}
	}

	command
		.complexFilter(filterGraph)
		.outputOptions(['-map', `[${lastVideoOut}]`, '-map', `[${lastAudioOut}]`])
		.videoCodec('libx264')
		.audioCodec('aac')
		.save(outputPath);

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