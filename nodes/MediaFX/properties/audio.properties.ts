import { INodeProperties } from 'n8n-workflow';

export const audioProperties: INodeProperties[] = [
	// ====================================================================
	//                           OPERATION SELECTOR
	// ====================================================================
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['audio'],
			},
		},
		options: [
			{
				name: 'Extract',
				value: 'extract',
				description: 'Extract audio from a video file',
			},
			{
				name: 'Mix',
				value: 'mixAudio',
				description: 'Mix a primary video/audio source with a secondary audio source',
			},
		],
		default: 'extract',
	},

	// ====================================================================
	//                           EXTRACT AUDIO FIELDS
	// ====================================================================
	{
		displayName: 'Source Video',
		name: 'source',
		type: 'collection',
		placeholder: 'Add Video Source',
		default: {},
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['extract'],
			},
		},
		options: [
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
				displayOptions: { show: { sourceType: ['binary'] } },
			},
		],
	},
	{
		displayName: 'Output Format',
		name: 'outputFormat',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['extract'],
			},
		},
		options: [
			{ name: 'MP3', value: 'mp3' },
			{ name: 'WAV', value: 'wav' },
			{ name: 'AAC', value: 'aac' },
			{ name: 'FLAC', value: 'flac' },
		],
		default: 'mp3',
		description: 'Format for the extracted audio file',
	},
	{
		displayName: 'Advanced Options',
		name: 'advancedOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['extract'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Audio Codec',
				name: 'audioCodec',
				type: 'string',
				default: 'copy',
				placeholder: 'libmp3lame',
				description: "Specify audio codec, or 'copy' to keep original",
			},
			{
				displayName: 'Audio Bitrate (e.g., 192k)',
				name: 'audioBitrate',
				type: 'string',
				default: '192k',
			},
		],
	},

	// ====================================================================
	//                           MIX AUDIO FIELDS
	// ====================================================================
	{
		displayName: 'Primary Source Type',
		name: 'mixVideoSourceType',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'Binary Data', value: 'binary' },
		],
		default: 'url',
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['mixAudio'],
			},
		},
		description: 'Type of primary source input',
	},
	{
		displayName: 'Primary Source URL',
		name: 'mixVideoSourceUrl',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/video.mp4',
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['mixAudio'],
				mixVideoSourceType: ['url'],
			},
		},
		description: 'URL of the primary video or audio source',
	},
	{
		displayName: 'Primary Source Binary Property',
		name: 'mixVideoSourceBinary',
		type: 'string',
		default: 'data',
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['mixAudio'],
				mixVideoSourceType: ['binary'],
			},
		},
		description: 'Binary property name containing the primary source data',
	},
	{
		displayName: 'Secondary Audio Source Type',
		name: 'mixAudioSourceType',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'Binary Data', value: 'binary' },
		],
		default: 'url',
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['mixAudio'],
			},
		},
		description: 'Type of secondary audio source input',
	},
	{
		displayName: 'Secondary Audio Source URL',
		name: 'mixAudioSourceUrl',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/audio.mp3',
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['mixAudio'],
				mixAudioSourceType: ['url'],
			},
		},
		description: 'URL of the secondary audio source to mix in',
	},
	{
		displayName: 'Secondary Audio Source Binary Property',
		name: 'mixAudioSourceBinary',
		type: 'string',
		default: 'data',
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['mixAudio'],
				mixAudioSourceType: ['binary'],
			},
		},
		description: 'Binary property name containing the secondary audio source data',
	},
	{
		displayName: 'Primary Source Volume',
		name: 'videoVolume',
		type: 'number',
		typeOptions: { minValue: 0, maxValue: 10, numberStep: 0.1 },
		default: 1.0,
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['mixAudio'],
			},
		},
		description: 'Volume for primary video/audio source (1.0 = original, 0.5 = half, 0 = mute)',
	},
	{
		displayName: 'Secondary Audio Volume',
		name: 'audioVolume',
		type: 'number',
		typeOptions: { minValue: 0, maxValue: 10, numberStep: 0.1 },
		default: 1.0,
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['mixAudio'],
			},
		},
		description: 'Volume for secondary audio source (1.0 = original, 0.5 = half, 0 = mute)',
	},
	// Enable Partial Mix (first field to determine other fields visibility)
	{
		displayName: 'Enable Partial Mix',
		name: 'enablePartialMix',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['mixAudio'],
			},
		},
		description: 'Enable partial mixing to insert audio at specific time range',
	},
	
	// Output Length (shown when partial mix is disabled)
	{
		displayName: 'Output Length (Full Mix)',
		name: 'matchLength',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['mixAudio'],
				enablePartialMix: [false],
			},
		},
		options: [
			{ name: 'Shortest', value: 'shortest' },
			{ name: 'Longest', value: 'longest' },
			{ name: 'From Primary Source', value: 'first' },
		],
		default: 'shortest',
	},
	
	// Partial Mix Options (shown when partial mix is enabled)
	{
		displayName: 'Start Time (seconds)',
		name: 'startTime',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['mixAudio'],
				enablePartialMix: [true],
			},
		},
	},
	{
		displayName: 'Mix Duration (seconds)',
		name: 'duration',
		type: 'number',
		default: '',
		required: false,
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['mixAudio'],
				enablePartialMix: [true],
			},
		},
		description: 'Duration to mix audio. Leave empty to use full audio length.',
	},
	{
		displayName: 'Loop Audio if Shorter',
		name: 'loop',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['mixAudio'],
				enablePartialMix: [true],
			},
		},
		description: 'If audio is shorter than Mix Duration: Loop=true repeats audio to fill duration, Loop=false inserts audio as-is (ends early). If audio is longer: always trims to exact duration.',
	},
	// Fade Effects (independent of partial mix)
	{
		displayName: 'Enable Fade In',
		name: 'enableFadeIn',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['mixAudio'],
			},
		},
		description: 'Apply fade in effect to the secondary audio',
	},
	{
		displayName: 'Fade In Duration (seconds)',
		name: 'fadeInDuration',
		type: 'number',
		default: 1,
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['mixAudio'],
				enableFadeIn: [true],
			},
		},
		description: 'Duration of fade in effect in seconds',
	},
	{
		displayName: 'Enable Fade Out',
		name: 'enableFadeOut',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['mixAudio'],
			},
		},
		description: 'Apply fade out effect to the secondary audio',
	},
	{
		displayName: 'Fade Out Duration (seconds)',
		name: 'fadeOutDuration',
		type: 'number',
		default: 1,
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['mixAudio'],
				enableFadeOut: [true],
			},
		},
		description: 'Duration of fade out effect in seconds',
	},
]; 