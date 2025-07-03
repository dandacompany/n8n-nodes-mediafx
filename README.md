# n8n-nodes-mediafx

[![NPM Version](https://img.shields.io/npm/v/n8n-nodes-mediafx?style=flat-square)](https://www.npmjs.com/package/n8n-nodes-mediafx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![N8N Community Node](https://img.shields.io/badge/n8n-community--node-blue.svg?style=flat-square)](https://n8n.io)

This repository contains a custom n8n node for comprehensive, local media processing using the power of FFmpeg. It allows you to perform a wide range of video, audio, image, and text operations directly within your n8n workflows without needing any external API or service.

<!-- Optional: Add a GIF of the node in action here -->
<!-- <p align="center"><img src="link/to/your/demo.gif" alt="MediaFX Node Demo"></p> -->

## Why use MediaFX?

-   **Privacy-Focused**: All processing happens locally on your n8n instance. Your media files never leave your server.
-   **No External APIs**: No need for API keys, subscriptions, or paying for a third-party service.
-   **Powerful**: Leverages the full capabilities of FFmpeg for high-quality media manipulation.
-   **Self-Contained**: `ffmpeg` is automatically included. No manual installation of system dependencies is required.
-   **Flexible**: Handles a wide variety of operations, from simple trims to complex audio mixing and text overlays.

## Features

-   **Video Processing**: Merge multiple clips, trim sections, apply cross-fade transitions, and add fade-in/out effects.
-   **Audio Manipulation**: Extract audio from video, and mix in new audio tracks with options for volume control, full track mixing, or partial mixing over specific durations.
-   **Image Operations**: Convert images into video clips with custom dimensions and duration. Overlay images as watermarks with control over position and opacity.
-   **Text and Subtitles**: Burn text overlays onto videos with extensive styling options (font, size, color, position, background box). Add and style external subtitle files (`.srt`).
-   **Font Management**: Upload, list, preview, and delete your own custom fonts (TTF, OTF) to be used in text operations.

## Installation for n8n

1.  Go to **Settings > Community Nodes**.
2.  Click **Install**.
3.  Enter `n8n-nodes-mediafx` in the **Enter npm package name** field.
4.  Click **Install** again.

The node will be installed, and n8n will restart. You should then see the "MediaFX" node in your node panel.

For older n8n versions or manual installation:

1.  Navigate to your n8n user data folder (by default, `~/.n8n/`).
2.  Enter the `nodes` directory: `cd ~/.n8n/nodes`.
3.  Install the package: `npm install n8n-nodes-mediafx`.
4.  Restart your n8n instance.

## Node: MediaFX

This is the main node for all media processing operations. You select a `resource` type and then an `operation` to perform on that resource.

### Resources & Operations

#### **Video** Resource
-   `Merge`: Combine multiple video files into a single video.
-   `Trim`: Cut a video to a specific start and end time.
-   `Mix Audio`: Mix an audio file into the video's existing audio track.
-   `Add Text`: Burn a text overlay onto the video.
-   `Add Subtitle File`: Add subtitles from an `.srt` file.
-   `Stamp Image`: Overlay an image (watermark) on the video.

#### **Audio** Resource
-   `Extract`: Extract the audio track from a video file into a specified format (e.g., mp3, aac).
-   `Mix Audio`: Mix a primary video's audio with a secondary audio source. Includes advanced options to mix into a specific time segment with looping.

#### **Image** Resource
-   `Image to Video`: Create a video from a source image, specifying duration and output dimensions.
-   `Stamp Image`: Overlay an image onto a video with positioning and opacity options.

#### **Transition** Resource
-   `Apply`: Apply a transition effect between two or more video clips.
-   `Fade`: Apply a fade-in or fade-out effect to a video clip.

#### **Font** Resource
-   `List`: Get a list of all available system and user-uploaded fonts.
-   `Upload`: Upload a custom font file (`.ttf`, `.otf`) for use in text operations.
-   `Delete`: Remove a previously uploaded user font.
-   `Preview`: Get metadata for a specific font.
-   `Validate`: Check if a font key is unique before uploading.

## Usage Examples

### Convert Image to Video
Create a 10-second video at 1920x1080 from a single image.

```json
{
  "resource": "image",
  "operation": "imageToVideo",
  "sourceImage": {
    "source": { "sourceType": "binary", "binaryProperty": "data" }
  },
  "duration": 10,
  "videoSize": {
    "width": 1920,
    "height": 1080
  },
  "outputFormat": "mp4"
}
```

### Advanced Audio Mix
Mix `new_audio.mp3` into `main_video.mp4`, starting at the 15-second mark for a duration of 30 seconds, and loop the new audio if it's shorter than 30s.

```json
{
  "resource": "audio",
  "operation": "mixAudio",
  "mixVideoSource": { "source": { "value": "/path/to/main_video.mp4" } },
  "mixAudioSource": { "source": { "value": "/path/to/new_audio.mp3" } },
  "videoVolume": 1.0,
  "audioVolume": 0.5,
  "advancedMixing": {
    "enablePartialMix": true,
    "startTime": 15,
    "duration": 30,
    "loop": true
  }
}
```

### Add Text Overlay with Custom Font
Add text to a video using a pre-uploaded custom font.

```json
{
  "resource": "video",
  "operation": "addText",
  "source": { "source": { "binaryProperty": "data" } },
  "text": "Hello, Custom Fonts!",
  "textOptions": {
    "font": "my-custom-font",
    "size": 48,
    "color": "yellow",
    "position": { "x": "(w-text_w)/2", "y": "h-th-20" }
  }
}
```

## Requirements

-   n8n: Version 1.0 or higher recommended.
-   Node.js: Version 16+.

## Development

If you wish to contribute to this node:

1. Clone this repository.
2. Install dependencies with `npm install`.
3. Build the node with `npm run build`.
4. For development, use `npm run dev` to watch for changes and automatically rebuild.
5. [Link your local repository to your n8n nodes directory.](https://docs.n8n.io/integrations/creating-nodes/test-node/#linking-the-node)

## License

MIT