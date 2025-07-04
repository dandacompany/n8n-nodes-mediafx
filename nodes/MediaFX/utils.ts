import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg = require('fluent-ffmpeg');
import axios from 'axios';
import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { IDataObject } from 'n8n-workflow';
import * as os from 'os';

// Initialize FFmpeg with comprehensive fallback strategy
let ffmpegPath: string | null = null;
let ffmpegInitialized = false;

function tryInitializeFfmpeg(): boolean {
	if (ffmpegInitialized) return true;

	// Strategy 1: Try @ffmpeg-installer/ffmpeg package (most reliable)
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const ffprobeInstaller = require('@ffprobe-installer/ffprobe');

		const ffmpegInstallerPath = ffmpegInstaller.path;
		const ffprobeInstallerPath = ffprobeInstaller.path;

		if (ffmpegInstallerPath && fs.existsSync(ffmpegInstallerPath) && ffprobeInstallerPath && fs.existsSync(ffprobeInstallerPath)) {
			// Set executable permissions dynamically
			if (os.platform() !== 'win32') {
				try {
					fs.chmodSync(ffmpegInstallerPath, '755');
					fs.chmodSync(ffprobeInstallerPath, '755');
					console.log('Dynamically set permissions for ffmpeg and ffprobe.');
				} catch (permissionError) {
					console.warn('Failed to set executable permissions dynamically:', permissionError);
					// Continue anyway, as it might work in some environments
				}
			}

			ffmpeg.setFfmpegPath(ffmpegInstallerPath);
			ffmpeg.setFfprobePath(ffprobeInstallerPath);
			ffmpegPath = ffmpegInstallerPath;
			ffmpegInitialized = true;
			console.log(`FFmpeg initialized with @ffmpeg-installer: ${ffmpegInstallerPath}`);
			console.log(`FFprobe initialized with @ffprobe-installer: ${ffprobeInstallerPath}`);
			return true;
		} else {
			console.warn('@ffmpeg-installer or @ffprobe-installer path exists but binary not found:', {ffmpegInstallerPath, ffprobeInstallerPath});
		}
	} catch (error) {
		console.warn('@ffmpeg-installer or @ffprobe-installer package not available:', (error as Error).message);
	}

	// Strategy 2: Try ffmpeg-static package (fallback)
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const staticPath = require('ffmpeg-static');
		if (staticPath && fs.existsSync(staticPath)) {
			ffmpeg.setFfmpegPath(staticPath);
			ffmpegPath = staticPath;
			ffmpegInitialized = true;
			console.log(`FFmpeg initialized with ffmpeg-static: ${staticPath}`);
			return true;
		} else {
			console.warn('ffmpeg-static path exists but binary not found:', staticPath);
		}
	} catch (error) {
		console.warn('ffmpeg-static package not available:', (error as Error).message);
	}

	// Strategy 3: Try system PATH
	try {
		const { execSync } = require('child_process');
		const systemPath = execSync('which ffmpeg 2>/dev/null || where ffmpeg 2>nul', { 
			encoding: 'utf8',
			timeout: 3000 
		}).trim();
		
		if (systemPath && fs.existsSync(systemPath)) {
			ffmpeg.setFfmpegPath(systemPath);
			ffmpegPath = systemPath;
			ffmpegInitialized = true;
			console.log(`FFmpeg initialized with system binary: ${systemPath}`);
			return true;
		}
	} catch (error) {
		console.warn('System FFmpeg not found:', (error as Error).message);
	}

	// Strategy 4: Try common installation paths
	const commonPaths = [
		'/usr/bin/ffmpeg',
		'/usr/local/bin/ffmpeg',
		'/opt/homebrew/bin/ffmpeg',
		'C:\\ffmpeg\\bin\\ffmpeg.exe',
		'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe'
	];

	for (const testPath of commonPaths) {
		try {
			if (fs.existsSync(testPath)) {
				ffmpeg.setFfmpegPath(testPath);
				ffmpegPath = testPath;
				ffmpegInitialized = true;
				console.log(`FFmpeg initialized with common path: ${testPath}`);
				return true;
			}
		} catch (error) {
			// Continue to next path
		}
	}

	console.error('FFmpeg not found in any location. Manual installation required.');
	return false;
}

// Try to initialize FFmpeg on module load
tryInitializeFfmpeg();

