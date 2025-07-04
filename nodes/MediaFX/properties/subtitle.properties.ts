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
				name: 'Add String',
				value: 'addText',
				description: 'Add custom text overlay to video',
			},
		],
		default: 'addText',
	},

	// ===================
	// COMMON SOURCE FIELDS
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

	// ===================
	// SUBTITLE FILE SOURCE (only for addSubtitle)
	// ===================
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

	// ===================
	// TEXT CONTENT (only for addText)
	// ===================
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		default: 'Hello, n8n!',
		displayOptions: {
			show: {
				resource: ['subtitle'],
				operation: ['addText'],
			},
		},
		description: 'Text content to display',
	},
	{
		displayName: 'Start Time (seconds)',
		name: 'startTime',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				resource: ['subtitle'],
				operation: ['addText'],
			},
		},
		description: 'When the text should start appearing',
	},
	{
		displayName: 'End Time (seconds)',
		name: 'endTime',
		type: 'number',
		default: 5,
		displayOptions: {
			show: {
				resource: ['subtitle'],
				operation: ['addText'],
			},
		},
		description: 'When the text should stop appearing',
	},

	// ===================
	// COMMON FONT & STYLE OPTIONS
	// ===================
	{
		displayName: 'Font Key',
		name: 'fontKey',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getFonts' },
		default: 'noto-sans-kr',
		displayOptions: {
			show: {
				resource: ['subtitle'],
			},
		},
		description: 'Font to use for the text',
	},
	{
		displayName: 'Font Size',
		name: 'size',
		type: 'number',
		default: 48,
		displayOptions: {
			show: {
				resource: ['subtitle'],
			},
		},
		description: 'Size of the text in pixels',
	},
	{
		displayName: 'Color',
		name: 'color',
		type: 'string',
		default: 'white',
		displayOptions: {
			show: {
				resource: ['subtitle'],
			},
		},
		description: 'Text color (e.g., white, #FF0000, red)',
	},
	{
		displayName: 'Outline Width',
		name: 'outlineWidth',
		type: 'number',
		default: 1,
		displayOptions: {
			show: {
				resource: ['subtitle'],
			},
		},
		description: 'Width of the text border/outline',
	},

	// ===================
	// POSITION OPTIONS
	// ===================
	{
		displayName: 'Position Type',
		name: 'positionType',
		type: 'options',
		options: [
			{ name: 'Alignment', value: 'alignment', description: 'Use preset alignment positions' },
			{ name: 'Custom', value: 'custom', description: 'Set custom X/Y coordinates' },
		],
		default: 'alignment',
		displayOptions: {
			show: {
				resource: ['subtitle'],
			},
		},
		description: 'How to position the text',
	},

	// --- ALIGNMENT POSITION OPTIONS ---
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
		displayOptions: { 
			show: { 
				resource: ['subtitle'],
				positionType: ['alignment'] 
			} 
		},
		description: 'Horizontal alignment of the text',
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
		displayOptions: { 
			show: { 
				resource: ['subtitle'],
				positionType: ['alignment'] 
			} 
		},
		description: 'Vertical alignment of the text',
	},
	{
		displayName: 'Horizontal Padding',
		name: 'paddingX',
		type: 'number',
		default: 20,
		displayOptions: { 
			show: { 
				resource: ['subtitle'],
				positionType: ['alignment'] 
			} 
		},
		description: 'Horizontal padding in pixels from left/right edges',
	},
	{
		displayName: 'Vertical Padding',
		name: 'paddingY',
		type: 'number',
		default: 20,
		displayOptions: { 
			show: { 
				resource: ['subtitle'],
				positionType: ['alignment'] 
			} 
		},
		description: 'Vertical padding in pixels from top/bottom edges',
	},

	// --- CUSTOM POSITION OPTIONS ---
	{
		displayName: 'Position X',
		name: 'x',
		type: 'string',
		default: '(w-text_w)/2',
		displayOptions: { 
			show: { 
				resource: ['subtitle'],
				positionType: ['custom'] 
			} 
		},
		description: "Custom X position. Use ffmpeg expressions (e.g., '100' or '(w-text_w)/2')",
	},
	{
		displayName: 'Position Y',
		name: 'y',
		type: 'string',
		default: 'h-th-50',
		displayOptions: { 
			show: { 
				resource: ['subtitle'],
				positionType: ['custom'] 
			} 
		},
		description: "Custom Y position. Use ffmpeg expressions (e.g., '100' or 'h-th-50')",
	},
]; 