import { INodeProperties } from 'n8n-workflow';

export const videoProperties: INodeProperties[] = [
	// Video Processing Operations
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['video'],
			},
		},
		options: [
			{
				name: 'Merge',
				value: 'merge',
				description: 'Combine multiple videos into a single video file',
			},
			{
				name: 'Trim',
				value: 'trim',
				description: 'Cut a video to a specific start and end time',
			},
			{
				name: 'Transition',
				value: 'multiTransition',
				description: 'Apply transition effects between multiple videos',
			},
			{
				name: 'Fade',
				value: 'singleFade',
				description: 'Apply fade in/out effects to a single video',
			},
			{
				name: 'Separate Audio',
				value: 'separateAudio',
				description: 'Split video into muted video and extracted audio track',
			},
			{
				name: 'Overlay Video',
				value: 'overlayVideo',
				description: 'Overlay a video on top of another video as a layer',
			},
		],
		default: 'merge',
	},

	// ===================
	// VIDEO MERGE FIELDS
	// ===================
	{
		displayName: 'Video Sources',
		name: 'videoSources',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'Add Video Source',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['merge'],
			},
		},
		default: [],
		options: [
			{
				displayName: 'Source',
				name: 'sources',
				values: [
					{
						displayName: 'Source Type',
						name: 'sourceType',
						type: 'options',
						options: [
							{
								name: 'URL',
								value: 'url',
							},
							{
								name: 'Binary Data from Previous Node',
								value: 'binary',
							},
						],
						default: 'url',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						placeholder: 'https://example.com/video.mp4 or /data/video.mp4',
						displayOptions: { show: { sourceType: ['url'] } },
					},
					{
						displayName: 'Binary Property',
						name: 'binaryProperty',
						type: 'string',
						default: 'data',
						description: 'Name of the binary property from the previous node. If using Merge node, use data1, data2, etc.',
						placeholder: 'e.g., data, data1, data2',
						displayOptions: { show: { sourceType: ['binary'] } },
					},
				],
			},
		],
	},
	{
		displayName: 'Output Format',
		name: 'videoOutputFormat',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['merge'],
			},
		},
		options: [
			{
				name: 'MP4',
				value: 'mp4',
			},
			{
				name: 'AVI',
				value: 'avi',
			},
			{
				name: 'MOV',
				value: 'mov',
			},
		],
		default: 'mp4',
	},

	// ===================
	// VIDEO TRIM FIELDS
	// ===================
	{
		displayName: 'Video Source',
		name: 'source',
		type: 'fixedCollection',
		placeholder: 'Add Video Source',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['trim'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Source',
				name: 'source',
				values: [
					{
						displayName: 'Source Type',
						name: 'sourceType',
						type: 'options',
						options: [ { name: 'URL', value: 'url' }, { name: 'Binary Data', value: 'binary' } ],
						default: 'url',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						placeholder: 'https://example.com/video.mp4',
						displayOptions: { show: { sourceType: ['url'] } },
					},
					{
						displayName: 'Binary Property',
						name: 'binaryProperty',
						type: 'string',
						default: 'data',
						description: 'Name of the binary property from the previous node',
						placeholder: 'e.g., data',
						displayOptions: { show: { sourceType: ['binary'] } },
					},
				],
			},
		],
	},
	{
		displayName: 'Start Time (seconds)',
		name: 'startTime',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['trim'],
			},
		},
		default: 0,
		description: 'Start time in seconds',
	},
	{
		displayName: 'End Time (seconds)',
		name: 'endTime',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['trim'],
			},
		},
		default: 10,
		description: 'End time in seconds',
	},

	// ===================
	// MULTI-VIDEO TRANSITION FIELDS
	// ===================
	{
		displayName: 'Video Sources',
		name: 'transitionSources',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['multiTransition'],
			},
		},
		default: [],
		options: [
			{
				displayName: 'Source',
				name: 'sources',
				values: [
					{
						displayName: 'Source Type',
						name: 'sourceType',
						type: 'options',
						options: [ { name: 'URL', value: 'url' }, { name: 'Binary Data', value: 'binary' } ],
						default: 'url',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						placeholder: 'https://example.com/video.mp4 or /data/video.mp4',
						displayOptions: { show: { sourceType: ['url'] } },
					},
					{
						displayName: 'Binary Property',
						name: 'binaryProperty',
						type: 'string',
						default: 'data',
						description: 'Name of the binary property from the previous node. If using Merge node, use data1, data2, etc.',
						placeholder: 'e.g., data, data1, data2',
						displayOptions: { show: { sourceType: ['binary'] } },
					},
				],
			},
		],
	},
	{
		displayName: 'Transition Effect',
		name: 'transitionEffect',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTransitionEffects',
		},
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['multiTransition'],
			},
		},
		default: 'fade',
		description: 'Type of transition effect to apply',
	},
	{
		displayName: 'Transition Duration (seconds)',
		name: 'transitionDuration',
		type: 'number',
		typeOptions: {
			minValue: 0.1,
			maxValue: 10,
			numberStepSize: 0.1,
		},
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['multiTransition'],
			},
		},
		default: 1.5,
		description: 'Duration of transition effect in seconds',
	},
	{
		displayName: 'Output Format',
		name: 'transitionOutputFormat',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['multiTransition', 'singleFade'],
			},
		},
		options: [
			{ name: 'MP4', value: 'mp4' },
			{ name: 'MOV', value: 'mov' },
			{ name: 'AVI', value: 'avi' },
			{ name: 'MKV', value: 'mkv' },
		],
		default: 'mp4',
		description: 'The format of the output video file.',
	},

	// ===================
	// SINGLE VIDEO FADE FIELDS
	// ===================
	{
		displayName: 'Video Source',
		name: 'fadeSource',
		type: 'fixedCollection',
		placeholder: 'Add Video Source',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['singleFade'],
			},
		},
		default: {},
		options: [ {
			displayName: 'Source',
			name: 'source',
			values: [
				{
					displayName: 'Source Type', name: 'sourceType', type: 'options',
					options: [ { name: 'URL', value: 'url' }, { name: 'Binary Data', value: 'binary' } ],
					default: 'url',
				},
				{ displayName: 'Value', name: 'value', type: 'string', default: '', placeholder: 'https://example.com/video.mp4' , displayOptions: { show: { sourceType: ['url'] } }},
				{
					displayName: 'Binary Property',
					name: 'binaryProperty',
					type: 'string',
					default: 'data',
					description: 'Name of the binary property from the previous node',
					placeholder: 'e.g., data',
					displayOptions: { show: { sourceType: ['binary'] } }
				},
			],
		} ],
	},
	{
		displayName: 'Fade Effect',
		name: 'fadeEffect',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['singleFade'],
			},
		},
		options: [
			{ name: 'Fade In', value: 'in' },
			{ name: 'Fade Out', value: 'out' },
		],
		default: 'in',
	},
	{
		displayName: 'Fade Start Time (seconds)',
		name: 'fadeStartTime',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['singleFade'],
			},
		},
		default: 0,
	},
	{
		displayName: 'Fade Duration (seconds)',
		name: 'fadeDuration',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['singleFade'],
			},
		},
		default: 1,
	},

	// ===================
	// SEPARATE AUDIO FIELDS
	// ===================
	{
		displayName: 'Video Source',
		name: 'separateSource',
		type: 'fixedCollection',
		placeholder: 'Add Video Source',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['separateAudio'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Source',
				name: 'source',
				values: [
					{
						displayName: 'Source Type',
						name: 'sourceType',
						type: 'options',
						options: [
							{ name: 'URL', value: 'url' },
							{ name: 'Binary Data', value: 'binary' },
						],
						default: 'url',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						placeholder: 'https://example.com/video.mp4',
						displayOptions: { show: { sourceType: ['url'] } },
					},
					{
						displayName: 'Binary Property',
						name: 'binaryProperty',
						type: 'string',
						default: 'data',
						description: 'Name of the binary property from the previous node',
						placeholder: 'e.g., data',
						displayOptions: { show: { sourceType: ['binary'] } },
					},
				],
			},
		],
	},
	{
		displayName: 'Video Output Format',
		name: 'separateVideoFormat',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['separateAudio'],
			},
		},
		options: [
			{ name: 'MP4', value: 'mp4' },
			{ name: 'MOV', value: 'mov' },
			{ name: 'AVI', value: 'avi' },
			{ name: 'MKV', value: 'mkv' },
		],
		default: 'mp4',
		description: 'Output format for the muted video file',
	},
	{
		displayName: 'Audio Output Format',
		name: 'separateAudioFormat',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['separateAudio'],
			},
		},
		options: [
			{ name: 'MP3', value: 'mp3' },
			{ name: 'AAC', value: 'aac' },
			{ name: 'WAV', value: 'wav' },
			{ name: 'FLAC', value: 'flac' },
		],
		default: 'mp3',
		description: 'Output format for the extracted audio file',
	},
	{
		displayName: 'Audio Codec',
		name: 'separateAudioCodec',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['separateAudio'],
			},
		},
		options: [
			{ name: 'Copy (No Re-encoding)', value: 'copy' },
			{ name: 'MP3 (libmp3lame)', value: 'libmp3lame' },
			{ name: 'AAC', value: 'aac' },
			{ name: 'FLAC', value: 'flac' },
			{ name: 'PCM 16-bit', value: 'pcm_s16le' },
		],
		default: 'copy',
		description: 'Audio codec for the extracted audio. "Copy" is fastest but may not work with all format combinations.',
	},
	{
		displayName: 'Audio Bitrate',
		name: 'separateAudioBitrate',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['separateAudio'],
			},
		},
		options: [
			{ name: '128 kbps', value: '128k' },
			{ name: '192 kbps', value: '192k' },
			{ name: '256 kbps', value: '256k' },
			{ name: '320 kbps', value: '320k' },
		],
		default: '192k',
		description: 'Bitrate for the extracted audio (ignored when codec is "copy")',
	},
	{
		displayName: 'Video Output Field Name',
		name: 'separateVideoFieldName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['separateAudio'],
			},
		},
		default: 'video',
		description: 'Name of the binary property where the muted video will be stored',
		placeholder: 'video',
	},
	{
		displayName: 'Audio Output Field Name',
		name: 'separateAudioFieldName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['separateAudio'],
			},
		},
		default: 'audio',
		description: 'Name of the binary property where the extracted audio will be stored',
		placeholder: 'audio',
	},

	// ===================
	// OVERLAY VIDEO FIELDS
	// ===================
	{
		displayName: 'Main Video Source',
		name: 'overlayMainSource',
		type: 'fixedCollection',
		placeholder: 'Add Main Video',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Source',
				name: 'source',
				values: [
					{
						displayName: 'Source Type',
						name: 'sourceType',
						type: 'options',
						options: [
							{ name: 'URL', value: 'url' },
							{ name: 'Binary Data', value: 'binary' },
						],
						default: 'url',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						placeholder: 'https://example.com/main-video.mp4',
						displayOptions: { show: { sourceType: ['url'] } },
					},
					{
						displayName: 'Binary Property',
						name: 'binaryProperty',
						type: 'string',
						default: 'data',
						description: 'Name of the binary property from the previous node',
						placeholder: 'e.g., data, data1',
						displayOptions: { show: { sourceType: ['binary'] } },
					},
				],
			},
		],
		description: 'The main (background) video',
	},
	{
		displayName: 'Overlay Video Source',
		name: 'overlaySource',
		type: 'fixedCollection',
		placeholder: 'Add Overlay Video',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Source',
				name: 'source',
				values: [
					{
						displayName: 'Source Type',
						name: 'sourceType',
						type: 'options',
						options: [
							{ name: 'URL', value: 'url' },
							{ name: 'Binary Data', value: 'binary' },
						],
						default: 'url',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						placeholder: 'https://example.com/overlay-video.mp4',
						displayOptions: { show: { sourceType: ['url'] } },
					},
					{
						displayName: 'Binary Property',
						name: 'binaryProperty',
						type: 'string',
						default: 'data2',
						description: 'Name of the binary property from the previous node',
						placeholder: 'e.g., data2, overlay',
						displayOptions: { show: { sourceType: ['binary'] } },
					},
				],
			},
		],
		description: 'The overlay (foreground) video to place on top',
	},
	{
		displayName: 'Position Mode',
		name: 'overlayPositionMode',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
			},
		},
		options: [
			{ name: 'Alignment (Preset Positions)', value: 'alignment' },
			{ name: 'Custom Coordinates', value: 'coordinates' },
		],
		default: 'alignment',
		description: 'How to position the overlay video',
	},
	{
		displayName: 'Horizontal Alignment',
		name: 'overlayHorizontalAlign',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
				overlayPositionMode: ['alignment'],
			},
		},
		options: [
			{ name: 'Left', value: 'left' },
			{ name: 'Center', value: 'center' },
			{ name: 'Right', value: 'right' },
		],
		default: 'center',
		description: 'Horizontal alignment of the overlay',
	},
	{
		displayName: 'Vertical Alignment',
		name: 'overlayVerticalAlign',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
				overlayPositionMode: ['alignment'],
			},
		},
		options: [
			{ name: 'Top', value: 'top' },
			{ name: 'Middle', value: 'middle' },
			{ name: 'Bottom', value: 'bottom' },
		],
		default: 'middle',
		description: 'Vertical alignment of the overlay',
	},
	{
		displayName: 'Padding X (px)',
		name: 'overlayPaddingX',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
				overlayPositionMode: ['alignment'],
			},
		},
		default: 0,
		description: 'Horizontal padding/margin from the edge in pixels',
	},
	{
		displayName: 'Padding Y (px)',
		name: 'overlayPaddingY',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
				overlayPositionMode: ['alignment'],
			},
		},
		default: 0,
		description: 'Vertical padding/margin from the edge in pixels',
	},
	{
		displayName: 'Position X',
		name: 'overlayX',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
				overlayPositionMode: ['coordinates'],
			},
		},
		default: '0',
		description: 'X position for the overlay. Can be a number (pixels) or FFmpeg expression like (main_w-overlay_w)/2 for center.',
		placeholder: '0 or (main_w-overlay_w)/2',
	},
	{
		displayName: 'Position Y',
		name: 'overlayY',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
				overlayPositionMode: ['coordinates'],
			},
		},
		default: '0',
		description: 'Y position for the overlay. Can be a number (pixels) or FFmpeg expression like (main_h-overlay_h)/2 for center.',
		placeholder: '0 or (main_h-overlay_h)/2',
	},
	{
		displayName: 'Size Mode',
		name: 'overlaySizeMode',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
			},
		},
		options: [
			{ name: 'Percentage of Main Video', value: 'percentage' },
			{ name: 'Pixels', value: 'pixels' },
			{ name: 'Original Size', value: 'original' },
		],
		default: 'percentage',
		description: 'How to specify the overlay size',
	},
	{
		displayName: 'Width (%)',
		name: 'overlayWidthPercent',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
			numberStepSize: 1,
		},
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
				overlaySizeMode: ['percentage'],
			},
		},
		default: 50,
		description: 'Width of the overlay as percentage of main video width (1-100%)',
	},
	{
		displayName: 'Height Mode',
		name: 'overlayHeightMode',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
				overlaySizeMode: ['percentage'],
			},
		},
		options: [
			{ name: 'Auto (Keep Aspect Ratio)', value: 'auto' },
			{ name: 'Percentage of Main Video', value: 'percentage' },
		],
		default: 'auto',
		description: 'How to determine overlay height',
	},
	{
		displayName: 'Height (%)',
		name: 'overlayHeightPercent',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
			numberStepSize: 1,
		},
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
				overlaySizeMode: ['percentage'],
				overlayHeightMode: ['percentage'],
			},
		},
		default: 50,
		description: 'Height of the overlay as percentage of main video height (1-100%)',
	},
	{
		displayName: 'Width (px)',
		name: 'overlayWidthPixels',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
				overlaySizeMode: ['pixels'],
			},
		},
		default: 640,
		description: 'Width of the overlay in pixels. Set to -1 to maintain aspect ratio.',
	},
	{
		displayName: 'Height (px)',
		name: 'overlayHeightPixels',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
				overlaySizeMode: ['pixels'],
			},
		},
		default: -1,
		description: 'Height of the overlay in pixels. Set to -1 to maintain aspect ratio.',
	},
	{
		displayName: 'Opacity',
		name: 'overlayOpacity',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 1,
			numberStepSize: 0.1,
		},
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
			},
		},
		default: 1,
		description: 'Opacity of the overlay video (0 = transparent, 1 = opaque)',
	},
	{
		displayName: 'Enable Time Control',
		name: 'overlayEnableTimeControl',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
			},
		},
		default: false,
		description: 'Whether to show the overlay only during a specific time range',
	},
	{
		displayName: 'Start Time (seconds)',
		name: 'overlayStartTime',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
				overlayEnableTimeControl: [true],
			},
		},
		default: 0,
		description: 'Time in seconds when the overlay should start appearing',
	},
	{
		displayName: 'End Time (seconds)',
		name: 'overlayEndTime',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
				overlayEnableTimeControl: [true],
			},
		},
		default: 0,
		description: 'Time in seconds when the overlay should stop appearing (0 = until end)',
	},
	{
		displayName: 'Audio Handling',
		name: 'overlayAudioHandling',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
			},
		},
		options: [
			{ name: 'Main Video Audio Only', value: 'main' },
			{ name: 'Overlay Video Audio Only', value: 'overlay' },
			{ name: 'Mix Both Audio Tracks', value: 'mix' },
			{ name: 'No Audio', value: 'none' },
		],
		default: 'main',
		description: 'How to handle audio from both videos',
	},
	{
		displayName: 'Main Audio Volume',
		name: 'overlayMainVolume',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 2,
			numberStepSize: 0.1,
		},
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
				overlayAudioHandling: ['mix'],
			},
		},
		default: 1,
		description: 'Volume level for main video audio (1 = 100%)',
	},
	{
		displayName: 'Overlay Audio Volume',
		name: 'overlayOverlayVolume',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 2,
			numberStepSize: 0.1,
		},
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
				overlayAudioHandling: ['mix'],
			},
		},
		default: 0.5,
		description: 'Volume level for overlay video audio (1 = 100%)',
	},
	{
		displayName: 'Output Format',
		name: 'overlayOutputFormat',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['overlayVideo'],
			},
		},
		options: [
			{ name: 'MP4', value: 'mp4' },
			{ name: 'MOV', value: 'mov' },
			{ name: 'AVI', value: 'avi' },
			{ name: 'MKV', value: 'mkv' },
		],
		default: 'mp4',
		description: 'Output format for the resulting video',
	},

	// ===================
	// OUTPUT FIELD NAME
	// ===================
	{
		displayName: 'Output Field Name',
		name: 'outputFieldName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['merge', 'trim', 'multiTransition', 'singleFade', 'overlayVideo'],
			},
		},
		default: 'data',
		description: 'Name of the binary property where the output video will be stored',
		placeholder: 'data',
	},
];
