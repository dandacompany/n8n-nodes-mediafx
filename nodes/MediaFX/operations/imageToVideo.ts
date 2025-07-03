import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { getTempFile, runFfmpeg } from '../utils';
import ffmpeg = require('fluent-ffmpeg');

export async function executeImageToVideo(
	this: IExecuteFunctions,
	imagePath: string,
	duration: number,
	videoSize: { width?: number; height?: number },
	outputFormat: string,
	itemIndex: number,
): Promise<string> {
	const outputPath = getTempFile(`.${outputFormat}`);

	const command = ffmpeg()
		.input(imagePath)
		.loop(duration)
		// Add a silent audio track for compatibility
		.input('anullsrc')
		.inputFormat('lavfi')
		// Use libx264 codec for broad compatibility
		.videoCodec('libx264')
		// Set pixel format
		.outputOptions('-pix_fmt', 'yuv420p')
		.audioCodec('aac')
		.outputOptions('-shortest'); // End when the shortest input ends.

	if (videoSize.width && videoSize.height) {
		// Many codecs require even dimensions, but we'll let the user decide.
		// For more robustness, we could add validation or rounding logic here.
		command.videoFilters(`scale=${videoSize.width}:${videoSize.height}`);
	} else {
		// Default behavior: ensure even dimensions for compatibility
		command.videoFilters('scale=trunc(iw/2)*2:trunc(ih/2)*2');
	}

	command.save(outputPath);

	try {
		await runFfmpeg(command);
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Error converting image to video. Please ensure the source image is valid. FFmpeg error: ${
				(error as Error).message
			}`,
			{ itemIndex },
		);
	}

	return outputPath;
} 