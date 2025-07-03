import { IExecuteFunctions, NodeOperationError, IDataObject } from 'n8n-workflow';
import * as path from 'path';
import ffmpeg = require('fluent-ffmpeg');
import { getTempFile, runFfmpeg, getAvailableFonts } from '../utils';

function getPositionFromAlignment(
	horizontalAlign: string,
	verticalAlign: string,
	paddingX: number,
	paddingY: number
): { x: string; y: string } {
	let x: string;
	let y: string;

	// Set X position based on horizontal alignment
	switch (horizontalAlign) {
		case 'left':
			x = `${paddingX}`;
			break;
		case 'right':
			x = `w-text_w-${paddingX}`;
			break;
		case 'center':
		default:
			x = '(w-text_w)/2';
			break;
	}

	// Set Y position based on vertical alignment
	switch (verticalAlign) {
		case 'top':
			y = `${paddingY}`;
			break;
		case 'bottom':
			y = `h-th-${paddingY}`;
			break;
		case 'middle':
		default:
			y = '(h-text_h)/2';
			break;
	}

	return { x, y };
}

export async function executeAddText(
	this: IExecuteFunctions,
	video: string,
	text: string,
	options: IDataObject,
	itemIndex: number,
): Promise<string> {
	const allFonts = getAvailableFonts();
	const fontKey = (options.fontKey as string) || 'noto-sans-kr';
	const font = allFonts[fontKey] as IDataObject | undefined;

	if (!font || !font.path) {
		throw new NodeOperationError(
			this.getNode(),
			`Selected font key '${fontKey}' is not valid or its file path is missing.`,
			{ itemIndex },
		);
	}

	const fontPath = font.path as string;
	
	// Set default values for text options
	const fontSize = options.size || 48;
	const fontColor = options.color || 'white';
	const startTime = options.startTime || 0;
	const endTime = options.endTime || 5;
	
	// Handle position based on position type
	let positionX: string;
	let positionY: string;
	
	const positionType = options.positionType || 'alignment';
	
	if (positionType === 'alignment') {
		const horizontalAlign = (options.horizontalAlign as string) || 'center';
		const verticalAlign = (options.verticalAlign as string) || 'bottom';
		const paddingX = (options.paddingX as number) ?? (options.padding as number) ?? 20;
		const paddingY = (options.paddingY as number) ?? (options.padding as number) ?? 20;
		
		const position = getPositionFromAlignment(horizontalAlign, verticalAlign, paddingX, paddingY);
		positionX = position.x;
		positionY = position.y;
	} else {
		// Custom position
		positionX = (options.x as string) || '(w-text_w)/2';
		positionY = (options.y as string) || 'h-th-10';
	}

	const outputPath = getTempFile(path.extname(video));
	const drawtext = `drawtext=fontfile=${fontPath}:text='${text.replace(
		/'/g,
		`''`,
	)}':fontsize=${fontSize}:fontcolor=${fontColor}:x=${positionX}:y=${positionY}:enable='between(t,${startTime},${endTime})'`;

	const command = ffmpeg(video).videoFilters(drawtext).audioCodec('copy').save(outputPath);

	try {
		await runFfmpeg(command);
	} catch (error) {
		let message = `Error adding text overlay. Please check all text style options (e.g., color, size, position).`;
		const errorMessage = (error as Error).message;
		if (errorMessage.includes('Cannot find color')) {
			message = `Error adding text overlay: An invalid color was specified. Please use a valid color name (e.g., 'yellow') or a hex code (e.g., 'FFFFFF').`;
		} else if (errorMessage.includes('font')) {
			message = `Error adding text overlay: There was an issue with the specified font. Please check the font name and ensure it is available.`;
		}
		throw new NodeOperationError(this.getNode(), `${message} FFmpeg error: ${errorMessage}`, {
			itemIndex,
		});
	}
	return outputPath;
} 