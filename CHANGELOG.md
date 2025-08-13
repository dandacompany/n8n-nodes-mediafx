# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-01-13

### Added
- **Customizable output field names**: Users can now specify custom binary output field names for all media operations
  - Added "Output Field Name" option to Video, Audio, Image, and Text/Subtitle resources
  - Default field name remains "data" for backward compatibility
  - Allows better organization when chaining multiple MediaFX nodes in workflows

### Fixed
- **Merge node compatibility**: Improved binary data handling when using n8n's Merge node
  - Automatically detects binary properties in merged items (data1, data2, etc.)
  - Searches both current item and first item for binary data
  - Enhanced error messages with available properties list
- **Video transition resolution handling**: Fixed concat filter errors with different video resolutions
  - Automatically scales all videos to common resolution before transitions
  - Maintains aspect ratio with padding when needed
  - Ensures compatibility with FFmpeg 4.4 and earlier versions

### Changed
- Updated MediaFX.node.ts to use dynamic output field names based on user configuration
- Improved Binary Property field descriptions in UI with Merge node usage guidance
- Enhanced error messages for better debugging of binary data issues

## [1.3.2] - Previous Release

### Fixed
- Resolved parameter issues in Video operations

## [1.3.1] - Previous Release

### Fixed
- Restored missing mixAudio operation for Audio resource

## [1.3.0] - Previous Release

### Added
- Improved resource and action naming for better UX