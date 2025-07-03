import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import ffmpeg = require('fluent-ffmpeg');
import * as fs from 'fs-extra';
import { getTempFile, runFfmpeg, fileHasAudio, getVideoStreamInfo, getDuration, createSilentAudio } from '../utils';

async function normalizeVideo(
	this: IExecuteFunctions,
	inputPath: string,
	refInfo: ffmpeg.FfprobeStream,
): Promise<{ normalizedPath: string; cleanup: () => Promise<void> }> {
	const normalizedPath = getTempFile('.ts');
	const mainCleanup = () => fs.remove(normalizedPath);
	let silentAudioCleanup: (() => Promise<void>) | null = null;

	const hasAudio = await fileHasAudio(inputPath);
	const command = ffmpeg(inputPath);

	if (!hasAudio) {
		const duration = await getDuration(inputPath);
		const { filePath: silentAudioPath, cleanup } = await createSilentAudio(duration);
		command.addInput(silentAudioPath);
		silentAudioCleanup = cleanup;
	}

	const targetWidth = refInfo.width!;
	const targetHeight = refInfo.height!;
	const targetSar = (refInfo.sample_aspect_ratio && refInfo.sample_aspect_ratio !== 'N/A') ? refInfo.sample_aspect_ratio : '1:1';
	const targetFrameRate = refInfo.r_frame_rate || '30';
	const targetPixFmt = 'yuv420p';

	const videoFilter = `[0:v]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:-1:-1:color=black,setsar=${targetSar},format=${targetPixFmt},fps=${targetFrameRate},setpts=PTS-STARTPTS[v_out]`;
	const audioFilter = hasAudio
		? `[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS[a_out]`
		: `[1:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS[a_out]`;

	command
		.complexFilter([videoFilter, audioFilter])
		.outputOptions(['-map', '[v_out]', '-map', '[a_out]'])
		.videoCodec('libx264')
		.audioCodec('aac')
		.save(normalizedPath);

	await runFfmpeg(command);

	const combinedCleanup = async () => {
		await mainCleanup();
		if (silentAudioCleanup) {
			await silentAudioCleanup();
		}
	};

	return { normalizedPath, cleanup: combinedCleanup };
}

export async function executeMerge(
	this: IExecuteFunctions,
	inputs: string[],
	outputFormat: string,
	itemIndex: number,
): Promise<string> {
	if (inputs.length < 1) {
		throw new NodeOperationError(this.getNode(), 'Merge operation requires at least one source.', {
			itemIndex,
		});
	}

	const intermediateFiles: { path: string; cleanup: () => Promise<void> }[] = [];
	const finalCleanup = async () => {
		for (const file of intermediateFiles) {
			await file.cleanup();
		}
	};

	try {
		const videoInfos = await Promise.all(inputs.map(getVideoStreamInfo));
		const refInfo = videoInfos.find((info) => info !== undefined);

		if (!refInfo || !refInfo.width || !refInfo.height) {
			throw new NodeOperationError(
				this.getNode(),
				'Could not determine reference video properties for merging. At least one input must be a valid video.',
				{ itemIndex },
			);
		}

		// 1. Normalization Stage
		for (const inputPath of inputs) {
			const { normalizedPath, cleanup } = await normalizeVideo.call(
				this,
				inputPath,
				refInfo,
			);
			intermediateFiles.push({ path: normalizedPath, cleanup });
		}

		// 2. Merging Stage - Using the concat protocol for stability
		const outputPath = getTempFile(`.${outputFormat}`);
		const normalizedPaths = intermediateFiles.map((f) => f.path);

		const concatString = `concat:${normalizedPaths.join('|')}`;

		const command = ffmpeg()
			.input(concatString)
			.outputOptions('-c', 'copy')
			.save(outputPath);

		await runFfmpeg(command);

		return outputPath;
	} catch (error) {
		await finalCleanup();
		throw new NodeOperationError(
			this.getNode(),
			`Error merging videos. Please ensure all source videos are valid. FFmpeg error: ${
				(error as Error).message
			}`,
			{ itemIndex },
		);
	} finally {
		await finalCleanup();
	}
} 