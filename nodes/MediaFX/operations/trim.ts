import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import * as path from 'path';
import ffmpeg = require('fluent-ffmpeg');
import { getTempFile, runFfmpeg } from '../utils';

export async function executeTrim(
	this: IExecuteFunctions,
	input: string,
	from: number,
	to: number,
	itemIndex: number,
): Promise<string> {
	const outputPath = getTempFile(path.extname(input));
	const command = ffmpeg(input)
		.setStartTime(from)
		.setDuration(to - from)
		.output(outputPath)
		.videoCodec('libx264')
		.audioCodec('aac');

	try {
		await runFfmpeg(command);
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Error trimming video. Please check that start and end times are valid and within the video's duration. FFmpeg error: ${
				(error as Error).message
			}`,
			{ itemIndex },
		);
	}
	return outputPath;
} 