const fs = require('fs');
const os = require('os');

// Don't run on Windows
if (os.platform() === 'win32') {
	console.log('Skipping chmod on Windows.');
	process.exit(0);
}

try {
	const ffmpeg = require('@ffmpeg-installer/ffmpeg');
	if (ffmpeg.path && fs.existsSync(ffmpeg.path)) {
		console.log(`Setting executable permission for ffmpeg at: ${ffmpeg.path}`);
		fs.chmodSync(ffmpeg.path, '755');
		console.log('FFmpeg permissions set successfully.');
	} else {
		console.warn('ffmpeg binary not found, skipping chmod.');
	}
} catch (e) {
	console.warn('Could not set permissions for ffmpeg. The package might be missing or another error occurred.');
	if (e instanceof Error) {
		console.warn(e.message);
	} else {
		console.warn(e);
	}
}

try {
	const ffprobe = require('@ffprobe-installer/ffprobe');
	if (ffprobe.path && fs.existsSync(ffprobe.path)) {
		console.log(`Setting executable permission for ffprobe at: ${ffprobe.path}`);
		fs.chmodSync(ffprobe.path, '755');
		console.log('ffprobe permissions set successfully.');
	} else {
		console.warn('ffprobe binary not found, skipping chmod.');
	}
} catch (e) {
	console.warn('Could not set permissions for ffprobe. The package might be missing or another error occurred.');
	if (e instanceof Error) {
		console.warn(e.message);
	} else {
		console.warn(e);
	}
} 