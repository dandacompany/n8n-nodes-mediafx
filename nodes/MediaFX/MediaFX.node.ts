import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	INodePropertyOptions,
	ILoadOptionsFunctions,
	NodeOperationError,
	IDataObject,
} from 'n8n-workflow';
import * as fs from 'fs-extra';
import * as path from 'path';
// import ffmpeg = require('fluent-ffmpeg');
import {
	resolveInputs,
	deleteUserFont,
	getAvailableFonts,
	getUserFonts,
	saveUserFont,
	cleanupOldTempFiles,
} from './utils';
import {
	executeAddSubtitle,
	executeAddText,
	executeExtractAudio,
	executeImageToVideo,
	executeMerge,
	executeMixAudio,
	executeStampImage,
	executeMultiVideoTransition,
	executeSingleVideoFade,
	executeTrim,
} from './operations';
import { audioProperties } from './properties/audio.properties';
import { fontProperties } from './properties/font.properties';
import { imageProperties } from './properties/image.properties';
import { resourceSelection } from './properties/resources.properties';
import { subtitleProperties } from './properties/subtitle.properties';
import { videoProperties } from './properties/video.properties';

// --- OPERATION EXECUTORS ---

// ALL OPERATION EXECUTORS MOVED TO ./operations/*

export class MediaFX implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MediaFX',
		name: 'mediaFX',
		icon: 'file:mediafx.png',
		group: ['transform'],
		version: 1,
		description: 'Process videos, audio, and media files with FFmpeg',
		defaults: {
			name: 'MediaFX',
		},
		inputs: ['main'],
		outputs: ['main'],
		// No credentials needed for local processing
		properties: [
			...resourceSelection,
			...videoProperties,
			...audioProperties,
			...subtitleProperties,
			...imageProperties,
			...fontProperties,
		],
	};

	methods = {
		loadOptions: {
			// Load available fonts from API
			async getFonts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const allFonts = getAvailableFonts();
					return Object.entries(allFonts).map(([key, font]: [string, any]) => ({
						name: `${font.name || key} (${font.type})`,
						value: key,
						description: font.description || '',
					}));
				} catch (error) {
					return [];
				}
			},

			// Load available transition effects from a static list
			async getTransitionEffects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				// Mark effects that require FFmpeg 4.3+
				const effects = [
					{ name: 'Fade', value: 'fade', description: 'Works with all FFmpeg versions' },
					{ name: 'Fade Black', value: 'fadeblack', description: 'Works with all FFmpeg versions' },
					{ name: 'Fade White', value: 'fadewhite', description: 'Works with all FFmpeg versions' },
					{ name: 'Wipe Left', value: 'wipeleft', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Wipe Right', value: 'wiperight', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Wipe Up', value: 'wipeup', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Wipe Down', value: 'wipedown', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Slide Left', value: 'slideleft', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Slide Right', value: 'slideright', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Slide Up', value: 'slideup', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Slide Down', value: 'slidedown', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Circle Crop', value: 'circlecrop', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Rect Crop', value: 'rectcrop', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Distance', value: 'distance', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Fade Grayscale', value: 'fadegrays', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Radial', value: 'radial', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Circle Open', value: 'circleopen', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Circle Close', value: 'circleclose', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Pixelize', value: 'pixelize', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Dissolve', value: 'dissolve', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Checkerboard', value: 'diagtl', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Box-in', value: 'boxin', description: 'Requires FFmpeg 4.3+' },
					{ name: 'Iris', value: 'iris', description: 'Requires FFmpeg 4.3+' },
				];
				return effects;
			},
			async getUserFonts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const userFonts = getUserFonts();
					return Object.entries(userFonts).map(([key, font]: [string, any]) => ({
						name: `${font.name || key} (user)`,
						value: key,
						description: font.description || 'User uploaded font',
					}));
				} catch (error) {
					// This is optional, so return empty on error
					return [];
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Periodically clean up old temporary files (every 10th execution)
		if (Math.random() < 0.1) {
			cleanupOldTempFiles(24).catch(() => {
				// Ignore cleanup errors to avoid disrupting main operation
			});
		}

		for (let i = 0; i < items.length; i++) {
			let cleanup = async () => {}; // Initialize cleanup function for each iteration
			let resource = ''; // Initialize resource variable for error handling
			
			try {
				resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let resultData: IDataObject | IDataObject[] | null = null;
				let outputPath: string | null = null;

				// ===================================
				// FONT RESOURCE OPERATIONS
				// ===================================
				if (resource === 'font') {
					switch (operation) {
						case 'list': {
							const filterOptions = this.getNodeParameter('filterOptions', i, {}) as IDataObject;
							const fontTypeFilter = (filterOptions.fontType as string) || 'all';
							const allFonts = getAvailableFonts();

							if (fontTypeFilter === 'all') {
								resultData = allFonts;
							} else {
								resultData = Object.fromEntries(
									Object.entries(allFonts).filter(
										([, font]) => (font as IDataObject).type === fontTypeFilter,
									),
								);
							}
							break;
						}

						case 'upload': {
							const fontSource = this.getNodeParameter('fontSource', i) as string;
							const fontKey = this.getNodeParameter('fontKeyUpload', i) as string;
							const fontName = this.getNodeParameter('fontName', i, '') as string;
							const description = this.getNodeParameter('description', i, '') as string;

							let buffer: Buffer;
							let originalname: string;

							if (fontSource === 'binary') {
								const binaryProperty = this.getNodeParameter('binaryProperty', i) as string;
								const binaryData = items[i].binary;
								if (!binaryData || !binaryData[binaryProperty]) {
									throw new NodeOperationError(
										this.getNode(),
										`No binary data found in property '${binaryProperty}'`,
										{ itemIndex: i },
									);
								}
								buffer = await this.helpers.getBinaryDataBuffer(i, binaryProperty);
								originalname = binaryData[binaryProperty].fileName || 'font.ttf';
							} else {
								// filepath
								const filePath = this.getNodeParameter('filePath', i) as string;
								if (!fs.existsSync(filePath)) {
									throw new NodeOperationError(
										this.getNode(),
										`Font file not found at path: ${filePath}`,
										{ itemIndex: i },
									);
								}
								buffer = fs.readFileSync(filePath);
								originalname = path.basename(filePath);
							}
							resultData = saveUserFont(fontKey, fontName, description, originalname, buffer);
							break;
						}

						case 'delete': {
							const fontKey = this.getNodeParameter('fontKey', i) as string;
							deleteUserFont(fontKey);
							resultData = { message: `Font '${fontKey}' deleted successfully.` };
							break;
						}
					}
				}
				// ===================================
				// MEDIA RESOURCE OPERATIONS
				// ===================================
				else {
					switch (operation) {
						// Video Operations
						case 'merge': {
							const sourcesParam = this.getNodeParameter('videoSources', i, {}) as {
								sources?: Array<{ sourceType: string; value: string; binaryProperty?: string }>;
							};
							const sourcesConfig = sourcesParam.sources || [];
							const { paths, cleanup: c } = await resolveInputs(this, i, sourcesConfig);
							cleanup = c;

							const mergeOutputFormat = this.getNodeParameter('videoOutputFormat', i) as string;
							outputPath = await executeMerge.call(this, paths, mergeOutputFormat, i);
							break;
						}
						case 'trim': {
							const sourceParam = this.getNodeParameter('source', i, {}) as {
								source: { sourceType: string; value: string; binaryProperty?: string };
							};
							const { paths, cleanup: c } = await resolveInputs(this, i, [sourceParam.source]);
							cleanup = c;

							const startTime = this.getNodeParameter('startTime', i, 0) as number;
							const endTime = this.getNodeParameter('endTime', i, 10) as number;
							const outputFormat = this.getNodeParameter('videoOutputFormat', i, 'mp4') as string;

							outputPath = await executeTrim.call(this, paths[0], startTime, endTime, outputFormat, i);
							break;
						}

						// Audio Operations
						case 'extract': {
							const sourceParam = this.getNodeParameter('source', i, {}) as {
								sourceType?: string;
								value?: string;
								binaryProperty?: string;
							};
							const { paths, cleanup: c } = await resolveInputs(this, i, [sourceParam as any]);
							cleanup = c;

							const extractFormat = this.getNodeParameter('audioOutputFormat', i) as string;
							const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as {
								audioCodec?: string;
								audioBitrate?: string;
							};
							const extractCodec = advancedOptions.audioCodec || 'copy';
							const extractBitrate = advancedOptions.audioBitrate || '192k';

							outputPath = await executeExtractAudio.call(
								this,
								paths[0],
								extractFormat,
								extractCodec,
								extractBitrate,
								i,
							);
							break;
						}

						case 'mixAudio': {
							// Construct source objects from flattened properties
							const videoSourceType = this.getNodeParameter('mixVideoSourceType', i, 'url') as string;
							const videoSourceParam = {
								sourceType: videoSourceType,
								value:
									videoSourceType === 'url'
										? (this.getNodeParameter('mixVideoSourceUrl', i, '') as string)
										: '',
								binaryProperty:
									videoSourceType === 'binary'
										? (this.getNodeParameter('mixVideoSourceBinary', i, 'data') as string)
										: '',
							};

							const audioSourceType = this.getNodeParameter('mixAudioSourceType', i, 'url') as string;
							const audioSourceParam = {
								sourceType: audioSourceType,
								value:
									audioSourceType === 'url'
										? (this.getNodeParameter('mixAudioSourceUrl', i, '') as string)
										: '',
								binaryProperty:
									audioSourceType === 'binary'
										? (this.getNodeParameter('mixAudioSourceBinary', i, 'data') as string)
										: '',
							};

							const { paths: videoPaths, cleanup: videoCleanup } = await resolveInputs(this, i, [
								videoSourceParam as any,
							]);
							const { paths: audioPaths, cleanup: audioCleanup } = await resolveInputs(this, i, [
								audioSourceParam as any,
							]);
							cleanup = async () => {
								await videoCleanup();
								await audioCleanup();
							};

							const videoVol = this.getNodeParameter('videoVolume', i, 1.0) as number;
							const audioVol = this.getNodeParameter('audioVolume', i, 1.0) as number;

							const matchLength = this.getNodeParameter('matchLength', i, 'shortest') as
								| 'shortest'
								| 'longest'
								| 'first';

							// Get advanced mixing parameters directly
							const enablePartialMix = this.getNodeParameter('enablePartialMix', i, false) as boolean;
							const advancedMixing: IDataObject = {
								enablePartialMix,
								startTime: enablePartialMix ? this.getNodeParameter('startTime', i, 0) : 0,
								duration: enablePartialMix ? this.getNodeParameter('duration', i, undefined) : undefined,
								loop: enablePartialMix ? this.getNodeParameter('loop', i, false) : false,
								enableFadeIn: this.getNodeParameter('enableFadeIn', i, false),
								fadeInDuration: this.getNodeParameter('fadeInDuration', i, 1),
								enableFadeOut: this.getNodeParameter('enableFadeOut', i, false),
								fadeOutDuration: this.getNodeParameter('fadeOutDuration', i, 1),
							};

							outputPath = await executeMixAudio.call(
								this,
								videoPaths[0],
								audioPaths[0],
								videoVol,
								audioVol,
								matchLength,
								advancedMixing,
								i,
							);
							break;
						}

						// Subtitle Operations
						case 'addSubtitle': {
							const videoSourceParam = this.getNodeParameter('source', i) as {
								source: { sourceType: string; value: string; binaryProperty?: string };
							};
							const { paths: videoPaths, cleanup: videoCleanup } = await resolveInputs(
								this,
								i,
								[videoSourceParam.source],
							);

							const subFileParam = this.getNodeParameter('subtitleFileSource', i) as {
								source: { sourceType: string; value: string; binaryProperty?: string };
							};
							const { paths: subFilePaths, cleanup: subFileCleanup } = await resolveInputs(
								this,
								i,
								[subFileParam.source],
							);

							cleanup = async () => {
								await videoCleanup();
								await subFileCleanup();
							};

							// Collect style options from individual parameters
							const style: IDataObject = {
								fontKey: this.getNodeParameter('fontKey', i, 'noto-sans-kr'),
								size: this.getNodeParameter('size', i, 48),
								color: this.getNodeParameter('color', i, 'white'),
								outlineWidth: this.getNodeParameter('outlineWidth', i, 1),
								positionType: this.getNodeParameter('positionType', i, 'alignment'),
								horizontalAlign: this.getNodeParameter('horizontalAlign', i, 'center'),
								verticalAlign: this.getNodeParameter('verticalAlign', i, 'bottom'),
								paddingX: this.getNodeParameter('paddingX', i, 20),
								paddingY: this.getNodeParameter('paddingY', i, 20),
								x: this.getNodeParameter('x', i, '(w-text_w)/2'),
								y: this.getNodeParameter('y', i, 'h-th-50'),
							};

							outputPath = await executeAddSubtitle.call(
								this,
								videoPaths[0],
								subFilePaths[0],
								style,
								i,
							);
							break;
						}

						case 'addText': {
							const sourceParam = this.getNodeParameter('source', i) as {
								source: { sourceType: string; value: string; binaryProperty?: string };
							};
							const { paths, cleanup: c } = await resolveInputs(this, i, [sourceParam.source]);
							cleanup = c;

							// Get text content and timing
							const text = this.getNodeParameter('text', i, 'Hello, n8n!') as string;
							const startTime = this.getNodeParameter('startTime', i, 0) as number;
							const endTime = this.getNodeParameter('endTime', i, 5) as number;

							// Collect style options from individual parameters
							const textOptions: IDataObject = {
								fontKey: this.getNodeParameter('fontKey', i, 'noto-sans-kr'),
								size: this.getNodeParameter('size', i, 48),
								color: this.getNodeParameter('color', i, 'white'),
								outlineWidth: this.getNodeParameter('outlineWidth', i, 1),
								positionType: this.getNodeParameter('positionType', i, 'alignment'),
								horizontalAlign: this.getNodeParameter('horizontalAlign', i, 'center'),
								verticalAlign: this.getNodeParameter('verticalAlign', i, 'bottom'),
								paddingX: this.getNodeParameter('paddingX', i, 20),
								paddingY: this.getNodeParameter('paddingY', i, 20),
								x: this.getNodeParameter('x', i, '(w-text_w)/2'),
								y: this.getNodeParameter('y', i, 'h-th-10'),
								startTime,
								endTime,
							};

							outputPath = await executeAddText.call(this, paths[0], text, textOptions, i);
							break;
						}

						case 'multiTransition': {
							const sourcesParam = this.getNodeParameter('transitionSources', i, {}) as {
								sources?: Array<{ sourceType: string; value: string; binaryProperty?: string }>;
							};
							const sourcesConfig = sourcesParam.sources || [];
							const { paths, cleanup: c } = await resolveInputs(this, i, sourcesConfig);
							cleanup = c;

							const transitionEffect = this.getNodeParameter('transitionEffect', i) as string;
							const transitionDuration = this.getNodeParameter('transitionDuration', i) as number;
							const transitionOutputFormat = this.getNodeParameter(
								'transitionOutputFormat',
								i,
								'mp4',
							) as string;
							outputPath = await executeMultiVideoTransition.call(
								this,
								paths,
								transitionEffect,
								transitionDuration,
								transitionOutputFormat,
								i,
							);
							break;
						}

						case 'singleFade': {
							const sourceParam = this.getNodeParameter('fadeSource', i) as {
								source: { sourceType: string; value: string; binaryProperty?: string };
							};
							const { paths, cleanup: c } = await resolveInputs(this, i, [sourceParam.source]);
							cleanup = c;

							const fadeEffect = this.getNodeParameter('fadeEffect', i) as 'in' | 'out';
							const fadeStartTime = this.getNodeParameter('fadeStartTime', i) as number;
							const fadeDuration = this.getNodeParameter('fadeDuration', i) as number;
							const outputFormat = this.getNodeParameter('transitionOutputFormat', i, 'mp4') as string;

							outputPath = await executeSingleVideoFade.call(
								this,
								paths[0],
								fadeEffect,
								fadeStartTime,
								fadeDuration,
								outputFormat,
								i,
							);
							break;
						}

						case 'imageToVideo': {
							const sourceParam = this.getNodeParameter('sourceImage', i, {}) as {
								source: { sourceType: string; value: string; binaryProperty?: string };
							};
							const { paths, cleanup: c } = await resolveInputs(this, i, [sourceParam.source]);
							cleanup = c;

							const duration = this.getNodeParameter('duration', i, 10) as number;
							const videoSize = this.getNodeParameter('videoSize', i) as {
								width: number;
								height: number;
							};
							const outputFormat = this.getNodeParameter('imageOutputFormat', i, 'mp4') as string;
							outputPath = await executeImageToVideo.call(
								this,
								paths[0],
								duration,
								videoSize,
								outputFormat,
								i,
							);
							break;
						}

						case 'stampImage': {
							const sourceVideo = this.getNodeParameter('sourceVideo.source', i) as {
								sourceType: string;
								value: string;
								binaryProperty?: string;
							};
							const stampImage = this.getNodeParameter('stampImage.source', i) as {
								sourceType: string;
								value: string;
								binaryProperty?: string;
							};
							
							// Get individual stamp options
							const stampOptions: IDataObject = {
								width: this.getNodeParameter('width', i, 150),
								height: this.getNodeParameter('height', i, -1),
								x: this.getNodeParameter('x', i, '10'),
								y: this.getNodeParameter('y', i, '10'),
								rotation: this.getNodeParameter('rotation', i, 0),
								enableTimeControl: this.getNodeParameter('enableTimeControl', i, false),
								startTime: this.getNodeParameter('startTime', i, 0),
								endTime: this.getNodeParameter('endTime', i, 5),
								opacity: this.getNodeParameter('opacity', i, 1.0),
							};

							const { paths: videoPaths, cleanup: videoCleanup } = await resolveInputs(this, i, [
								sourceVideo,
							]);
							const { paths: imagePaths, cleanup: imageCleanup } = await resolveInputs(this, i, [
								stampImage,
							]);
							cleanup = async () => {
								await videoCleanup();
								await imageCleanup();
							};

							outputPath = await executeStampImage.call(
								this,
								videoPaths[0],
								imagePaths[0],
								stampOptions,
								i,
							);
							break;
						}
					}
					
					// Always cleanup after operations
					await cleanup();
				}

				// ===================================
				// FINAL OUTPUT PROCESSING
				// ===================================
				if (outputPath) {
					// Operation resulted in a file to be returned
					const binaryData = await fs.readFile(outputPath);
					const fileName = path.basename(outputPath);
					const binary = await this.helpers.prepareBinaryData(binaryData, fileName);
					
					// Get the output field name from parameters (default to 'data')
					const outputFieldName = this.getNodeParameter('outputFieldName', i, 'data') as string;

					await fs.remove(outputPath); // Clean up temp file
					returnData.push({ json: {}, binary: { [outputFieldName]: binary }, pairedItem: { item: i } });
				} else if (resultData) {
					// Operation resulted in JSON data
					returnData.push({
						json: {
							success: true,
							operation: this.getNodeParameter('operation', i) as string,
							data: resultData,
						},
						pairedItem: { item: i },
					});
				} else if (resource !== 'font') {
					// This case handles non-font operations that might not produce output
					throw new NodeOperationError(
						this.getNode(),
						`Operation "${operation}" on resource "${resource}" did not produce an output.`,
						{ itemIndex: i },
					);
				}
			} catch (error) {
				// Ensure cleanup is called even if an error occurs
				// Note: cleanup is only available for media operations, not font operations
				if (resource !== 'font' && typeof cleanup === 'function') {
					await cleanup().catch(() => {
						// Ignore cleanup errors to avoid masking the original error
					});
				}
				
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
} 