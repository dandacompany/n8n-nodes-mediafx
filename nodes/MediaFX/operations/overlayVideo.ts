import { IExecuteFunctions, NodeOperationError, IDataObject } from 'n8n-workflow';
import ffmpeg = require('fluent-ffmpeg');
import { getTempFile, runFfmpeg, getDuration, verifyFfmpegAvailability, getVideoStreamInfo } from '../utils';
import * as fs from 'fs-extra';

export interface OverlayVideoOptions {
	// Position
	x: string | number;
	y: string | number;
	// Size
	width: number;
	height: number;
	// Opacity
	opacity: number;
	// Time control
	enableTimeControl: boolean;
	startTime: number;
	endTime: number;
	// Blending mode
	blendMode: string;
	// Audio handling
	audioHandling: 'main' | 'overlay' | 'mix' | 'none';
	mainVolume: number;
	overlayVolume: number;
}

export async function executeOverlayVideo(
	this: IExecuteFunctions,
	mainVideoPath: string,
	overlayVideoPath: string,
	options: IDataObject,
	itemIndex: number,
): Promise<string> {
	// Verify FFmpeg is available before proceeding
	try {
		verifyFfmpegAvailability();
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`FFmpeg is not available: ${(error as Error).message}`,
			{ itemIndex }
		);
	}

	// Extract output format from options (default to mp4)
	const outputFormat = (options.outputFormat as string) || 'mp4';
	const outputPath = getTempFile(`.${outputFormat}`);

	// Extract options with defaults
	// Position options
	const positionMode = (options.positionMode as string) ?? 'alignment';
	const horizontalAlign = (options.horizontalAlign as string) ?? 'center';
	const verticalAlign = (options.verticalAlign as string) ?? 'middle';
	const paddingX = (options.paddingX as number) ?? 0;
	const paddingY = (options.paddingY as number) ?? 0;
	const customX = options.x ?? '0';
	const customY = options.y ?? '0';
	// Size options
	const sizeMode = (options.sizeMode as string) ?? 'percentage';
	const widthPercent = (options.widthPercent as number) ?? 50;
	const heightMode = (options.heightMode as string) ?? 'auto';
	const heightPercent = (options.heightPercent as number) ?? 50;
	const widthPixels = (options.widthPixels as number) ?? -1;
	const heightPixels = (options.heightPixels as number) ?? -1;
	const opacity = (options.opacity as number) ?? 1.0;
	const enableTimeControl = options.enableTimeControl as boolean ?? false;
	const startTime = (options.startTime as number) ?? 0;
	const endTime = (options.endTime as number) ?? 0;
	const blendMode = (options.blendMode as string) ?? 'normal';
	const audioHandling = (options.audioHandling as string) ?? 'main';
	const mainVolume = (options.mainVolume as number) ?? 1.0;
	const overlayVolume = (options.overlayVolume as number) ?? 1.0;

	try {
		// Get durations for calculations
		const mainDuration = await getDuration(mainVideoPath);
		const overlayDuration = await getDuration(overlayVideoPath);

		// Get main video resolution for percentage calculations
		const mainVideoInfo = await getVideoStreamInfo(mainVideoPath);
		const mainWidth = mainVideoInfo?.width || 1920;
		const mainHeight = mainVideoInfo?.height || 1080;

		// Calculate actual overlay dimensions based on size mode
		let scaleWidth: number | string = -1;
		let scaleHeight: number | string = -1;

		if (sizeMode === 'percentage') {
			// Calculate width as percentage of main video
			scaleWidth = Math.round(mainWidth * (widthPercent / 100));

			if (heightMode === 'auto') {
				// Keep aspect ratio - use -1 for FFmpeg to auto-calculate
				scaleHeight = -1;
			} else {
				// Calculate height as percentage of main video
				scaleHeight = Math.round(mainHeight * (heightPercent / 100));
			}
		} else if (sizeMode === 'pixels') {
			scaleWidth = widthPixels;
			scaleHeight = heightPixels;
		}
		// If sizeMode === 'original', leave both as -1 (no scaling)

		const needsScaling = sizeMode !== 'original';

		// Calculate position based on position mode
		let posX: string;
		let posY: string;

		if (positionMode === 'alignment') {
			// Use FFmpeg expressions for alignment
			// overlay_w and overlay_h refer to the scaled overlay dimensions
			switch (horizontalAlign) {
				case 'left':
					posX = String(paddingX);
					break;
				case 'center':
					posX = `(main_w-overlay_w)/2`;
					break;
				case 'right':
					posX = `main_w-overlay_w-${paddingX}`;
					break;
				default:
					posX = String(paddingX);
			}

			switch (verticalAlign) {
				case 'top':
					posY = String(paddingY);
					break;
				case 'middle':
					posY = `(main_h-overlay_h)/2`;
					break;
				case 'bottom':
					posY = `main_h-overlay_h-${paddingY}`;
					break;
				default:
					posY = String(paddingY);
			}

			// Add padding offset for center alignment
			if (horizontalAlign === 'center' && paddingX !== 0) {
				posX = `(main_w-overlay_w)/2+${paddingX}`;
			}
			if (verticalAlign === 'middle' && paddingY !== 0) {
				posY = `(main_h-overlay_h)/2+${paddingY}`;
			}
		} else {
			// Custom coordinates mode - use provided x, y values
			posX = String(customX);
			posY = String(customY);
		}

		// Calculate actual end time
		const actualEndTime = enableTimeControl
			? (endTime > 0 ? endTime : mainDuration)
			: mainDuration;

		// Build the video filter chain
		let videoFilterChain = '';

		// Process overlay video (scale if needed)
		const needsOpacity = opacity < 1.0;

		let overlayProcessing = '[1:v]';

		if (needsScaling) {
			overlayProcessing += `scale=${scaleWidth}:${scaleHeight}`;
		}

		if (needsOpacity) {
			if (needsScaling) {
				overlayProcessing += ',';
			}
			overlayProcessing += `colorchannelmixer=aa=${opacity}`;
		}

		// Apply blend mode filter if not normal
		if (blendMode !== 'normal' && blendMode !== 'over') {
			if (needsScaling || needsOpacity) {
				overlayProcessing += ',';
			}
			// For blend modes, we'll use the blend filter differently
		}

		if (needsScaling || needsOpacity) {
			overlayProcessing += '[ovr]';
			videoFilterChain = overlayProcessing + ';';
			videoFilterChain += '[0:v][ovr]';
		} else {
			videoFilterChain = '[0:v][1:v]';
		}

		// Build overlay filter with position
		// eof_action=pass: continue showing main video after overlay ends
		// repeatlast=0: don't repeat the last frame of overlay
		videoFilterChain += `overlay=x=${posX}:y=${posY}:eof_action=pass:repeatlast=0`;

		// Add time control if enabled
		if (enableTimeControl) {
			videoFilterChain += `:enable='between(t,${startTime},${actualEndTime})'`;
		}

		videoFilterChain += '[outv]';

		// Build audio filter chain based on audio handling option
		let audioFilterChain = '';
		let outputMaps: string[] = ['-map', '[outv]'];

		switch (audioHandling) {
			case 'main':
				// Use only main video's audio
				outputMaps.push('-map', '0:a?');
				break;
			case 'overlay':
				// Use only overlay video's audio
				outputMaps.push('-map', '1:a?');
				break;
			case 'mix':
				// Mix both audio tracks (use longest duration)
				audioFilterChain = `;[0:a]volume=${mainVolume}[a0];[1:a]volume=${overlayVolume}[a1];[a0][a1]amix=inputs=2:duration=longest[outa]`;
				outputMaps.push('-map', '[outa]');
				break;
			case 'none':
				// No audio output
				break;
			default:
				outputMaps.push('-map', '0:a?');
		}

		const fullFilterComplex = videoFilterChain + audioFilterChain;

		console.log('=== OVERLAY VIDEO DEBUG ===');
		console.log('Main video:', mainVideoPath);
		console.log('Overlay video:', overlayVideoPath);
		console.log('Main duration:', mainDuration);
		console.log('Overlay duration:', overlayDuration);
		console.log('Main resolution:', { mainWidth, mainHeight });
		console.log('Position mode:', positionMode);
		console.log('Calculated position:', { posX, posY });
		console.log('Size mode:', sizeMode);
		console.log('Calculated scale:', { scaleWidth, scaleHeight, needsScaling });
		console.log('Options:', { opacity, enableTimeControl, startTime, actualEndTime, blendMode, audioHandling });
		console.log('Filter complex:', fullFilterComplex);
		console.log('Output maps:', outputMaps);
		console.log('===========================');

		const command = ffmpeg()
			.input(mainVideoPath)
			.input(overlayVideoPath)
			.complexFilter(fullFilterComplex)
			.outputOptions(outputMaps)
			.outputOptions(['-c:v', 'libx264', '-preset', 'fast', '-crf', '23'])
			.output(outputPath);

		await runFfmpeg(command);

		return outputPath;
	} catch (error) {
		// Clean up output file if creation failed
		await fs.remove(outputPath).catch(() => {});

		console.error('=== OVERLAY VIDEO ERROR ===');
		console.error('Error details:', error);
		console.error('===========================');

		throw new NodeOperationError(
			this.getNode(),
			`Failed to overlay video: ${error instanceof Error ? error.message : 'Unknown error'}`,
			{ itemIndex },
		);
	}
}
