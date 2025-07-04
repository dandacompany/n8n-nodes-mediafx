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
				name: 'Text',
				value: 'subtitle',
			},
			{
				name: 'Image',
				value: 'image',
			},
			{
				name: 'Font',
				value: 'font',
			},
		],
		default: 'video',
	},
]; 