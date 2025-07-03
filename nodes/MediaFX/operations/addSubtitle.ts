import { IExecuteFunctions, NodeOperationError, IDataObject } from 'n8n-workflow';
import * as path from 'path';
import * as fs from 'fs-extra';
import ffmpeg = require('fluent-ffmpeg');
// import SrtParser from 'srt-parser-2';
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

// Helper to convert srt time format "00:00:08,220" to seconds
function srtTimeToSeconds(time: string): number {
	const parts = time.split(/[:,]/);
	const hours = parseInt(parts[0], 10);
	const minutes = parseInt(parts[1], 10);
	const seconds = parseInt(parts[2], 10);
	const milliseconds = parseInt(parts[3], 10);
	return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

interface SrtEntry {
	id: string;
	startTime: string;
	endTime: string;
	text: string;
}

export async function executeAddSubtitle(
	this: IExecuteFunctions,
	video: string,
	subtitleFile: string,
	style: IDataObject,
	itemIndex: number,
): Promise<string> {
	const outputPath = getTempFile(path.extname(video));

	// 1. Get Font Path from fontKey
	const allFonts = getAvailableFonts();
	const fontKey = (style.fontKey as string) || 'noto-sans-kr';
	const font = allFonts[fontKey] as IDataObject | undefined;

	if (!font || !font.path) {
		throw new NodeOperationError(
			this.getNode(),
			`Selected font key '${fontKey}' is not valid or its file path is missing.`,
			{ itemIndex },
		);
	}
	const fontPath = font.path as string;

	// 2. Parse SRT file
	const srtContent = fs.readFileSync(subtitleFile, 'utf8');
	const SrtParser = (await import('srt-parser-2')).default;
	const parser = new SrtParser();
	const srtEntries: SrtEntry[] = parser.fromSrt(srtContent);

	if (srtEntries.length === 0) {
		throw new NodeOperationError(this.getNode(), `Could not parse SRT file or it is empty.`, {
			itemIndex,
		});
	}

	// 3. Handle position based on position type
	let positionX: string;
	let positionY: string;
	
	const positionType = style.positionType || 'alignment';
	
	if (positionType === 'alignment') {
		const horizontalAlign = (style.horizontalAlign as string) || 'center';
		const verticalAlign = (style.verticalAlign as string) || 'bottom';
		const paddingX = (style.paddingX as number) ?? (style.padding as number) ?? 20;
		const paddingY = (style.paddingY as number) ?? (style.padding as number) ?? 20;
		
		const position = getPositionFromAlignment(horizontalAlign, verticalAlign, paddingX, paddingY);
		positionX = position.x;
		positionY = position.y;
	} else {
		// Custom position
		positionX = (style.x as string) || '(w-text_w)/2';
		positionY = (style.y as string) || 'h-th-50';
	}

	// 4. Build drawtext filter chain
	const drawtextFilters = srtEntries.map((entry: SrtEntry) => {
		const text = entry.text.replace(/'/g, `''`).replace(/:/g, `\\:`); // Escape single quotes and colons for ffmpeg
		const startTime = srtTimeToSeconds(entry.startTime);
		const endTime = srtTimeToSeconds(entry.endTime);

		const styleArgs = [
			`fontfile=${fontPath}`,
			`text='${text}'`,
			`fontsize=${style.size || 48}`,
			`fontcolor=${style.color || 'white'}`,
			`box=1:boxcolor=black@0.5:boxborderw=5`, // Optional: Add a semi-transparent background box
			`x=${positionX}`,
			`y=${positionY}`,
			`enable='between(t,${startTime},${endTime})'`,
		];
		return `drawtext=${styleArgs.join(':')}`;
	});

	const command = ffmpeg(video)
		.videoFilters(drawtextFilters)
		.audioCodec('copy')
		.save(outputPath);

	try {
		await runFfmpeg(command);
	} catch (error) {
		const errorMessage = (error as Error).message;
		throw new NodeOperationError(
			this.getNode(),
			`Error burning subtitles. Please check subtitle file and style options. FFmpeg error: ${errorMessage}`,
			{
				itemIndex,
			},
		);
	}
	return outputPath;
} 