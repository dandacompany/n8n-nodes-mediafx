import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import ffmpeg = require('fluent-ffmpeg');
import { getTempFile, runFfmpeg } from '../utils';
import * as fs from 'fs-extra';

export interface SeparateAudioResult {
	videoPath: string;
	audioPath: string;
}

/**
 * Separates audio from video, returning both a muted video and the extracted audio track.
 *
 * @param input - Path to the input video file
 * @param videoFormat - Output format for the muted video (e.g., 'mp4', 'mov')
 * @param audioFormat - Output format for the extracted audio (e.g., 'mp3', 'aac', 'wav')
 * @param audioCodec - Audio codec to use (e.g., 'copy', 'libmp3lame', 'aac')
 * @param audioBitrate - Audio bitrate (e.g., '192k', '320k')
 * @param itemIndex - Current item index for error handling
 * @returns Object containing paths to both the muted video and extracted audio
 */
export async function executeSeparateAudio(
	this: IExecuteFunctions,
	input: string,
	videoFormat: string,
	audioFormat: string,
	audioCodec: string,
	audioBitrate: string,
	itemIndex: number,
): Promise<SeparateAudioResult> {
	const mutedVideoPath = getTempFile(`.${videoFormat}`);
	const audioOutputPath = getTempFile(`.${audioFormat}`);

	let finalAudioCodec = audioCodec;

	// If stream copy ('copy') is selected for a format that requires a specific
	// codec (like mp3), we must override it to prevent an FFmpeg error.
	if (finalAudioCodec === 'copy' && audioFormat === 'mp3') {
		finalAudioCodec = 'libmp3lame';
	}

	try {
		// Step 1: Create muted video (remove audio track)
		const mutedVideoCommand = ffmpeg(input)
			.output(mutedVideoPath)
			.noAudio()
			.videoCodec('copy'); // Copy video stream without re-encoding

		await runFfmpeg(mutedVideoCommand);

		// Step 2: Extract audio track
		const audioCommand = ffmpeg(input)
			.output(audioOutputPath)
			.noVideo()
			.audioCodec(finalAudioCodec)
			.audioBitrate(audioBitrate)
			.outputOptions('-map', '0:a:0'); // Select first audio stream

		await runFfmpeg(audioCommand);

		return {
			videoPath: mutedVideoPath,
			audioPath: audioOutputPath,
		};
	} catch (error) {
		// Clean up any created files on error
		await fs.remove(mutedVideoPath).catch(() => {});
		await fs.remove(audioOutputPath).catch(() => {});

		throw new NodeOperationError(
			this.getNode(),
			`Error separating audio from video. Please ensure the source video contains both video and audio tracks. FFmpeg error: ${
				(error as Error).message
			}`,
			{ itemIndex },
		);
	}
}
