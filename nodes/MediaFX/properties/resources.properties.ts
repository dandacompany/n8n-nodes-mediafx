import { INodeProperties } from 'n8n-workflow';

export const resourceSelection: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Video',
				value: 'video',
			},
			{
				name: 'Audio',
				value: 'audio',
			},
			{
				name: 'Subtitle & Text',
				value: 'subtitle',
			},
			{
				name: 'Transition Effects',
				value: 'transition',
			},
			{
				name: 'Image',
				value: 'image',
			},
			{
				name: 'Font Management',
				value: 'font',
			},
		],
		default: 'video',
	},
]; 