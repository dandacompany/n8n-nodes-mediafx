import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import ffmpeg = require('fluent-ffmpeg');
import { getTempFile, runFfmpeg, getDuration, fileHasAudio } from '../utils';
import { checkTransitionSupport } from '../utils/ffmpegVersion';
import * as fs from 'fs-extra';

export async function executeMultiVideoTransition(
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

	// Get video dimensions using ffprobe to determine common resolution
	const getDimensions = async (inputPath: string): Promise<{ width: number; height: number }> => {
		return new Promise((resolve, reject) => {
			ffmpeg.ffprobe(inputPath, (err, metadata) => {
				if (err) {
					reject(err);
					return;
				}
				const videoStream = metadata.streams.find(s => s.codec_type === 'video');
				if (!videoStream || !videoStream.width || !videoStream.height) {
					reject(new Error('Could not get video dimensions'));
					return;
				}
				resolve({ width: videoStream.width, height: videoStream.height });
			});
		});
	};

	// Get dimensions of all input videos
	const dimensions = await Promise.all(inputs.map(input => getDimensions(input)));
	
	// Find the maximum dimensions to use as target resolution
	const targetWidth = Math.max(...dimensions.map(d => d.width));
	const targetHeight = Math.max(...dimensions.map(d => d.height));
	
	console.log(`[MediaFX] Target resolution for transition: ${targetWidth}x${targetHeight}`);

	// Initialize video streams with scaling to common resolution
	const filterGraph: string[] = inputs.map((_, i) => {
		const dim = dimensions[i];
		if (dim.width !== targetWidth || dim.height !== targetHeight) {
			// Scale and pad to maintain aspect ratio
			return `[${i}:v]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:black,settb=AVTB[v${i}]`;
		} else {
			// No scaling needed
			return `[${i}:v]settb=AVTB[v${i}]`;
		}
	});
	
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
		// Simply concatenate videos with fade effects applied to each segment
		
		const videoSegments: string[] = [];
		const audioSegments: string[] = [];
		
		for (let i = 0; i < inputs.length; i++) {
			const videoDuration = durations[i]!;
			const isFirst = i === 0;
			const isLast = i === inputs.length - 1;
			const videoSegment = `vseg${i}`;
			
			if (isFirst && isLast) {
				// Only one video - no transitions needed
				videoSegments.push(`v${i}`);
			} else if (isFirst) {
				// First video: fade out at the end
				const fadeOutStart = videoDuration - duration;
				filterGraph.push(
					`[v${i}]fade=t=out:st=${fadeOutStart}:d=${duration}[${videoSegment}]`
				);
				videoSegments.push(videoSegment);
			} else if (isLast) {
				// Last video: fade in at the beginning
				filterGraph.push(
					`[v${i}]fade=t=in:st=0:d=${duration}[${videoSegment}]`
				);
				videoSegments.push(videoSegment);
			} else {
				// Middle videos: fade in at start, fade out at end
				const fadeOutStart = videoDuration - duration;
				filterGraph.push(
					`[v${i}]fade=t=in:st=0:d=${duration},fade=t=out:st=${fadeOutStart}:d=${duration}[${videoSegment}]`
				);
				videoSegments.push(videoSegment);
			}
		}
		
		// Concatenate all video segments
		if (videoSegments.length === 1) {
			lastVideoOut = videoSegments[0];
		} else {
			lastVideoOut = 'vconcat';
			const concatFilter = videoSegments.map(seg => `[${seg}]`).join('') + 
				`concat=n=${videoSegments.length}:v=1:a=0[${lastVideoOut}]`;
			filterGraph.push(concatFilter);
		}
		
		// Handle audio if it exists
		if (allHaveAudio) {
			for (let i = 0; i < inputs.length; i++) {
				const audioDuration = durations[i]!;
				const isFirst = i === 0;
				const isLast = i === inputs.length - 1;
				const audioSegment = `aseg${i}`;
				
				if (isFirst && isLast) {
					audioSegments.push(`a${i}`);
				} else if (isFirst) {
					const fadeOutStart = audioDuration - duration;
					filterGraph.push(
						`[a${i}]afade=t=out:st=${fadeOutStart}:d=${duration}[${audioSegment}]`
					);
					audioSegments.push(audioSegment);
				} else if (isLast) {
					filterGraph.push(
						`[a${i}]afade=t=in:st=0:d=${duration}[${audioSegment}]`
					);
					audioSegments.push(audioSegment);
				} else {
					const fadeOutStart = audioDuration - duration;
					filterGraph.push(
						`[a${i}]afade=t=in:st=0:d=${duration},afade=t=out:st=${fadeOutStart}:d=${duration}[${audioSegment}]`
					);
					audioSegments.push(audioSegment);
				}
			}
			
			// Concatenate all audio segments
			if (audioSegments.length === 1) {
				lastAudioOut = audioSegments[0];
			} else {
				lastAudioOut = 'aconcat';
				const audioConcatFilter = audioSegments.map(seg => `[${seg}]`).join('') + 
					`concat=n=${audioSegments.length}:v=0:a=1[${lastAudioOut}]`;
				filterGraph.push(audioConcatFilter);
			}
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