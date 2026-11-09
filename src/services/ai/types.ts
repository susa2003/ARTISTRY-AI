import type { AnalysisAnnotation, BrushKind, StrokePoint } from "../../domain/types";

export type AIProviderMode = "local" | "cloud";

export type AIProviderStatus = {
  mode: AIProviderMode;
  isCloudAvailable: boolean;
  endpoint?: string;
  lastPingMs?: number;
};

// 1. Sketch Converter
export type SketchStyle =
  | "graphite"
  | "charcoal"
  | "ink"
  | "lineart"
  | "coloredpencil"
  | "watercolor"
  | "cartoon"
  | "realistic";

export type SketchConvertOptions = {
  style: SketchStyle;
  intensity: number;      // 0 - 100
  contrast: number;       // 0 - 100
  brightness: number;     // 0 - 100
  detailLevel: number;    // 0 - 100
  edgeStrength: number;   // 0 - 100
  grayscale: boolean;
  paperTexture: boolean;
};

// 2. Drawing Analyzer
export type DrawingAnalysisRequest = {
  drawingPixels?: Uint8Array | Float32Array | null;
  referencePixels?: Uint8Array | Float32Array | null;
  width: number;
  height: number;
  drawingUri?: string;
  referenceUri?: string;
};

export type DrawingAnalysisResult = {
  overallScore: number;
  proportionsScore: number;
  alignmentScore: number;
  perspectiveScore: number;
  compositionScore: number;
  shadingScore: number;
  feedback: string[];
  annotations: AnalysisAnnotation[];
  metrics: {
    drawingCoverage: number;
    valueContrast: number;
    symmetryRatio: number;
    edgeDensity: number;
  };
};

// 3. Reference Generator
export type ReferenceCategory =
  | "portraits"
  | "anime"
  | "animals"
  | "vehicles"
  | "objects"
  | "flowers"
  | "architecture"
  | "anatomy"
  | "handsfeet"
  | "landscapes"
  | "stilllife";

export type ReferenceGenerateOptions = {
  category: ReferenceCategory;
  prompt: string;
  style: "realistic" | "line_drawing" | "anime" | "classical" | "concept_art";
  pose?: string;
  lighting?: "front" | "side_left" | "side_right" | "top" | "dramatic_rim";
  width?: number;
  height?: number;
};

export type ReferenceGenerateResult = {
  uri: string;
  isLocalFallback: boolean;
  prompt: string;
  category: ReferenceCategory;
  svgData?: string;
};

// 5. Pose & Gesture
export type PoseLandmark = {
  index: number;
  name: string;
  x: number;
  y: number;
  confidence: number;
};

export type PoseResult = {
  landmarks: PoseLandmark[];
  lineOfAction: { start: { x: number; y: number }; control: { x: number; y: number }; end: { x: number; y: number } };
  spineAngle: number;
  shoulderTilt: number;
  hipTilt: number;
  balanceCenter: { x: number; y: number };
  proportionRatios: { headToTorso: number; torsoToLegs: number };
};

// 6. Hand & Foot
export type HandFootType = "hand" | "foot";

export type HandLandmark = {
  index: number;
  name: string;
  x: number;
  y: number;
  joint: "wrist" | "mcp" | "pip" | "dip" | "tip";
};

export type HandFootResult = {
  type: HandFootType;
  landmarks: HandLandmark[];
  palmBoundingBox: { x: number; y: number; width: number; height: number };
  fingerLengthRatios: { indexToMiddle: number; ringToMiddle: number; pinkyToRing: number };
  commonMistakes: string[];
  tips: string[];
};

// 7. Lighting Predictor
export type LightingResult = {
  primaryLightAngle: number; // 0 - 360 degrees
  lightIntensity: number;    // 0 - 100
  secondaryLightAngle?: number;
  highlightZones: Array<{ x: number; y: number; radius: number }>;
  coreShadowZones: Array<{ x: number; y: number; radius: number }>;
  castShadowDirection: { x: number; y: number };
  recommendedGraphiteGrades: {
    highlights: string; // e.g. "2H / H"
    midtones: string;   // e.g. "HB / B"
    shadows: string;    // e.g. "2B / 4B"
    deepDark: string;   // e.g. "6B / 8B"
  };
};

// 8. Composition Coach
export type CompositionResult = {
  ruleOfThirdsAlignment: number; // 0 - 100 score
  goldenSpiralAlignment: number;  // 0 - 100 score
  visualWeightCenter: { x: number; y: number };
  negativeSpaceRatio: number;   // 0.0 - 1.0
  horizonPlacementRatio: number;// 0.0 - 1.0
  suggestedCropping?: { x: number; y: number; width: number; height: number };
  critique: string[];
};

// 9. Line Art Cleaner
export type LineArtCleanOptions = {
  threshold: number;      // 0 - 255
  smoothing: number;      // 1 - 10
  removeNoise: boolean;
  enhanceEdges: boolean;
};

// 10. Smart Segmentation
export type SegmentationResult = {
  maskUri: string;
  foregroundUri: string;
  subjectBoundingBox: { x: number; y: number; width: number; height: number };
  edgeFeather: number;
};

// 11. Color Recommender
export type ColorPaletteRecommendation = {
  dominantColors: string[];
  palettes: {
    complementary: string[];
    analogous: string[];
    triadic: string[];
    warmVsCool: { warm: string[]; cool: string[] };
    skinTones: string[];
  };
  brushSuggestions: Array<{ role: string; hex: string; usage: string }>;
};

// 12. Multi-Angle Reference
export type MultiAngleResult = {
  angles: Array<{
    name: "Front" | "Three-Quarter" | "Profile" | "Back";
    angleDegrees: number;
    svgTemplate: string;
  }>;
  alignmentGuidelines: Array<{ label: string; yRatio: number }>;
};

// 14. Mistake Detector
export type MistakeItem = {
  id: string;
  title: string;
  category: "facial_symmetry" | "proportions" | "perspective" | "shading" | "line_quality";
  severity: "minor" | "moderate" | "critical";
  description: string;
  region: { x: number; y: number; width: number; height: number };
  correctionAction: string;
};

export type MistakeDetectionResult = {
  overallFidelityScore: number;
  mistakes: MistakeItem[];
  encouragement: string;
};

// 15. Art Mentor
export type ArtMentorMessage = {
  role: "user" | "mentor";
  text: string;
  suggestedAction?: {
    toolId: string;
    label: string;
  };
};

// 16. Vectorizer
export type VectorizeOptions = {
  pathTolerance: number;   // 0.5 - 5.0
  curveSmoothness: number; // 0 - 100
  strokeColor: string;
  strokeWidth: number;
};

export type VectorizeResult = {
  svgContent: string;
  pathCount: number;
  pointCount: number;
  downloadFilename: string;
};
