import { IExecuteFunctions, NodeOperationError, IDataObject } from 'n8n-workflow';
import * as path from 'path';
import ffmpeg = require('fluent-ffmpeg');
import { getTempFile, runFfmpeg } from '../utils';

export async function executeStampImage(
	this: IExecuteFunctions,
	videoPath: string,
	imagePath: string,
	options: IDataObject,
	itemIndex: number,
): Promise<string> {
	const outputPath = getTempFile(path.extname(videoPath));

	const width = options.width || -1; // Use -1 to auto-scale with aspect ratio
	const height = options.height || -1;
	const x = options.x || '10';
	const y = options.y || '10';
	const rotationDegrees = (options.rotation as number) || 0;

	// FFmpeg's rotate filter uses radians
	const rotationRadians = (rotationDegrees * Math.PI) / 180;

	const complexFilter = [
		// Scale the stamp image first
		`[1:v]scale=${width}:${height}[scaled_stamp]`,
		// Rotate the scaled stamp. 'ow' and 'oh' are crucial for resizing the canvas.
		`[scaled_stamp]rotate=${rotationRadians}:c=none:ow=rotw(iw):oh=roth(ih)[rotated_stamp]`,
		// Overlay the final rotated stamp onto the main video
		`[0:v][rotated_stamp]overlay=x=${x}:y=${y}`,
	];

	const command = ffmpeg()
		.input(videoPath)
		.input(imagePath)
		.complexFilter(complexFilter.join(';'))
		.audioCodec('copy') // Preserve original audio
		.save(outputPath);

	try {
		await runFfmpeg(command);
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Error stamping image on video. Please check source files and stamp options. FFmpeg error: ${
				(error as Error).message
			}`,
			{ itemIndex },
		);
	}

	return outputPath;
} 