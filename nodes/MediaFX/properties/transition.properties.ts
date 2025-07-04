import { INodeProperties } from 'n8n-workflow';

export const transitionProperties: INodeProperties[] = [
	// Transition Operations
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['transition'],
			},
		},
		options: [
			{
				name: 'Apply',
				value: 'apply',
				description: 'Apply transition effects between videos',
			},
			{
				name: 'Fade',
				value: 'fade',
				description: 'Apply fade in/out effects',
			},
		],
		default: 'apply',
	},

	// ===================
	// TRANSITION FIELDS
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
				resource: ['transition'],
				operation: ['apply'],
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
						description: 'Name of the binary property containing video data',
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
				resource: ['transition'],
				operation: ['apply'],
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
				resource: ['transition'],
				operation: ['apply'],
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
				resource: ['transition'],
				operation: ['apply', 'fade'],
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

	// FADE EFFECT FIELDS
	{
		displayName: 'Video Source',
		name: 'source',
		type: 'fixedCollection',
		placeholder: 'Add Video Source',
		displayOptions: {
			show: {
				resource: ['transition'],
				operation: ['fade'],
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
				{ displayName: 'Binary Property', name: 'binaryProperty', type: 'string', default: 'data' , displayOptions: { show: { sourceType: ['binary'] } }},
			],
		} ],
	},
	{
		displayName: 'Fade Effect',
		name: 'fadeEffect',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['transition'],
				operation: ['fade'],
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
				resource: ['transition'],
				operation: ['fade'],
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
				resource: ['transition'],
				operation: ['fade'],
			},
		},
		default: 1,
	},
]; 