const TEMP_DIR = path.resolve(__dirname, '..', '..', 'temp_mediafx');
fs.ensureDirSync(TEMP_DIR);

// Function to verify FFmpeg is available
export function verifyFfmpegAvailability(): void {
	// First try to reinitialize if not already done
	if (!ffmpegInitialized) {
		const success = tryInitializeFfmpeg();
		if (!success) {
			throw new Error(
				'FFmpeg is not available on this system. ' +
				'Please install FFmpeg manually using one of these methods:\n' +
				'Ubuntu/Debian: sudo apt update && sudo apt install ffmpeg\n' +
				'CentOS/RHEL: sudo dnf install ffmpeg\n' +
				'Alpine: apk add ffmpeg\n' +
				'macOS: brew install ffmpeg\n' +
				'Or ensure ffmpeg-static package is properly installed.'
			);
		}
	}

	// Test the FFmpeg binary
	try {
		const { execSync } = require('child_process');
		if (!ffmpegPath) {
			throw new Error('FFmpeg path not set');
		}
		
		// Test if the binary is executable
		execSync(`"${ffmpegPath}" -version`, { 
			stdio: 'pipe', 
			timeout: 5000,
			encoding: 'utf8'
		});
		
		console.log(`FFmpeg verification successful: ${ffmpegPath}`);
	} catch (error) {
		// Try to reinitialize one more time
		ffmpegInitialized = false;
		ffmpegPath = null;
		const retrySuccess = tryInitializeFfmpeg();
		
		if (!retrySuccess) {
			throw new Error(
				'FFmpeg binary test failed. ' +
				'Please install FFmpeg manually on your server:\n' +
				'Ubuntu/Debian: sudo apt update && sudo apt install ffmpeg\n' +
				'CentOS/RHEL: sudo dnf install ffmpeg\n' +
				'Alpine: apk add ffmpeg\n' +
				'macOS: brew install ffmpeg\n' +
				`Original error: ${(error as Error).message}`
			);
		}
	}
}

export function getTempFile(extension: string): string {
	return path.join(TEMP_DIR, `${uuidv4()}${extension}`);
}

// Utility function to clean up old temporary files
export async function cleanupOldTempFiles(maxAgeHours: number = 24): Promise<void> {
	try {
		if (!fs.existsSync(TEMP_DIR)) {
			return;
		}

		const files = await fs.readdir(TEMP_DIR);
		const now = Date.now();
		const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert hours to milliseconds

		for (const file of files) {
			const filePath = path.join(TEMP_DIR, file);
			try {
				const stats = await fs.stat(filePath);
				const age = now - stats.mtime.getTime();
				
				if (age > maxAge) {
					await fs.remove(filePath);
					console.log(`Cleaned up old temp file: ${file}`);
				}
			} catch (error) {
				// Ignore errors for individual files (file might be in use, etc.)
				console.warn(`Could not clean up temp file ${file}:`, (error as Error).message);
			}
		}
	} catch (error) {
		console.warn('Error during temp file cleanup:', (error as Error).message);
	}
}

export async function downloadSource(url: string): Promise<{ filePath: string; cleanup: () => Promise<void> }> {
	const tempPath = getTempFile(path.extname(new URL(url).pathname) || '.tmp');
	const writer = fs.createWriteStream(tempPath);

	const response = await axios({
		url,
		method: 'GET',
		responseType: 'stream',
	});

	response.data.pipe(writer);

	return new Promise((resolve, reject) => {
		writer.on('finish', () => resolve({ filePath: tempPath, cleanup: () => fs.remove(tempPath) }));
		writer.on('error', (err: Error) => {
			fs.remove(tempPath).catch(() => {});
			reject(err);
		});
	});
}

export async function createTempFileFromBuffer(
	buffer: Buffer,
	originalFilename?: string,
): Promise<{ filePath: string; cleanup: () => Promise<void> }> {
	const extension = path.extname(originalFilename || '.tmp');
	const tempPath = getTempFile(extension);
	await fs.writeFile(tempPath, buffer);
	return { filePath: tempPath, cleanup: () => fs.remove(tempPath) };
}

