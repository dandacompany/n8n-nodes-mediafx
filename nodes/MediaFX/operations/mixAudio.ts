import { IDataObject, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { getTempFile, runFfmpeg, fileHasAudio, createSilentAudio, getDuration, verifyFfmpegAvailability } from '../utils';
import ffmpeg = require('fluent-ffmpeg');

export async function executeMixAudio(
	this: IExecuteFunctions,
	videoPath: string,
	audioPath: string,
	videoVolume: number,
	audioVolume: number,
	matchLength: 'shortest' | 'longest' | 'first',
	advancedMixing: IDataObject,
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

	const outputPath = getTempFile('.mp4');
	
	const {
		enablePartialMix = false,
		startTime = 0,
		duration,
		loop = false,
		enableFadeIn = false,
		fadeInDuration = 1,
		enableFadeOut = false,
		fadeOutDuration = 1,
	} = advancedMixing as {
		enablePartialMix?: boolean;
		startTime?: number;
		duration?: number;
		loop?: boolean;
		enableFadeIn?: boolean;
		fadeInDuration?: number;
		enableFadeOut?: boolean;
		fadeOutDuration?: number;
	};


	// Check if both inputs have audio
	const videoHasAudio = await fileHasAudio(videoPath);
	const audioFileHasAudio = await fileHasAudio(audioPath);

	// If the "audio" file doesn't have audio, throw an error
	if (!audioFileHasAudio) {
		throw new NodeOperationError(
			this.getNode(),
			'The secondary audio source does not contain any audio stream',
			{ itemIndex },
		);
	}

	// If video doesn't have audio, we'll create a silent audio track for it
	let actualVideoPath = videoPath;
	let videoCleanup: (() => Promise<void>) | null = null;
	
	if (!videoHasAudio) {
		const videoDuration = await getDuration(videoPath);
		const { filePath: silentAudioPath, cleanup } = await createSilentAudio(videoDuration);
		videoCleanup = cleanup;
		
		// Create a temporary video with silent audio
		const tempVideoWithAudio = getTempFile('.mp4');
		const addSilentCommand = ffmpeg()
			.input(videoPath)
			.input(silentAudioPath)
			.outputOptions(['-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-shortest'])
			.save(tempVideoWithAudio);
		
		await runFfmpeg(addSilentCommand);
		await cleanup(); // Clean up the silent audio file
		
		actualVideoPath = tempVideoWithAudio;
		videoCleanup = () => require('fs-extra').remove(tempVideoWithAudio);
	}

	const command = ffmpeg().input(actualVideoPath).input(audioPath);

	if (enablePartialMix) {
		// Get audio duration to determine processing strategy
		const audioDuration = await getDuration(audioPath);
		
		// If duration is not provided (null/undefined), use audio duration
		const actualDuration = duration || audioDuration;
		
		let audioProcessingChain = '[1:a]';
		
		// Step 1: Handle looping if needed
		if (loop && audioDuration < actualDuration) {
			audioProcessingChain += 'aloop=loop=-1:size=2e9,';
		}
		
		// Step 2: Trim to duration
		if (loop && audioDuration < actualDuration || audioDuration >= actualDuration) {
			audioProcessingChain += `atrim=duration=${actualDuration},`;
		}
		
		// Step 3: Reset timestamps
		audioProcessingChain += 'asetpts=PTS-STARTPTS,';
		
		// Step 4: Apply fade effects
		const fadeFilters = [];
		if (enableFadeIn) {
			fadeFilters.push(`afade=t=in:st=0:d=${fadeInDuration}`);
		}
		if (enableFadeOut) {
			const fadeOutStart = Math.max(0, actualDuration - fadeOutDuration);
			fadeFilters.push(`afade=t=out:st=${fadeOutStart}:d=${fadeOutDuration}`);
		}
		
		if (fadeFilters.length > 0) {
			audioProcessingChain += fadeFilters.join(',') + ',';
		}
		
		// Step 5: Set volume and add delay
		audioProcessingChain += `volume=${audioVolume},adelay=${startTime * 1000}|${startTime * 1000}[overlay_audio]`;
		
		const filterComplex = 
			audioProcessingChain + ';' +
			`[0:a]volume=${videoVolume}[main_audio];` +
			`[main_audio][overlay_audio]amix=inputs=2:duration=first:dropout_transition=0[mixed_audio]`;

		command
			.complexFilter(filterComplex)
			.outputOptions(['-map', '0:v', '-map', '[mixed_audio]', '-c:v copy']);
	} else {
		// Standard full audio mix
		command.complexFilter(
			`[0:a]volume=${videoVolume}[a0]; [1:a]volume=${audioVolume}[a1]; [a0][a1]amix=inputs=2:duration=${matchLength}[a]`,
		)
		.outputOptions(['-map', '0:v', '-map', '[a]', '-c:v copy']);
	}

	command.save(outputPath);

	try {
		await runFfmpeg(command);
		
		// Clean up temporary video file if we created one
		if (videoCleanup) {
			await videoCleanup();
		}
	} catch (error) {
		// Clean up on error too
		if (videoCleanup) {
			await videoCleanup().catch(() => {});
		}
		throw new NodeOperationError(
			this.getNode(),
			`Error mixing audio: ${(error as Error).message}`,
			{ itemIndex },
		);
	}

	return outputPath;
} 