import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import ffmpeg = require('fluent-ffmpeg');
import { getTempFile, runFfmpeg } from '../utils';
import * as fs from 'fs-extra';

export async function executeSingleVideoFade(
	this: IExecuteFunctions,
	input: string,
	// effect is 'in' or 'out' from the UI options
	effect: 'in' | 'out',
	startTime: number,
	duration: number,
	outputFormat: string,
	itemIndex: number,
): Promise<string> {
	const outputPath = getTempFile(`.${outputFormat}`);
	const command = ffmpeg(input);

	// Apply both video and audio fades for a consistent effect
	const videoFade = `fade=type=${effect}:st=${startTime}:d=${duration}`;
	const audioFade = `afade=type=${effect}:st=${startTime}:d=${duration}`;

	command.videoFilters(videoFade).audioFilters(audioFade);

	command.save(outputPath);

	try {
		await runFfmpeg(command);
		return outputPath;
	} catch (error) {
		// Clean up output file if creation failed
		await fs.remove(outputPath).catch(() => {});
		
		// If the video has no audio, ffmpeg might throw an error for afade.
		// We provide a more descriptive error message in that case.
		const errorMessage = (error as Error).message;
		let displayMessage = `Error applying fade effect. Please check the effect parameters (start time, duration).`;
		if (errorMessage.includes('Cannot find a matching stream for unlabeled')) {
			displayMessage = `Error applying audio fade: The source video may not have an audio track.`;
		}

		throw new NodeOperationError(this.getNode(), `${displayMessage} FFmpeg error: ${errorMessage}`, {
			itemIndex,
		});
	}
} 