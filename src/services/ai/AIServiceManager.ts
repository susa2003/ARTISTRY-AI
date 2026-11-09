import type { IAIProvider } from "./AIProvider";
import { CloudHttpProvider } from "./CloudHttpProvider";
import { LocalFallbackProvider } from "./LocalFallbackProvider";
import type {
  AIProviderStatus,
  ArtMentorMessage,
  ColorPaletteRecommendation,
  CompositionResult,
  DrawingAnalysisRequest,
  DrawingAnalysisResult,
  HandFootResult,
  HandFootType,
  LightingResult,
  LineArtCleanOptions,
  MistakeDetectionResult,
  MultiAngleResult,
  PoseResult,
  ReferenceGenerateOptions,
  ReferenceGenerateResult,
  SegmentationResult,
  SketchConvertOptions,
  VectorizeOptions,
  VectorizeResult,
} from "./types";

export class AIServiceManager implements IAIProvider {
  private static instance: AIServiceManager;
  private provider: IAIProvider;
  private localProvider: LocalFallbackProvider;

  private constructor() {
    this.localProvider = new LocalFallbackProvider();
    const endpoint = process.env.EXPO_PUBLIC_AI_API_URL?.trim();
    if (endpoint) {
      this.provider = new CloudHttpProvider(endpoint);
    } else {
      this.provider = this.localProvider;
    }
  }

  public static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
  }

  async getStatus(): Promise<AIProviderStatus> {
    return this.provider.getStatus();
  }

  async convertSketch(imageUri: string, options: SketchConvertOptions): Promise<string> {
    return this.provider.convertSketch(imageUri, options);
  }

  async analyzeDrawing(request: DrawingAnalysisRequest): Promise<DrawingAnalysisResult> {
    return this.provider.analyzeDrawing(request);
  }

  async generateReference(options: ReferenceGenerateOptions): Promise<ReferenceGenerateResult> {
    return this.provider.generateReference(options);
  }

  async detectPose(imageUri?: string, width?: number, height?: number): Promise<PoseResult> {
    return this.provider.detectPose(imageUri, width, height);
  }

  async analyzeHandFoot(type: HandFootType, imageUri?: string, width?: number, height?: number): Promise<HandFootResult> {
    return this.provider.analyzeHandFoot(type, imageUri, width, height);
  }

  async predictLighting(imageUri?: string, pixels?: Uint8Array | Float32Array | null, width?: number, height?: number): Promise<LightingResult> {
    return this.provider.predictLighting(imageUri, pixels, width, height);
  }

  async analyzeComposition(imageUri?: string, pixels?: Uint8Array | Float32Array | null, width?: number, height?: number): Promise<CompositionResult> {
    return this.provider.analyzeComposition(imageUri, pixels, width, height);
  }

  async cleanLineArt(imageUri: string, options: LineArtCleanOptions): Promise<string> {
    return this.provider.cleanLineArt(imageUri, options);
  }

  async segmentSubject(imageUri: string, pixels?: Uint8Array | Float32Array | null, width?: number, height?: number): Promise<SegmentationResult> {
    return this.provider.segmentSubject(imageUri, pixels, width, height);
  }

  async recommendColors(dominantHexes: string[]): Promise<ColorPaletteRecommendation> {
    return this.provider.recommendColors(dominantHexes);
  }

  async generateTurnaround(category: string, subjectType: string): Promise<MultiAngleResult> {
    return this.provider.generateTurnaround(category, subjectType);
  }

  async detectMistakes(drawingUri?: string, referenceUri?: string, pixels?: Uint8Array | Float32Array | null, width?: number, height?: number): Promise<MistakeDetectionResult> {
    return this.provider.detectMistakes(drawingUri, referenceUri, pixels, width, height);
  }

  async consultMentor(history: ArtMentorMessage[], query: string, context?: { skillLevel: string; currentTool?: string }): Promise<ArtMentorMessage> {
    return this.provider.consultMentor(history, query, context);
  }

  async vectorizeSketch(imageUri: string, options: VectorizeOptions): Promise<VectorizeResult> {
    return this.provider.vectorizeSketch(imageUri, options);
  }
}

export const aiService = AIServiceManager.getInstance();
