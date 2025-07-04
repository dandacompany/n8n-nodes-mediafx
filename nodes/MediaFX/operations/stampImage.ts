import { IExecuteFunctions, NodeOperationError, IDataObject } from 'n8n-workflow';
import * as path from 'path';
import ffmpeg = require('fluent-ffmpeg');
import { getTempFile, runFfmpeg, getDuration } from '../utils';
import * as fs from 'fs-extra';

export async function executeStampImage(
	this: IExecuteFunctions,
	videoPath: string,
	imagePath: string,
	options: IDataObject,
	itemIndex: number,
): Promise<string> {
	const outputPath = getTempFile(path.extname(videoPath));

	// Basic stamp options
	const width = options.width || 150;
	const height = options.height || -1;
	const x = options.x || '10';
	const y = options.y || '10';
	const rotationDegrees = (options.rotation as number) || 0;
	const opacity = (options.opacity as number) ?? 1.0;

	// Time control options
	const enableTimeControl = options.enableTimeControl as boolean;
	const startTime = (options.startTime as number) || 0;
	const endTime = (options.endTime as number) || 5;

	try {
		// Get video duration for calculations
		const videoDuration = await getDuration(videoPath);
		
		console.log('=== STAMP IMAGE DEBUG ===');
		console.log('Video path:', videoPath);
		console.log('Image path:', imagePath);
		console.log('Video duration:', videoDuration);
		console.log('Stamp options:', {
			width, height, x, y, rotationDegrees, opacity,
			enableTimeControl, startTime, endTime
		});
		
		// Start with the simplest possible filter
		let complexFilter = '';
		
		// Check if we need any processing
		const needsScaling = width !== -1 || height !== -1;
		const needsRotation = rotationDegrees !== 0;
		const needsOpacity = opacity < 1.0;
		const needsProcessing = needsScaling || needsRotation || needsOpacity;
		
		if (!needsProcessing && !enableTimeControl) {
			// Simplest case: direct overlay
			complexFilter = '[0:v][1:v]overlay=x=' + x + ':y=' + y;
		} else if (!enableTimeControl) {
			// Process image but no time control
			let imageFilter = '[1:v]';
			
			if (needsScaling) {
				imageFilter += 'scale=' + width + ':' + height;
			}
			
			if (needsRotation) {
				if (!needsScaling) {
					imageFilter += 'rotate=' + (rotationDegrees * Math.PI / 180) + ':fillcolor=none';
				} else {
					imageFilter += ',rotate=' + (rotationDegrees * Math.PI / 180) + ':fillcolor=none';
				}
			}
			
			if (needsOpacity) {
				if (!needsScaling && !needsRotation) {
					imageFilter += 'colorchannelmixer=aa=' + opacity;
				} else {
					imageFilter += ',colorchannelmixer=aa=' + opacity;
				}
			}
			
			imageFilter += '[processed]';
			complexFilter = imageFilter + ';[0:v][processed]overlay=x=' + x + ':y=' + y;
		} else {
			// With time control
			let imageFilter = '[1:v]';
			
			if (needsScaling) {
				imageFilter += 'scale=' + width + ':' + height;
			}
			
			if (needsRotation) {
				if (!needsScaling) {
					imageFilter += 'rotate=' + (rotationDegrees * Math.PI / 180) + ':fillcolor=none';
				} else {
					imageFilter += ',rotate=' + (rotationDegrees * Math.PI / 180) + ':fillcolor=none';
				}
			}
			
			if (needsOpacity) {
				if (!needsScaling && !needsRotation) {
					imageFilter += 'colorchannelmixer=aa=' + opacity;
				} else {
					imageFilter += ',colorchannelmixer=aa=' + opacity;
				}
			}
			
			if (needsProcessing) {
				imageFilter += '[processed]';
				complexFilter = imageFilter + ';[0:v][processed]overlay=x=' + x + ':y=' + y;
			} else {
				complexFilter = '[0:v][1:v]overlay=x=' + x + ':y=' + y;
			}
			
			// Add time control
			if (enableTimeControl) {
				complexFilter += ':enable=\'between(t,' + startTime + ',' + endTime + ')\'';
			}
		}
		
		console.log('Generated FFmpeg filter:', complexFilter);
		console.log('========================');
		
		const command = ffmpeg()
			.input(videoPath)
			.input(imagePath)
			.complexFilter(complexFilter)
			.output(outputPath);

		await runFfmpeg(command);

		return outputPath;
	} catch (error) {
		// Clean up output file if creation failed
		await fs.remove(outputPath).catch(() => {});
		
		console.error('=== STAMP IMAGE ERROR ===');
		console.error('Error details:', error);
		console.error('========================');
		throw new NodeOperationError(
			this.getNode(),
			`Failed to stamp image: ${error instanceof Error ? error.message : 'Unknown error'}`,
			{ itemIndex },
		);
	}
} 