import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import ffmpeg = require('fluent-ffmpeg');
import { getTempFile, runFfmpeg } from '../utils';
import * as fs from 'fs-extra';

export async function executeExtractAudio(
	this: IExecuteFunctions,
	input: string,
	format: string,
	codec: string,
	bitrate: string,
	itemIndex: number,
): Promise<string> {
	const outputPath = getTempFile(`.${format}`);
	let finalCodec = codec;

	// If stream copy ('copy') is selected for a format that requires a specific
	// codec (like mp3), we must override it to prevent an FFmpeg error.
	if (finalCodec === 'copy' && format === 'mp3') {
		// Cannot stream copy a non-mp3 stream (e.g., aac) into an mp3 container.
		// Default to a high-quality mp3 encoder.
		finalCodec = 'libmp3lame';
	}

	const command = ffmpeg(input)
		.output(outputPath)
		.noVideo()
		.audioCodec(finalCodec)
		.audioBitrate(bitrate)
		.outputOptions('-map', '0:a:0'); // Select first audio stream

	try {
		await runFfmpeg(command);
		return outputPath;
	} catch (error) {
		// Clean up output file if creation failed
		await fs.remove(outputPath).catch(() => {});
		throw new NodeOperationError(
			this.getNode(),
			`Error extracting audio. Please ensure the source video contains an audio track. FFmpeg error: ${
				(error as Error).message
			}`,
			{ itemIndex },
		);
	}
} 