# n8n-nodes-mediafx

N8N custom nodes for video editing and media processing with FFmpeg. This package provides comprehensive video/audio processing capabilities through n8n workflows.

## Features

- **Video Processing**: Merge, trim, and mix audio with videos
- **Audio Processing**: Extract audio, mix multiple audio sources
- **Subtitle & Text**: Add subtitles and text overlays with custom styling
- **Transition Effects**: Apply 30+ transition effects between videos
- **Font Management**: Upload and manage custom fonts
- **Media Management**: Store, list, and manage processed media files

## Installation

```bash
npm install n8n-nodes-mediafx
```

## Setup

### 1. MediaFX API Server

First, ensure your MediaFX API server is running. The default endpoint is `http://localhost:3000`.

### 2. Configure Credentials

Add MediaFX API credentials in n8n:

1. Go to **Settings** → **Credentials**
2. Click **Add Credential**
3. Select **MediaFX API**
4. Configure:
   - **API Base URL**: `http://localhost:3000` (or your server URL)
   - **API Key**: (optional, if your server requires authentication)

## Nodes

### MediaFX Node

Main node for video/audio processing operations.

#### Resources & Operations

##### Video Processing
- **Merge Videos**: Combine multiple videos into one
- **Trim Video**: Cut specific portions of video
- **Mix Audio**: Add background music to video

##### Audio Processing  
- **Extract Audio**: Extract audio track from video
- **Mix Audio**: Combine video with audio file

##### Subtitle & Text
- **Add Text Overlay**: Add custom text with styling
- **Add Subtitle File**: Import SRT subtitle files

##### Transition Effects
- **Apply Transition**: Add transitions between videos
- **Apply Fade Effect**: Add fade in/out effects
- **Advanced Transition**: Multi-video custom transitions

##### Media Management
- **List Media**: Get stored media files
- **Download Media**: Download by media ID
- **Delete Media**: Remove stored files
- **Get Stats**: Storage statistics

### MediaFont Node

Dedicated node for font management operations.

#### Operations
- **List Fonts**: Get available fonts
- **Upload Font**: Add TTF/OTF font files
- **Delete Font**: Remove user fonts
- **Get Font Preview**: Font information
- **Validate Font Key**: Check availability

## Usage Examples

### Basic Video Merge

```json
{
  "resource": "video",
  "operation": "merge",
  "videoSources": {
    "sources": [
      {
        "sourceType": "url",
        "videoUrl": "https://example.com/video1.mp4"
      },
      {
        "sourceType": "url", 
        "videoUrl": "https://example.com/video2.mp4"
      }
    ]
  },
  "outputFormat": "mp4"
}
```

### Add Text Overlay

```json
{
  "resource": "subtitle",
  "operation": "addText",
  "videoSource": "https://example.com/video.mp4",
  "subtitleText": "Hello World!",
  "startTime": 0,
  "endTime": 5,
  "fontSettings": {
    "fontKey": "noto-sans-kr",
    "size": 48,
    "color": "white",
    "box": true,
    "boxColor": "black",
    "boxOpacity": 0.7
  }
}
```

### Apply Transition Effect

```json
{
  "resource": "transition",
  "operation": "apply",
  "transitionSources": {
    "sources": [
      {"source": "https://example.com/video1.mp4"},
      {"source": "https://example.com/video2.mp4"}
    ]
  },
  "transitionEffect": "slideleft",
  "transitionDuration": 1.5
}
```

### Upload Custom Font

```json
{
  "operation": "upload",
  "fontSource": "binary",
  "binaryProperty": "data",
  "fontKey": "my-custom-font",
  "fontName": "My Custom Font",
  "description": "Custom font for projects"
}
```

## Input/Output

### Input
- **JSON Data**: Configuration parameters
- **Binary Data**: Media files, fonts (when applicable)

### Output
- **Binary Data**: Processed video/audio files
- **JSON Data**: Operation results, media information

## Supported Formats

### Video
- **Input**: MP4, AVI, MOV, MKV, WebM
- **Output**: MP4, AVI, MOV

### Audio
- **Input**: MP3, WAV, AAC, M4A
- **Output**: MP3, WAV, AAC

### Fonts
- **Input**: TTF, OTF
- **Encoding**: UTF-8 support for all languages

### Subtitles
- **Input**: SRT, VTT
- **Encoding**: UTF-8

## Transition Effects

Over 30 transition effects available:

### Basic Effects
- `fade`, `fadeblack`, `fadewhite`

### Slide Effects
- `slideleft`, `slideright`, `slideup`, `slidedown`

### Wipe Effects
- `wipeleft`, `wiperight`, `wipeup`, `wipedown`

### Circular Effects
- `circlecrop`, `circleopen`, `circleclose`, `radial`

### Diagonal Effects
- `diagtl`, `diagtr`, `diagbl`, `diagbr`

### Special Effects
- `pixelize`, `dissolve`, `distance`

### And many more...

## Error Handling

The nodes support n8n's built-in error handling:

- **Continue on Fail**: Process remaining items on error
- **Error Output**: Detailed error messages in JSON format
- **Timeout Control**: Configurable request timeouts

## Requirements

- **N8N**: Version 0.196.0 or higher
- **MediaFX API Server**: Running instance
- **FFmpeg**: Required on API server
- **Node.js**: Version 16+ on API server

## API Server Setup

See the main MediaFX API documentation for server setup instructions:

```bash
# Install and run MediaFX API
git clone https://github.com/your-repo/media-editor
cd media-editor
npm install
npm start
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Development Mode

```bash
npm run dev
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check API server is running
   - Verify base URL in credentials
   - Check network connectivity

2. **Font Not Found**
   - Ensure font is uploaded via MediaFont node
   - Check font key spelling
   - Verify font file format (TTF/OTF only)

3. **Video Processing Timeout**
   - Increase timeout in additional options
   - Check file sizes and server resources
   - Verify video file accessibility

4. **Subtitle Encoding Issues**
   - Ensure UTF-8 encoding
   - Check special character support
   - Verify font supports required characters

### Debugging

Enable debug mode by setting environment variable:

```bash
N8N_LOG_LEVEL=debug
```

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: GitHub Issues
- **Documentation**: [API Documentation](http://localhost:3000/docs)
- **Community**: N8N Community Forum

## Changelog

### 1.0.0
- Initial release
- MediaFX and MediaFont nodes
- Full API coverage
- Comprehensive transition effects
- Font management system