# FFmpeg Compatibility Guide

## Issue Description

The `xfade` filter used for video transitions was introduced in FFmpeg 4.3. If you're running n8n in a Docker container with an older FFmpeg version, you'll encounter errors when using transition effects other than basic fade.

## Error Message

```
[AVFilterGraph @ 0x24bbc880] No such filter: 'xfade'
Error initializing complex filters.
Invalid argument
```

## Solution

### Version 1.2.0 Update

This version includes automatic FFmpeg version detection and fallback mechanisms:

1. **Automatic Detection**: The node now detects your FFmpeg version and capabilities
2. **Fallback Support**: If `xfade` is not available, transitions automatically fall back to basic fade effects
3. **Clear Messaging**: Transition effects now indicate which require FFmpeg 4.3+

### Supported Transitions by FFmpeg Version

#### All FFmpeg Versions
- Fade
- Fade Black
- Fade White

#### FFmpeg 4.3+ Required
- Wipe (Left, Right, Up, Down)
- Slide (Left, Right, Up, Down)
- Circle Crop, Rect Crop
- Distance, Fade Grayscale
- Radial, Circle Open/Close
- Pixelize, Dissolve
- Checkerboard, Box-in, Iris

## Upgrading FFmpeg in Docker

If you need advanced transitions, upgrade FFmpeg in your n8n Docker container:

### Option 1: Use Custom Dockerfile

```dockerfile
FROM n8nio/n8n:latest

USER root

# Install FFmpeg 4.4+ from backports or compile from source
RUN apt-get update && \
    apt-get install -y software-properties-common && \
    add-apt-repository ppa:savoury1/ffmpeg4 && \
    apt-get update && \
    apt-get install -y ffmpeg

USER node
```

### Option 2: Use Static Build

Download a static FFmpeg build:

```bash
# Inside container
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar xf ffmpeg-release-amd64-static.tar.xz
cp ffmpeg-*-amd64-static/ffmpeg /usr/local/bin/
cp ffmpeg-*-amd64-static/ffprobe /usr/local/bin/
```

## Deployment Steps

1. Update the node package:
   ```bash
   npm install n8n-nodes-mediafx@1.2.0
   ```

2. Restart n8n to load the updated node

3. Test with basic fade transitions first

4. If you need advanced transitions, upgrade FFmpeg as described above

## Testing

To check your FFmpeg version:

```bash
ffmpeg -version
```

Look for version 4.3 or higher to use all transition effects.