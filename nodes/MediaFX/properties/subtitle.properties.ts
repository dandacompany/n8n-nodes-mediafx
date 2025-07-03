import { INodeProperties } from 'n8n-workflow';

export const subtitleProperties: INodeProperties[] = [
	// Subtitle Operations
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['subtitle'],
			},
		},
		options: [
			{
				name: 'Add Subtitle',
				value: 'addSubtitle',
				description: 'Add SRT subtitle file to video',
			},
			{
				name: 'Add Text',
				value: 'addText',
				description: 'Add custom text overlay to video',
			},
		],
		default: 'addText',
	},

	// ===================
	// SUBTITLE FIELDS
	// ===================
	{
		displayName: 'Video Source',
		name: 'source',
		type: 'fixedCollection',
		placeholder: 'Add Video Source',
		displayOptions: { show: { resource: ['subtitle'] } },
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
		displayName: 'Subtitle File Source',
		name: 'subtitleFileSource',
		type: 'fixedCollection',
		placeholder: 'Add Subtitle File Source',
		displayOptions: {
			show: {
				resource: ['subtitle'],
				operation: ['addSubtitle'],
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
					{ displayName: 'Value', name: 'value', type: 'string', default: '', placeholder: 'https://example.com/sub.srt', displayOptions: { show: { sourceType: ['url'] } } },
					{ displayName: 'Binary Property', name: 'binaryProperty', type: 'string', default: 'data', displayOptions: { show: { sourceType: ['binary'] } } },
				],
			},
		],
	},
	{
		displayName: 'Subtitle Style',
		name: 'subtitleStyle',
		type: 'collection',
		placeholder: 'Add Style Option',
		displayOptions: {
			show: {
				resource: ['subtitle'],
				operation: ['addSubtitle'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Font Key',
				name: 'fontKey',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getFonts' },
				default: 'noto-sans-kr',
			},
			{
				displayName: 'Font Size',
				name: 'size',
				type: 'number',
				default: 48,
			},
			{
				displayName: 'Color',
				name: 'color',
				type: 'string',
				default: 'white',
			},
			{
				displayName: 'Outline Width',
				name: 'outlineWidth',
				type: 'number',
				default: 1,
				description: 'Width of the text border',
			},
			{
				displayName: 'Position Type',
				name: 'positionType',
				type: 'options',
				options: [
					{ name: 'Alignment', value: 'alignment', description: 'Use preset alignment positions' },
					{ name: 'Custom', value: 'custom', description: 'Set custom X/Y coordinates' },
				],
				default: 'alignment',
			},
			{
				displayName: 'Horizontal Alignment',
				name: 'horizontalAlign',
				type: 'options',
				options: [
					{ name: 'Left', value: 'left' },
					{ name: 'Center', value: 'center' },
					{ name: 'Right', value: 'right' },
				],
				default: 'center',
				displayOptions: { show: { positionType: ['alignment'] } },
			},
			{
				displayName: 'Vertical Alignment',
				name: 'verticalAlign',
				type: 'options',
				options: [
					{ name: 'Top', value: 'top' },
					{ name: 'Middle', value: 'middle' },
					{ name: 'Bottom', value: 'bottom' },
				],
				default: 'bottom',
				displayOptions: { show: { positionType: ['alignment'] } },
			},
			{
				displayName: 'Horizontal Padding',
				name: 'paddingX',
				type: 'number',
				default: 20,
				description: 'Horizontal padding in pixels from left/right edges',
				displayOptions: { show: { positionType: ['alignment'] } },
			},
			{
				displayName: 'Vertical Padding',
				name: 'paddingY',
				type: 'number',
				default: 20,
				description: 'Vertical padding in pixels from top/bottom edges',
				displayOptions: { show: { positionType: ['alignment'] } },
			},
			{
				displayName: 'Position X',
				name: 'x',
				type: 'string',
				default: '(w-text_w)/2',
				description: "Custom X position. Use ffmpeg expressions (e.g., '100' or '(w-text_w)/2')",
				displayOptions: { show: { positionType: ['custom'] } },
			},
			{
				displayName: 'Position Y',
				name: 'y',
				type: 'string',
				default: 'h-th-50',
				description: "Custom Y position. Use ffmpeg expressions (e.g., '100' or 'h-th-50')",
				displayOptions: { show: { positionType: ['custom'] } },
			},
		],
	},
	{
		displayName: 'Subtitle Text',
		name: 'textOptions',
		type: 'collection',
		displayOptions: {
			show: {
				resource: ['subtitle'],
				operation: ['addText'],
			},
		},
		default: {},
		placeholder: 'Add Text Setting',
		options: [
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				default: 'Hello, n8n!',
			},
			{
				displayName: 'Start Time (seconds)',
				name: 'startTime',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'End Time (seconds)',
				name: 'endTime',
				type: 'number',
				default: 5,
			},
			{
				displayName: 'Font Key',
				name: 'fontKey',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getFonts' },
				default: 'noto-sans-kr',
			},
			{
				displayName: 'Font Size',
				name: 'size',
				type: 'number',
				default: 48,
			},
			{
				displayName: 'Color',
				name: 'color',
				type: 'string',
				default: 'white',
			},
			{
				displayName: 'Position Type',
				name: 'positionType',
				type: 'options',
				options: [
					{ name: 'Alignment', value: 'alignment', description: 'Use preset alignment positions' },
					{ name: 'Custom', value: 'custom', description: 'Set custom X/Y coordinates' },
				],
				default: 'alignment',
			},
			{
				displayName: 'Horizontal Alignment',
				name: 'horizontalAlign',
				type: 'options',
				options: [
					{ name: 'Left', value: 'left' },
					{ name: 'Center', value: 'center' },
					{ name: 'Right', value: 'right' },
				],
				default: 'center',
				displayOptions: { show: { positionType: ['alignment'] } },
			},
			{
				displayName: 'Vertical Alignment',
				name: 'verticalAlign',
				type: 'options',
				options: [
					{ name: 'Top', value: 'top' },
					{ name: 'Middle', value: 'middle' },
					{ name: 'Bottom', value: 'bottom' },
				],
				default: 'bottom',
				displayOptions: { show: { positionType: ['alignment'] } },
			},
			{
				displayName: 'Horizontal Padding',
				name: 'paddingX',
				type: 'number',
				default: 20,
				description: 'Horizontal padding in pixels from left/right edges',
				displayOptions: { show: { positionType: ['alignment'] } },
			},
			{
				displayName: 'Vertical Padding',
				name: 'paddingY',
				type: 'number',
				default: 20,
				description: 'Vertical padding in pixels from top/bottom edges',
				displayOptions: { show: { positionType: ['alignment'] } },
			},
			{
				displayName: 'Position X',
				name: 'x',
				type: 'string',
				default: '(w-text_w)/2',
				description: "Custom X position. Use ffmpeg expressions (e.g., '100' or '(w-text_w)/2')",
				displayOptions: { show: { positionType: ['custom'] } },
			},
			{
				displayName: 'Position Y',
				name: 'y',
				type: 'string',
				default: 'h-th-10',
				description: "Custom Y position. Use ffmpeg expressions (e.g., '100' or 'h-th-10')",
				displayOptions: { show: { positionType: ['custom'] } },
			},
		],
	},
]; 