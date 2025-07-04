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
						description: 'Name of the binary property containing video data',
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
	// AUDIO MIX FIELDS
	// ===================
	{
		displayName: 'Video Source',
		name: 'mixVideoSource',
		type: 'fixedCollection',
		placeholder: 'Add Video Source',
		displayOptions: { show: { resource: ['video'], operation: ['mixAudio'] } },
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
				{ displayName: 'Binary Property', name: 'binaryProperty', type: 'string', default: 'data' , displayOptions: { show: { sourceType: ['binary'] } }},
			],
		} ],
	},
	{
		displayName: 'Audio Source',
		name: 'mixAudioSource',
		type: 'fixedCollection',
		placeholder: 'Add Audio Source',
		displayOptions: { show: { resource: ['video'], operation: ['mixAudio'] } },
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
				{ displayName: 'Value', name: 'value', type: 'string', default: '', placeholder: 'https://example.com/music.mp3' , displayOptions: { show: { sourceType: ['url'] } }},
				{ displayName: 'Binary Property', name: 'binaryProperty', type: 'string', default: 'data' , displayOptions: { show: { sourceType: ['binary'] } }},
			],
		} ],
	},
	{
		displayName: 'Video Volume',
		name: 'videoVolume',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 2,
			numberStepSize: 0.1,
		},
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['mixAudio'],
			},
		},
		default: 0.8,
		description: 'Video audio volume (0.0 - 2.0)',
	},
	{
		displayName: 'Audio Volume',
		name: 'audioVolume',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 2,
			numberStepSize: 0.1,
		},
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['mixAudio'],
			},
		},
		default: 0.5,
		description: 'Background audio volume (0.0 - 2.0)',
	},
	{
		displayName: 'Match Length To',
		name: 'matchLength',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['video'],
				operation: ['mixAudio'],
			},
		},
		options: [
			{
				name: 'Shortest',
				value: 'shortest',
				description: 'Ends when the shortest input (video or audio) ends',
			},
			{
				name: 'Video',
				value: 'video',
				description: 'Trims or loops audio to match the video duration',
			},
			{
				name: 'Audio',
				value: 'audio',
				description: 'Trims video to match the audio duration',
			},
		],
		default: 'shortest',
		description: 'Choose how to determine the output duration when mixing',
	},
]; 