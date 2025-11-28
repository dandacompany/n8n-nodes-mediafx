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
	// OUTPUT FIELD NAME
	// ===================
	{
		displayName: 'Output Field Name',
		name: 'outputFieldName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['merge', 'trim', 'multiTransition', 'singleFade'],
			},
		},
		default: 'data',
		description: 'Name of the binary property where the output video will be stored',
		placeholder: 'data',
	},
]; 