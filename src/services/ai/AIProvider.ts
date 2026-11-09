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
  ReferenceCategory,
  ReferenceGenerateOptions,
  ReferenceGenerateResult,
  SegmentationResult,
  SketchConvertOptions,
  VectorizeOptions,
  VectorizeResult,
} from "./types";

export interface IAIProvider {
  getStatus(): Promise<AIProviderStatus>;

  // 1. Sketch Converter
  convertSketch(imageUri: string, options: SketchConvertOptions): Promise<string>;

  // 2. Drawing Analyzer
  analyzeDrawing(request: DrawingAnalysisRequest): Promise<DrawingAnalysisResult>;

  // 3. Reference Generator
  generateReference(options: ReferenceGenerateOptions): Promise<ReferenceGenerateResult>;

  // 5. Pose & Gesture Coach
  detectPose(imageUri?: string, width?: number, height?: number): Promise<PoseResult>;

  // 6. Hand & Foot Assistant
  analyzeHandFoot(type: HandFootType, imageUri?: string, width?: number, height?: number): Promise<HandFootResult>;

  // 7. Lighting Predictor
  predictLighting(imageUri?: string, pixels?: Uint8Array | Float32Array | null, width?: number, height?: number): Promise<LightingResult>;

  // 8. Composition Coach
  analyzeComposition(imageUri?: string, pixels?: Uint8Array | Float32Array | null, width?: number, height?: number): Promise<CompositionResult>;

  // 9. Line Art Cleaner
  cleanLineArt(imageUri: string, options: LineArtCleanOptions): Promise<string>;

  // 10. Smart Segmentation
  segmentSubject(imageUri: string, pixels?: Uint8Array | Float32Array | null, width?: number, height?: number): Promise<SegmentationResult>;

  // 11. Color Recommender
  recommendColors(dominantHexes: string[]): Promise<ColorPaletteRecommendation>;

  // 12. Multi-Angle Reference
  generateTurnaround(category: string, subjectType: string): Promise<MultiAngleResult>;

  // 14. Mistake Detector
  detectMistakes(drawingUri?: string, referenceUri?: string, pixels?: Uint8Array | Float32Array | null, width?: number, height?: number): Promise<MistakeDetectionResult>;

  // 15. Art Mentor
  consultMentor(history: ArtMentorMessage[], query: string, context?: { skillLevel: string; currentTool?: string }): Promise<ArtMentorMessage>;

  // 16. Vectorizer
  vectorizeSketch(imageUri: string, options: VectorizeOptions): Promise<VectorizeResult>;
}