export async function resolveInputs(
	executeFunctions: IExecuteFunctions,
	itemIndex: number,
	sourcesConfig: Array<{ sourceType: string; value: string; binaryProperty?: string }>,
): Promise<{ paths: string[]; cleanup: () => Promise<void> }> {
	const cleanupFunctions: (() => Promise<void>)[] = [];
	const paths: string[] = [];

	for (const source of sourcesConfig) {
		let inputPath: string;
		switch (source.sourceType) {
			case 'url': {
				const { filePath, cleanup } = await downloadSource(source.value);
				inputPath = filePath;
				cleanupFunctions.push(cleanup);
				break;
			}
			case 'binary': {
				if (!source.binaryProperty) {
					throw new NodeOperationError(
						executeFunctions.getNode(),
						'Binary property name is not defined for binary source.',
					);
				}
				const item = executeFunctions.getInputData()[itemIndex];
				const binaryData = item.binary;

				if (!binaryData || !binaryData[source.binaryProperty]) {
					throw new NodeOperationError(
						executeFunctions.getNode(),
						`Binary data not found in property "${source.binaryProperty}"`,
						{ itemIndex },
					);
				}

				const originalFilename = binaryData[source.binaryProperty].fileName;
				const buffer = await executeFunctions.helpers.getBinaryDataBuffer(
					itemIndex,
					source.binaryProperty,
				);
				const { filePath, cleanup } = await createTempFileFromBuffer(buffer, originalFilename);
				inputPath = filePath;
				cleanupFunctions.push(cleanup);
				break;
			}
			default:
				throw new NodeOperationError(executeFunctions.getNode(), `Unsupported source type: ${source.sourceType}`);
		}
		paths.push(inputPath);
	}

	const cleanup = async () => {
		for (const func of cleanupFunctions) {
			await func();
		}
	};

	return { paths, cleanup };
}

export function getDuration(filePath: string): Promise<number> {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(filePath, (err, metadata) => {
			if (err) {
				return reject(new Error(`Failed to get video duration: ${err.message}`));
			}
			const duration = metadata.format.duration;
			if (typeof duration !== 'number' || !isFinite(duration)) {
				// Fallback for streams with no duration metadata (like image inputs)
				const videoStream = metadata.streams.find(s => s.codec_type === 'video');
				if(videoStream && videoStream.duration && isFinite(Number(videoStream.duration))) {
					return resolve(Number(videoStream.duration));
				}
				// If it's an image or format without duration, default to a sensible value like 0
				// The caller should handle this case.
				return resolve(0);
			}
			resolve(duration);
		});
	});
}

export async function createSilentAudio(duration: number): Promise<{ filePath: string; cleanup: () => Promise<void> }> {
	const outputPath = getTempFile('.aac');
	const cleanup = () => fs.remove(outputPath);

	if (duration <= 0) {
		// Create a very short, almost zero-length silent audio file for inputs like images.
		duration = 0.01;
	}

	const command = ffmpeg()
		.input('anullsrc')
		.inputOptions('-f', 'lavfi')
		.audioCodec('aac')
		.duration(duration)
		.save(outputPath);

	await runFfmpeg(command);

	return { filePath: outputPath, cleanup };
}

export function runFfmpeg(command: ffmpeg.FfmpegCommand): Promise<void> {
	return new Promise((resolve, reject) => {
		command.on('end', () => resolve());
		// @ts-ignore - The type definitions for fluent-ffmpeg seem to have an issue here.
		command.on('error', (err: Error, stdout: string, stderr: string) => {
			const errorMessage = `${err.message} (ffmpeg stderr: ${stderr})`;
			reject(new Error(errorMessage));
		});
		command.run();
	});
}

export function getVideoStreamInfo(filePath: string): Promise<ffmpeg.FfprobeStream | undefined> {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(filePath, (err, metadata) => {
			if (err) {
				return reject(new Error(`Failed to probe file: ${err.message}`));
			}
			const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
			resolve(videoStream);
		});
	});
}

export function fileHasAudio(filePath: string): Promise<boolean> {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(filePath, (err, metadata) => {
			if (err) {
				return reject(new Error(`Failed to probe file: ${err.message}`));
			}
			const hasAudio = metadata.streams.some((s) => s.codec_type === 'audio');
			resolve(hasAudio);
		});
	});
}

// ====================================================================
// FONT MANAGEMENT HELPERS
// ====================================================================

// Define paths for font management
const BASE_FONTS_DIR = path.resolve(__dirname, '..', '..', 'fonts');
const USER_FONTS_DIR = path.join(BASE_FONTS_DIR, 'user');
const USER_FONTS_JSON = path.join(USER_FONTS_DIR, 'user-fonts.json');

