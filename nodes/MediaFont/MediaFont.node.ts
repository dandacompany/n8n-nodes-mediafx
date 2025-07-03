import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	INodePropertyOptions,
	ILoadOptionsFunctions,
	NodeOperationError,
	IDataObject,
	NodeConnectionType,
} from 'n8n-workflow';

import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';

export class MediaFont implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MediaFont',
		name: 'mediaFont',
		icon: 'file:font.png',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Manage fonts for MediaFX video processing',
		defaults: {
			name: 'MediaFont',
		},
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		credentials: [
			{
				name: 'mediaFXApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
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
				name: 'fontKey',
				type: 'string',
				displayOptions: {
					show: {
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
						operation: ['delete', 'preview'],
					},
				},
				default: '',
				description: 'Font to operate on',
			},

			// Font Key Validation
			{
				displayName: 'Font Key to Validate',
				name: 'fontKeyToValidate',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['validate'],
					},
				},
				default: '',
				placeholder: 'my-new-font-key',
				description: 'Font key to check for availability',
				required: true,
			},

			// Filter Options
			{
				displayName: 'Filter Options',
				name: 'filterOptions',
				type: 'collection',
				placeholder: 'Add Filter',
				displayOptions: {
					show: {
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
							{
								name: 'All Fonts',
								value: 'all',
							},
							{
								name: 'Korean Fonts',
								value: 'korean',
							},
							{
								name: 'Global Fonts',
								value: 'global',
							},
							{
								name: 'User Fonts',
								value: 'user',
							},
							{
								name: 'Fallback Fonts',
								value: 'fallback',
							},
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

			// Additional Options
			{
				displayName: 'Additional Options',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Timeout (seconds)',
						name: 'timeout',
						type: 'number',
						default: 60,
						description: 'Request timeout in seconds',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			// Load user fonts for selection
			async getUserFonts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('mediaFXApi');
				const baseUrl = credentials.baseUrl as string;

				try {
					const response = await axios.get(`${baseUrl}/fonts/user`, {
						headers: {
							'Authorization': credentials.apiKey ? `Bearer ${credentials.apiKey}` : undefined,
						},
					});

					const fonts = response.data.fonts || {};
					return Object.entries(fonts).map(([key, font]: [string, any]) => ({
						name: `${font.name || key} (${font.type || 'user'})`,
						value: key,
						description: font.description || 'User uploaded font',
					}));
				} catch (error) {
					return [];
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('mediaFXApi');
		const baseUrl = credentials.baseUrl as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
				const timeout = (additionalFields.timeout as number) || 60;

				let response: AxiosResponse;

				switch (operation) {
					case 'list':
						response = await this.listFonts(i, baseUrl, credentials.apiKey as string, timeout);
						break;

					case 'upload':
						response = await this.uploadFont(i, baseUrl, credentials.apiKey as string, timeout);
						break;

					case 'delete':
						response = await this.deleteFont(i, baseUrl, credentials.apiKey as string, timeout);
						break;

					case 'preview':
						response = await this.getFontPreview(i, baseUrl, credentials.apiKey as string, timeout);
						break;

					case 'validate':
						response = await this.validateFontKey(i, baseUrl, credentials.apiKey as string, timeout);
						break;

					default:
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
				}

				returnData.push({
					json: {
						success: true,
						operation,
						data: response.data,
						statusCode: response.status,
					},
				});

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
							operation: this.getNodeParameter('operation', i) as string,
							success: false,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}

	private async listFonts(
		this: IExecuteFunctions,
		itemIndex: number,
		baseUrl: string,
		apiKey: string,
		timeout: number,
	): Promise<AxiosResponse> {
		const filterOptions = this.getNodeParameter('filterOptions', itemIndex, {}) as any;

		let endpoint = '/fonts';
		if (filterOptions.fontType === 'user') {
			endpoint = '/fonts/user';
		}

		return await axios.get(`${baseUrl}${endpoint}`, {
			timeout: timeout * 1000,
			headers: {
				'Authorization': apiKey ? `Bearer ${apiKey}` : undefined,
			},
		});
	}

	private async uploadFont(
		this: IExecuteFunctions,
		itemIndex: number,
		baseUrl: string,
		apiKey: string,
		timeout: number,
	): Promise<AxiosResponse> {
		const fontSource = this.getNodeParameter('fontSource', itemIndex) as string;
		const fontKey = this.getNodeParameter('fontKey', itemIndex) as string;
		const fontName = this.getNodeParameter('fontName', itemIndex, '') as string;
		const description = this.getNodeParameter('description', itemIndex, '') as string;

		const formData = new FormData();
		formData.append('fontKey', fontKey);
		if (fontName) formData.append('fontName', fontName);
		if (description) formData.append('description', description);

		if (fontSource === 'binary') {
			const binaryProperty = this.getNodeParameter('binaryProperty', itemIndex) as string;
			const binaryData = await this.helpers.getBinaryDataBuffer(itemIndex, binaryProperty);
			const fileName = this.getInputData()[itemIndex].binary?.[binaryProperty]?.fileName || 'font.ttf';
			
			formData.append('font', binaryData, {
				filename: fileName,
				contentType: 'application/octet-stream',
			});
		} else {
			// File path source
			const filePath = this.getNodeParameter('filePath', itemIndex) as string;
			const fs = require('fs');
			
			if (!fs.existsSync(filePath)) {
				throw new NodeOperationError(this.getNode(), `Font file not found: ${filePath}`);
			}

			const fileBuffer = fs.readFileSync(filePath);
			const fileName = require('path').basename(filePath);
			
			formData.append('font', fileBuffer, {
				filename: fileName,
				contentType: 'application/octet-stream',
			});
		}

		return await axios.post(`${baseUrl}/fonts/upload`, formData, {
			timeout: timeout * 1000,
			headers: {
				'Authorization': apiKey ? `Bearer ${apiKey}` : undefined,
				...formData.getHeaders(),
			},
		});
	}

	private async deleteFont(
		this: IExecuteFunctions,
		itemIndex: number,
		baseUrl: string,
		apiKey: string,
		timeout: number,
	): Promise<AxiosResponse> {
		const fontKey = this.getNodeParameter('fontKey', itemIndex) as string;

		return await axios.delete(`${baseUrl}/fonts/${fontKey}`, {
			timeout: timeout * 1000,
			headers: {
				'Authorization': apiKey ? `Bearer ${apiKey}` : undefined,
			},
		});
	}

	private async getFontPreview(
		this: IExecuteFunctions,
		itemIndex: number,
		baseUrl: string,
		apiKey: string,
		timeout: number,
	): Promise<AxiosResponse> {
		const fontKey = this.getNodeParameter('fontKey', itemIndex) as string;

		return await axios.get(`${baseUrl}/fonts/preview/${fontKey}`, {
			timeout: timeout * 1000,
			headers: {
				'Authorization': apiKey ? `Bearer ${apiKey}` : undefined,
			},
		});
	}

	private async validateFontKey(
		this: IExecuteFunctions,
		itemIndex: number,
		baseUrl: string,
		apiKey: string,
		timeout: number,
	): Promise<AxiosResponse> {
		const fontKeyToValidate = this.getNodeParameter('fontKeyToValidate', itemIndex) as string;

		return await axios.post(`${baseUrl}/fonts/validate-key`, {
			fontKey: fontKeyToValidate,
		}, {
			timeout: timeout * 1000,
			headers: {
				'Authorization': apiKey ? `Bearer ${apiKey}` : undefined,
				'Content-Type': 'application/json',
			},
		});
	}
}