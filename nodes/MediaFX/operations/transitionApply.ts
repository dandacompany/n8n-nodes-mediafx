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

	const durations = await Promise.all(inputs.map(input => getDuration(input)));
	if (durations.some(d => d === null)) {
		throw new NodeOperationError(this.getNode(), 'Could not get duration of one or more videos.', {
			itemIndex,
		});
	}

	const filterGraph: string[] = [];
	let lastVideoOut = '0:v';
	let lastAudioOut = '0:a';

	for (let i = 1; i < inputs.length; i++) {
		const prevIndex = i - 1;
		const prevDuration = durations[prevIndex]!;
		const offset = prevDuration - duration;
		const nextVideo = `${i}:v`;
		const nextAudio = `${i}:a`;
		const currentVideoOut = `v_out_${i}`;
		const currentAudioOut = `a_out_${i}`;

		filterGraph.push(
			`[${lastVideoOut}][${nextVideo}]xfade=transition=${transition}:duration=${duration}:offset=${offset}[${currentVideoOut}]`
		);
		filterGraph.push(
			`[${lastAudioOut}][${nextAudio}]acrossfade=d=${duration}[${currentAudioOut}]`
		);
		lastVideoOut = currentVideoOut;
		lastAudioOut = currentAudioOut;
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