// System-registered fonts (must exist in BASE_FONTS_DIR)
export const REGISTERED_FONTS: IDataObject = {
	'noto-sans-kr': { name: 'Noto Sans KR', filename: 'NotoSansKR-Regular.ttf', description: 'Google Noto Sans KR', type: 'korean' },
	'nanum-gothic': { name: 'Nanum Gothic', filename: 'NanumGothic-Regular.ttf', description: 'Naver Nanum Gothic', type: 'korean' },
	'pretendard': { name: 'Pretendard', filename: 'Pretendard-Regular.otf', description: 'Pretendard', type: 'korean' },
	'roboto': { name: 'Roboto', filename: 'Roboto-Regular.ttf', description: 'Google Roboto', type: 'global' },
	'inter': { name: 'Inter', filename: 'Inter-Regular.ttf', description: 'Inter UI Font', type: 'global' },
	'dejavu-sans': { name: 'DejaVu Sans', filename: 'DejaVuSans.ttf', description: 'Default fallback font', type: 'fallback' },
};

// Helper functions for font management
function ensureUserFontsDirectory() {
	if (!fs.existsSync(USER_FONTS_DIR)) {
		fs.mkdirSync(USER_FONTS_DIR, { recursive: true });
	}
}

export function getUserFonts(): IDataObject {
	ensureUserFontsDirectory();
	if (!fs.existsSync(USER_FONTS_JSON)) {
		return {};
	}
	try {
		const data = fs.readFileSync(USER_FONTS_JSON, 'utf8');
		return JSON.parse(data);
	} catch (error) {
		return {};
	}
}

function saveUserFonts(userFonts: IDataObject) {
	ensureUserFontsDirectory();
	fs.writeFileSync(USER_FONTS_JSON, JSON.stringify(userFonts, null, 2));
}

export function getAvailableFonts(): IDataObject {
	const fonts: IDataObject = {};

	// Add registered fonts
	for (const [key, font] of Object.entries(REGISTERED_FONTS)) {
		const fontPath = path.join(BASE_FONTS_DIR, (font as IDataObject).filename as string);
		if (fs.existsSync(fontPath)) {
			fonts[key] = { ...(font as IDataObject), path: fontPath, type: (font as IDataObject).type || 'system' };
		}
	}

	// Add user fonts
	const userFonts = getUserFonts();
	for (const [key, font] of Object.entries(userFonts)) {
		const fontPath = path.join(USER_FONTS_DIR, (font as IDataObject).filename as string);
		if (fs.existsSync(fontPath)) {
			fonts[key] = { ...(font as IDataObject), path: fontPath, type: 'user' };
		}
	}

	return fonts;
}

export function validateFontKey(fontKey: string) {
	const keyPattern = /^[a-zA-Z0-9_-]{3,50}$/;
	if (!keyPattern.test(fontKey)) {
		throw new Error('Font key must be 3-50 characters, containing only letters, numbers, hyphens, and underscores.');
	}

	const allFonts = getAvailableFonts();
	if (allFonts[fontKey]) {
		throw new Error('Font key already exists. Please use a different key.');
	}
}

export function saveUserFont(fontKey: string, fontName: string, description: string, originalFilename: string, buffer: Buffer) {
	validateFontKey(fontKey);

	const ext = path.extname(originalFilename);
	const filename = `${fontKey}${ext}`;
	const fontPath = path.join(USER_FONTS_DIR, filename);

	fs.writeFileSync(fontPath, buffer);

	const userFonts = getUserFonts();
	userFonts[fontKey] = {
		name: fontName || fontKey,
		filename,
		description,
		createdAt: new Date().toISOString(),
	};
	saveUserFonts(userFonts);

	return { fontKey, path: fontPath, metadata: userFonts[fontKey] };
}

export function deleteUserFont(fontKey: string) {
	const userFonts = getUserFonts();
	const font = userFonts[fontKey] as IDataObject;

	if (!font) {
		throw new Error(`User font with key '${fontKey}' not found.`);
	}

	const fontPath = path.join(USER_FONTS_DIR, font.filename as string);
	if (fs.existsSync(fontPath)) {
		fs.unlinkSync(fontPath);
	}

	delete userFonts[fontKey];
	saveUserFonts(userFonts);

	return true;
} 