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

export class MediaFX implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MediaFX',
		name: 'mediaFX',
		icon: 'file:mediafx.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Process videos, audio, and media files with FFmpeg',
		defaults: {
			name: 'MediaFX',
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
			// Resource Selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Video Processing',
						value: 'video',
					},
					{
						name: 'Audio Processing',
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
						name: 'Media Management',
						value: 'media',
					},
				],
				default: 'video',
			},

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
						name: 'Merge Videos',
						value: 'merge',
						description: 'Combine multiple videos into one',
					},
					{
						name: 'Trim Video',
						value: 'trim',
						description: 'Cut a specific portion of video',
					},
					{
						name: 'Mix Audio',
						value: 'mixAudio',
						description: 'Add background music to video',
					},
				],
				default: 'merge',
			},

			// Audio Processing Operations
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
						name: 'Extract Audio',
						value: 'extract',
						description: 'Extract audio from video',
					},
					{
						name: 'Mix Audio',
						value: 'mix',
						description: 'Mix video with audio file',
					},
				],
				default: 'extract',
			},

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
						name: 'Add Subtitle File',
						value: 'addSubtitle',
						description: 'Add SRT subtitle file to video',
					},
					{
						name: 'Add Text Overlay',
						value: 'addText',
						description: 'Add custom text overlay to video',
					},
				],
				default: 'addText',
			},

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
						name: 'Apply Transition',
						value: 'apply',
						description: 'Apply transition effects between videos',
					},
					{
						name: 'Apply Fade Effect',
						value: 'fade',
						description: 'Apply fade in/out effects',
					},
					{
						name: 'Advanced Transition',
						value: 'advanced',
						description: 'Apply multiple custom transitions',
					},
				],
				default: 'apply',
			},

			// Media Management Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['media'],
					},
				},
				options: [
					{
						name: 'List Media',
						value: 'list',
						description: 'Get list of stored media files',
					},
					{
						name: 'Download Media',
						value: 'download',
						description: 'Download media file by ID',
					},
					{
						name: 'Delete Media',
						value: 'delete',
						description: 'Delete stored media file',
					},
					{
						name: 'Get Stats',
						value: 'stats',
						description: 'Get media storage statistics',
					},
				],
				default: 'list',
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
				default: {},
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
										name: 'Media ID',
										value: 'mediaId',
									},
									{
										name: 'Binary Data',
										value: 'binary',
									},
								],
								default: 'url',
							},
							{
								displayName: 'Video URL',
								name: 'videoUrl',
								type: 'string',
								displayOptions: {
									show: {
										sourceType: ['url'],
									},
								},
								default: '',
								placeholder: 'https://example.com/video.mp4',
							},
							{
								displayName: 'Media ID',
								name: 'mediaId',
								type: 'string',
								displayOptions: {
									show: {
										sourceType: ['mediaId'],
									},
								},
								default: '',
								placeholder: 'merge_2024-01-01_abc123',
							},
							{
								displayName: 'Binary Property',
								name: 'binaryProperty',
								type: 'string',
								displayOptions: {
									show: {
										sourceType: ['binary'],
									},
								},
								default: 'data',
								description: 'Name of the binary property containing video data',
							},
						],
					},
				],
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
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
				name: 'videoSource',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['video'],
						operation: ['trim'],
					},
				},
				default: '',
				placeholder: 'https://example.com/video.mp4 or media_id',
				description: 'Video URL or Media ID to trim',
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
				name: 'videoSource',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['video'],
						operation: ['mixAudio'],
					},
				},
				default: '',
				placeholder: 'https://example.com/video.mp4',
			},
			{
				displayName: 'Audio Source',
				name: 'audioSource',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['video'],
						operation: ['mixAudio'],
					},
				},
				default: '',
				placeholder: 'https://example.com/music.mp3',
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

			// ===================
			// SUBTITLE FIELDS
			// ===================
			{
				displayName: 'Video Source',
				name: 'videoSource',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['subtitle'],
					},
				},
				default: '',
				placeholder: 'https://example.com/video.mp4',
			},
			{
				displayName: 'Subtitle Text',
				name: 'subtitleText',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['subtitle'],
						operation: ['addText'],
					},
				},
				default: '',
				placeholder: 'Your subtitle text here',
			},
			{
				displayName: 'Start Time (seconds)',
				name: 'startTime',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['subtitle'],
						operation: ['addText'],
					},
				},
				default: 0,
			},
			{
				displayName: 'End Time (seconds)',
				name: 'endTime',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['subtitle'],
						operation: ['addText'],
					},
				},
				default: 5,
			},
			{
				displayName: 'Font Settings',
				name: 'fontSettings',
				type: 'collection',
				placeholder: 'Add Font Setting',
				displayOptions: {
					show: {
						resource: ['subtitle'],
						operation: ['addText'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Font Key',
						name: 'fontKey',
						type: 'options',
						typeOptions: {
							loadOptionsMethod: 'getFonts',
						},
						default: 'noto-sans-kr',
						description: 'Font to use for subtitle',
					},
					{
						displayName: 'Font Size',
						name: 'size',
						type: 'number',
						default: 48,
						description: 'Font size in pixels',
					},
					{
						displayName: 'Color',
						name: 'color',
						type: 'string',
						default: 'white',
						description: 'Text color (CSS color or hex)',
					},
					{
						displayName: 'Position X',
						name: 'x',
						type: 'string',
						default: '(w-text_w)/2',
						description: 'X position (expression or pixel value)',
					},
					{
						displayName: 'Position Y',
						name: 'y',
						type: 'string',
						default: 'h-200',
						description: 'Y position (expression or pixel value)',
					},
					{
						displayName: 'Background Box',
						name: 'box',
						type: 'boolean',
						default: false,
						description: 'Show background box behind text',
					},
					{
						displayName: 'Box Color',
						name: 'boxColor',
						type: 'string',
						default: 'black',
						description: 'Background box color',
						displayOptions: {
							show: {
								box: [true],
							},
						},
					},
					{
						displayName: 'Box Opacity',
						name: 'boxOpacity',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 1,
							numberStepSize: 0.1,
						},
						default: 0.5,
						description: 'Background box opacity (0.0 - 1.0)',
						displayOptions: {
							show: {
								box: [true],
							},
						},
					},
					{
						displayName: 'Outline',
						name: 'outline',
						type: 'boolean',
						default: false,
						description: 'Add text outline',
					},
					{
						displayName: 'Outline Color',
						name: 'outlineColor',
						type: 'string',
						default: 'black',
						description: 'Outline color',
						displayOptions: {
							show: {
								outline: [true],
							},
						},
					},
					{
						displayName: 'Outline Width',
						name: 'outlineWidth',
						type: 'number',
						default: 2,
						description: 'Outline width in pixels',
						displayOptions: {
							show: {
								outline: [true],
							},
						},
					},
				],
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
				default: {},
				options: [
					{
						displayName: 'Source',
						name: 'sources',
						values: [
							{
								displayName: 'Video URL/ID',
								name: 'source',
								type: 'string',
								default: '',
								placeholder: 'https://example.com/video.mp4',
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

			// FADE EFFECT FIELDS
			{
				displayName: 'Video Source',
				name: 'videoSource',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['transition'],
						operation: ['fade'],
					},
				},
				default: '',
				placeholder: 'https://example.com/video.mp4',
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
					{
						name: 'Fade In',
						value: 'fadein',
					},
					{
						name: 'Fade Out',
						value: 'fadeout',
					},
					{
						name: 'Audio Fade In',
						value: 'fadein-audio',
					},
					{
						name: 'Audio Fade Out',
						value: 'fadeout-audio',
					},
				],
				default: 'fadein',
			},
			{
				displayName: 'Start Time (seconds)',
				name: 'fadeStartTime',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['transition'],
						operation: ['fade'],
					},
				},
				default: 0,
				description: 'When to start the fade effect',
			},
			{
				displayName: 'Duration (seconds)',
				name: 'fadeDuration',
				type: 'number',
				typeOptions: {
					minValue: 0.1,
					maxValue: 10,
					numberStepSize: 0.1,
				},
				displayOptions: {
					show: {
						resource: ['transition'],
						operation: ['fade'],
					},
				},
				default: 1,
				description: 'Duration of fade effect',
			},

			// ===================
			// MEDIA MANAGEMENT FIELDS
			// ===================
			{
				displayName: 'Media ID',
				name: 'mediaId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['media'],
						operation: ['download', 'delete'],
					},
				},
				default: '',
				placeholder: 'merge_2024-01-01_abc123',
				description: 'ID of the media file',
			},

			// ===================
			// COMMON FIELDS
			// ===================
			{
				displayName: 'Additional Options',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Custom API Endpoint',
						name: 'customEndpoint',
						type: 'string',
						default: '',
						description: 'Override default API endpoint',
					},
					{
						displayName: 'Timeout (seconds)',
						name: 'timeout',
						type: 'number',
						default: 300,
						description: 'Request timeout in seconds',
					},
					{
						displayName: 'Return Binary Data',
						name: 'returnBinary',
						type: 'boolean',
						default: true,
						description: 'Whether to return the processed media as binary data',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			// Load available fonts from API
			async getFonts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('mediaFXApi');
				const baseUrl = credentials.baseUrl as string;

				try {
					const response = await axios.get(`${baseUrl}/fonts`, {
						headers: {
							'Authorization': credentials.apiKey ? `Bearer ${credentials.apiKey}` : undefined,
						},
					});

					const fonts = response.data.fonts || {};
					return Object.entries(fonts).map(([key, font]: [string, any]) => ({
						name: `${font.name} (${font.type})`,
						value: key,
						description: font.description || '',
					}));
				} catch (error) {
					return [
						{ name: 'Noto Sans KR (default)', value: 'noto-sans-kr' },
						{ name: 'DejaVu Sans (fallback)', value: 'dejavu-sans' },
					];
				}
			},

			// Load available transition effects from API
			async getTransitionEffects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('mediaFXApi');
				const baseUrl = credentials.baseUrl as string;

				try {
					const response = await axios.get(`${baseUrl}/transition/effects`, {
						headers: {
							'Authorization': credentials.apiKey ? `Bearer ${credentials.apiKey}` : undefined,
						},
					});

					const effects = response.data.transitions?.xfade || {};
					return Object.entries(effects).map(([key, effect]: [string, any]) => ({
						name: `${effect.name} - ${effect.description}`,
						value: key,
						description: `Category: ${effect.category}`,
					}));
				} catch (error) {
					return [
						{ name: 'Fade - Basic fade transition', value: 'fade' },
						{ name: 'Slide Left - Slide to left', value: 'slideleft' },
						{ name: 'Wipe Right - Wipe to right', value: 'wiperight' },
						{ name: 'Circle Open - Open in circle', value: 'circleopen' },
					];
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
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

				let endpoint = '';
				let requestData: any = {};
				let method = 'POST';

				// Route to appropriate API endpoint based on resource and operation
				switch (resource) {
					case 'video':
						endpoint = await this.handleVideoOperations(i, operation, requestData);
						break;
					case 'audio':
						endpoint = await this.handleAudioOperations(i, operation, requestData);
						break;
					case 'subtitle':
						endpoint = await this.handleSubtitleOperations(i, operation, requestData);
						break;
					case 'transition':
						endpoint = await this.handleTransitionOperations(i, operation, requestData);
						break;
					case 'media':
						const mediaResult = await this.handleMediaOperations(i, operation);
						if (mediaResult.method) method = mediaResult.method;
						endpoint = mediaResult.endpoint;
						requestData = mediaResult.requestData || {};
						break;
				}

				if (additionalFields.customEndpoint) {
					endpoint = additionalFields.customEndpoint as string;
				}

				// Make API request
				const timeout = (additionalFields.timeout as number) || 300;
				const axiosConfig = {
					method: method as any,
					url: `${baseUrl}${endpoint}`,
					timeout: timeout * 1000,
					responseType: (additionalFields.returnBinary !== false ? 'arraybuffer' : 'json') as any,
					headers: {
						'Authorization': credentials.apiKey ? `Bearer ${credentials.apiKey}` : undefined,
						'Content-Type': 'application/json',
					},
				};

				if (method !== 'GET' && Object.keys(requestData).length > 0) {
					axiosConfig['data'] = requestData;
				}

				const response: AxiosResponse = await axios(axiosConfig);

				// Handle response
				if (additionalFields.returnBinary !== false && response.data instanceof ArrayBuffer) {
					// Return as binary data
					const binaryData = await this.helpers.prepareBinaryData(
						Buffer.from(response.data),
						`${resource}_${operation}_${Date.now()}.mp4`,
						'video/mp4',
					);

					returnData.push({
						json: {
							success: true,
							operation: `${resource}.${operation}`,
							size: response.data.byteLength,
							contentType: response.headers['content-type'] || 'video/mp4',
						},
						binary: {
							data: binaryData,
						},
					});
				} else {
					// Return as JSON data
					returnData.push({
						json: {
							success: true,
							operation: `${resource}.${operation}`,
							data: response.data,
						},
					});
				}

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
							operation: `${this.getNodeParameter('resource', i)}.${this.getNodeParameter('operation', i)}`,
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

	// Helper methods for handling different resource operations
	private async handleVideoOperations(
		this: IExecuteFunctions,
		itemIndex: number,
		operation: string,
		requestData: any,
	): Promise<string> {
		switch (operation) {
			case 'merge':
				const videoSources = this.getNodeParameter('videoSources', itemIndex, {}) as any;
				const outputFormat = this.getNodeParameter('outputFormat', itemIndex) as string;

				const sources = videoSources.sources?.map((source: any) => {
					switch (source.sourceType) {
						case 'url':
							return source.videoUrl;
						case 'mediaId':
							return source.mediaId;
						case 'binary':
							// Handle binary data - would need to upload first
							return source.binaryProperty;
						default:
							return source.videoUrl;
					}
				}) || [];

				requestData.sources = sources;
				requestData.outputFormat = outputFormat;
				return '/merge';

			case 'trim':
				requestData.source = this.getNodeParameter('videoSource', itemIndex);
				requestData.from = this.getNodeParameter('startTime', itemIndex);
				requestData.to = this.getNodeParameter('endTime', itemIndex);
				return '/trim';

			case 'mixAudio':
				requestData.video = this.getNodeParameter('videoSource', itemIndex);
				requestData.audio = this.getNodeParameter('audioSource', itemIndex);
				requestData.volumeVideo = this.getNodeParameter('videoVolume', itemIndex);
				requestData.volumeAudio = this.getNodeParameter('audioVolume', itemIndex);
				return '/mix-audio';

			default:
				throw new NodeOperationError(this.getNode(), `Unknown video operation: ${operation}`);
		}
	}

	private async handleAudioOperations(
		this: IExecuteFunctions,
		itemIndex: number,
		operation: string,
		requestData: any,
	): Promise<string> {
		switch (operation) {
			case 'extract':
				requestData.source = this.getNodeParameter('videoSource', itemIndex);
				return '/audio/extract';

			case 'mix':
				requestData.video = this.getNodeParameter('videoSource', itemIndex);
				requestData.audio = this.getNodeParameter('audioSource', itemIndex);
				requestData.volumeVideo = this.getNodeParameter('videoVolume', itemIndex, 0.8);
				requestData.volumeAudio = this.getNodeParameter('audioVolume', itemIndex, 0.5);
				return '/mix-audio';

			default:
				throw new NodeOperationError(this.getNode(), `Unknown audio operation: ${operation}`);
		}
	}

	private async handleSubtitleOperations(
		this: IExecuteFunctions,
		itemIndex: number,
		operation: string,
		requestData: any,
	): Promise<string> {
		requestData.video = this.getNodeParameter('videoSource', itemIndex);

		switch (operation) {
			case 'addText':
				requestData.text = this.getNodeParameter('subtitleText', itemIndex);
				requestData.startTime = this.getNodeParameter('startTime', itemIndex);
				requestData.endTime = this.getNodeParameter('endTime', itemIndex);

				const fontSettings = this.getNodeParameter('fontSettings', itemIndex, {}) as any;
				if (Object.keys(fontSettings).length > 0) {
					requestData.style = fontSettings;
				}
				return '/subtitle/text';

			case 'addSubtitle':
				// Handle subtitle file upload
				requestData.subtitle = this.getNodeParameter('subtitleFile', itemIndex);
				return '/subtitle';

			default:
				throw new NodeOperationError(this.getNode(), `Unknown subtitle operation: ${operation}`);
		}
	}

	private async handleTransitionOperations(
		this: IExecuteFunctions,
		itemIndex: number,
		operation: string,
		requestData: any,
	): Promise<string> {
		switch (operation) {
			case 'apply':
				const transitionSources = this.getNodeParameter('transitionSources', itemIndex, {}) as any;
				const sources = transitionSources.sources?.map((source: any) => source.source) || [];

				requestData.sources = sources;
				requestData.transition = this.getNodeParameter('transitionEffect', itemIndex);
				requestData.duration = this.getNodeParameter('transitionDuration', itemIndex);
				return '/transition';

			case 'fade':
				requestData.video = this.getNodeParameter('videoSource', itemIndex);
				requestData.effect = this.getNodeParameter('fadeEffect', itemIndex);
				requestData.startTime = this.getNodeParameter('fadeStartTime', itemIndex);
				requestData.duration = this.getNodeParameter('fadeDuration', itemIndex);
				return '/transition/fade';

			case 'advanced':
				// Handle advanced multi-transition setup
				return '/transition/advanced';

			default:
				throw new NodeOperationError(this.getNode(), `Unknown transition operation: ${operation}`);
		}
	}

	private async handleMediaOperations(
		this: IExecuteFunctions,
		itemIndex: number,
		operation: string,
	): Promise<{ endpoint: string; method?: string; requestData?: any }> {
		switch (operation) {
			case 'list':
				return { endpoint: '/media', method: 'GET' };

			case 'download':
				const downloadMediaId = this.getNodeParameter('mediaId', itemIndex);
				return { endpoint: `/media/download/${downloadMediaId}`, method: 'GET' };

			case 'delete':
				const deleteMediaId = this.getNodeParameter('mediaId', itemIndex);
				return { endpoint: `/media/${deleteMediaId}`, method: 'DELETE' };

			case 'stats':
				return { endpoint: '/media/stats', method: 'GET' };

			default:
				throw new NodeOperationError(this.getNode(), `Unknown media operation: ${operation}`);
		}
	}
}