import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface FFmpegCapabilities {
	version: string;
	major: number;
	minor: number;
	patch: number;
	hasXfade: boolean;
	hasGlTransitions: boolean;
}

let cachedCapabilities: FFmpegCapabilities | null = null;

export async function getFFmpegCapabilities(): Promise<FFmpegCapabilities> {
	if (cachedCapabilities) {
		return cachedCapabilities;
	}

	try {
		const { stdout } = await execAsync('ffmpeg -version');
		const versionMatch = stdout.match(/ffmpeg version (\d+)\.(\d+)(?:\.(\d+))?/);
		
		if (!versionMatch) {
			// Fallback for non-standard version formats
			const altMatch = stdout.match(/ffmpeg version N-\d+-g[a-f0-9]+-static/);
			if (altMatch) {
				// This is likely an old static build
				cachedCapabilities = {
					version: altMatch[0],
					major: 4,
					minor: 2,
					patch: 0,
					hasXfade: false,
					hasGlTransitions: false,
				};
				return cachedCapabilities;
			}
			throw new Error('Could not parse FFmpeg version');
		}

		const major = parseInt(versionMatch[1], 10);
		const minor = parseInt(versionMatch[2], 10);
		const patch = parseInt(versionMatch[3] || '0', 10);

		// xfade was added in FFmpeg 4.3
		const hasXfade = major > 4 || (major === 4 && minor >= 3);
		
		// GL transitions require FFmpeg built with OpenGL support
		const hasGlTransitions = stdout.includes('--enable-opengl');

		cachedCapabilities = {
			version: `${major}.${minor}.${patch}`,
			major,
			minor,
			patch,
			hasXfade,
			hasGlTransitions,
		};

		return cachedCapabilities;
	} catch (error) {
		// Default to conservative capabilities if version check fails
		cachedCapabilities = {
			version: 'unknown',
			major: 4,
			minor: 0,
			patch: 0,
			hasXfade: false,
			hasGlTransitions: false,
		};
		return cachedCapabilities;
	}
}

export async function checkTransitionSupport(transition: string): Promise<{
	supported: boolean;
	alternative?: string;
	message?: string;
}> {
	const capabilities = await getFFmpegCapabilities();

	// Simple transitions that work with basic filters
	const simpleTransitions = ['fade', 'fadeblack', 'fadewhite'];
	
	// Transitions that require xfade filter
	const xfadeTransitions = [
		'wipeleft', 'wiperight', 'wipeup', 'wipedown',
		'slideleft', 'slideright', 'slideup', 'slidedown',
		'circlecrop', 'rectcrop', 'distance', 'fadegrays',
		'radial', 'circleopen', 'circleclose', 'pixelize',
		'dissolve', 'diagtl', 'boxin', 'iris'
	];

	if (simpleTransitions.includes(transition)) {
		return { supported: true };
	}

	if (xfadeTransitions.includes(transition)) {
		if (capabilities.hasXfade) {
			return { supported: true };
		} else {
			return {
				supported: false,
				alternative: 'fade',
				message: `The '${transition}' effect requires FFmpeg 4.3+. Using 'fade' as fallback.`
			};
		}
	}

	// Unknown transition
	return {
		supported: false,
		alternative: 'fade',
		message: `Unknown transition '${transition}'. Using 'fade' as fallback.`
	};
}