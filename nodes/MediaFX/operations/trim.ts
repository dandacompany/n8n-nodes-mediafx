import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import ffmpeg = require('fluent-ffmpeg');
import { getTempFile, runFfmpeg } from '../utils';
import * as fs from 'fs-extra';

export async function executeTrim(
	this: IExecuteFunctions,
	input: string,
	from: number,
	to: number,
	outputFormat: string,
	itemIndex: number,
): Promise<string> {
	const outputPath = getTempFile(`.${outputFormat}`);
	const command = ffmpeg(input)
		.setStartTime(from)
		.setDuration(to - from)
		.output(outputPath)
		.videoCodec('libx264')
		.audioCodec('aac');

	try {
		await runFfmpeg(command);
		return outputPath;
	} catch (error) {
		// Clean up output file if creation failed
		await fs.remove(outputPath).catch(() => {});
		throw new NodeOperationError(
			this.getNode(),
			`Error trimming video. Please check that start and end times are valid and within the video's duration. FFmpeg error: ${
				(error as Error).message
			}`,
			{ itemIndex },
		);
	}
} 