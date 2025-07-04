import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import ffmpeg = require('fluent-ffmpeg');
import { getTempFile, runFfmpeg, getDuration } from '../utils';
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

	for (let i = 1; i < inputs.length; i++) {
		const nextVideo = `v${i}`;
		const nextAudio = `a${i}`;
		const currentVideoOut = `vout${i}`;
		const currentAudioOut = `aout${i}`;
		const offset = cumulativeDuration - duration;

		filterGraph.push(
			`[${lastVideoOut}][${nextVideo}]xfade=transition=${transition}:duration=${duration}:offset=${offset}[${currentVideoOut}]`,
		);
		filterGraph.push(
			`[${lastAudioOut}][${nextAudio}]acrossfade=d=${duration}[${currentAudioOut}]`,
		);

		lastVideoOut = currentVideoOut;
		lastAudioOut = currentAudioOut;
		cumulativeDuration += durations[i]! - duration;
	}

	command
		.complexFilter(filterGraph)
		.outputOptions(['-map', `[${lastVideoOut}]`, '-map', `[${lastAudioOut}]`])
		.videoCodec('libx264')
		.audioCodec('aac')
		.save(outputPath);

	try {
		await runFfmpeg(command);
		return outputPath;
	} catch (error) {
		// Clean up output file if creation failed
		await fs.remove(outputPath).catch(() => {});
		throw new NodeOperationError(
			this.getNode(),
			`Error applying transition. Please check the transition effect and parameters. FFmpeg error: ${
				(error as Error).message
			}`,
			{ itemIndex },
		);
	}
} 