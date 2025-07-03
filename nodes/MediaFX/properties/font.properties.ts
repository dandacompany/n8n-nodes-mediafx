import { INodeProperties } from 'n8n-workflow';

export const fontProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['font'],
			},
		},
		options: [
			{
				name: 'List Fonts',
				value: 'list',
				description: 'Get all available fonts',
			},
			{
				name: 'Upload Font',
				value: 'upload',
				description: 'Upload a new font file',
			},
			{
				name: 'Delete Font',
				value: 'delete',
				description: 'Delete a user font',
			},
			{
				name: 'Get Font Preview',
				value: 'preview',
				description: 'Get font information and preview',
			},
			{
				name: 'Validate Font Key',
				value: 'validate',
				description: 'Check if font key is available',
			},
		],
		default: 'list',
	},

	// Font Upload Fields
	{
		displayName: 'Font Source',
		name: 'fontSource',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['font'],
				operation: ['upload'],
			},
		},
		options: [
			{
				name: 'Binary Data',
				value: 'binary',
				description: 'Upload from binary data in workflow',
			},
			{
				name: 'File Path',
				value: 'filepath',
				description: 'Upload from local file path',
			},
		],
		default: 'binary',
	},
	{
		displayName: 'Binary Property',
		name: 'binaryProperty',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['font'],
				operation: ['upload'],
				fontSource: ['binary'],
			},
		},
		default: 'data',
		description: 'Name of the binary property containing font data',
	},
	{
		displayName: 'File Path',
		name: 'filePath',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['font'],
				operation: ['upload'],
				fontSource: ['filepath'],
			},
		},
		default: '',
		placeholder: '/path/to/font.ttf',
		description: 'Local file path to font file',
	},
	{
		displayName: 'Font Key',
		name: 'fontKeyUpload',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['font'],
				operation: ['upload'],
			},
		},
		default: '',
		placeholder: 'my-custom-font',
		description: 'Unique identifier for the font (3-50 chars, alphanumeric, hyphens, underscores)',
		required: true,
	},
	{
		displayName: 'Font Name',
		name: 'fontName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['font'],
				operation: ['upload'],
			},
		},
		default: '',
		placeholder: 'My Custom Font',
		description: 'Display name for the font',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['font'],
				operation: ['upload'],
			},
		},
		default: '',
		placeholder: 'Custom font for special projects',
		description: 'Optional description for the font',
	},

	// Font Key for other operations
	{
		displayName: 'Font Key',
		name: 'fontKey',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getUserFonts',
		},
		displayOptions: {
			show: {
				resource: ['font'],
				operation: ['delete', 'preview'],
			},
		},
		default: '',
		description: 'Font to operate on',
		required: true,
	},

	// Font Key Validation
	{
		displayName: 'Font Key to Validate',
		name: 'fontKeyToValidate',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['font'],
				operation: ['validate'],
			},
		},
		default: '',
		placeholder: 'my-new-font-key',
		description: 'Font key to check for availability',
		required: true,
	},

	// Filter Options for List
	{
		displayName: 'Filter Options',
		name: 'filterOptions',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['font'],
				operation: ['list'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Font Type',
				name: 'fontType',
				type: 'options',
				options: [
					{ name: 'All Fonts', value: 'all' },
					{ name: 'Korean Fonts', value: 'korean' },
					{ name: 'Global Fonts', value: 'global' },
					{ name: 'User Fonts', value: 'user' },
					{ name: 'Fallback Fonts', value: 'fallback' },
				],
				default: 'all',
				description: 'Filter fonts by type',
			},
			{
				displayName: 'Include Details',
				name: 'includeDetails',
				type: 'boolean',
				default: true,
				description: 'Include detailed font information',
			},
		],
	},
]; 