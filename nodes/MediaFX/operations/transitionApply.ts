import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import ffmpeg = require('fluent-ffmpeg');
import { getTempFile, runFfmpeg, getDuration } from '../utils';

export async function executeTransitionApply(
	this: IExecuteFunctions,
	inputs: string[],
	transition: string,
	duration: number,
	outputFormat: string,
	itemIndex: number,
): Promise<string> {
	if (inputs.length !== 2) {
		throw new NodeOperationError(
			this.getNode(),
			'Transition (Apply) operation requires exactly two source videos.',
			{ itemIndex },
		);
	}

	const outputPath = getTempFile(`.${outputFormat}`);
	const command = ffmpeg();
	inputs.forEach((input) => command.addInput(input));

	const firstVideoDuration = await getDuration(inputs[0]);
	if (firstVideoDuration === null) {
		throw new NodeOperationError(this.getNode(), 'Could not get duration of the first video.', {
			itemIndex,
		});
	}

	const offset = firstVideoDuration - duration;

	const filterGraph = [
		// Set up video streams
		'[0:v]settb=AVTB[v0]',
		'[1:v]settb=AVTB[v1]',
		// Apply cross-fade (xfade)
		`[v0][v1]xfade=transition=${transition}:duration=${duration}:offset=${offset}[v_out]`,
		// Set up audio streams
		'[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a0]',
		'[1:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a1]',
		// Apply audio cross-fade (acrossfade)
		`[a0][a1]acrossfade=d=${duration}[a_out]`,
	];

	command
		.complexFilter(filterGraph)
		.outputOptions(['-map', '[v_out]', '-map', '[a_out]'])
		.videoCodec('libx264')
		.audioCodec('aac')
		.save(outputPath);

	try {
		await runFfmpeg(command);
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Error applying transition. Please check the transition effect and parameters. FFmpeg error: ${
				(error as Error).message
			}`,
			{ itemIndex },
		);
	}

	return outputPath;
} 