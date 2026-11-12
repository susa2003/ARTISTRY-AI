/**
 * ARTISTRY AI — Sub-Phase 7C: AI Drawing Assistant Types
 * Definitions for reference image analysis, composition, construction,
 * lighting, method recommendations, drawing sequences, and coach Q&A.
 */

export type SubjectCategory =
  | "portrait"
  | "figure"
  | "still_life"
  | "landscape"
  | "architecture"
  | "animals"
  | "organic_form";

export type DrawingMethodType =
  | "grid"
  | "loomis"
  | "reilly"
  | "bargue"
  | "perspective"
  | "anatomy"
  | "measurement"
  | "shading";

export interface CompositionAnalysis {
  mainSubject: string;
  category: SubjectCategory;
  subjectPlacement: string;
  majorShapes: string[];
  overallComposition: string;
  aspectRatioEstimate: number;
}

export interface ConstructionAnalysis {
  basicGeometricConstruction: string[];
  proportionRelationships: string[];
  mainAxesAndAlignment: string[];
  approximateLandmarks: string[];
  perspectiveDirection?: string;
  calibrationNote: string;
}

export interface LightingAnalysis {
  lightSourceDirection: string;
  highlightRegions: string[];
  midtones: string[];
  coreShadows: string[];
  castShadows: string[];
  recommendedTonalSteps: number;
}

export interface DrawingSequenceStep {
  stepNumber: number;
  title: string;
  action: string;
  physicalPaperGuidance: string;
  recommendedPencilGrade: "2H" | "H" | "HB" | "2B" | "4B" | "6B";
  companionTool?: DrawingMethodType;
}

export interface RecommendedMethod {
  method: DrawingMethodType;
  title: string;
  rationale: string;
  overlayId?: "grid" | "loomis" | "perspective" | "contour" | "shading" | "proportions";
}

export interface ReferenceAnalysisResult {
  id: string;
  imageUri: string;
  timestamp: number;
  composition: CompositionAnalysis;
  construction: ConstructionAnalysis;
  lighting: LightingAnalysis;
  recommendedMethods: RecommendedMethod[];
  drawingSequence: DrawingSequenceStep[];
  isLocalFallback: boolean;
}

export interface SavedReferenceAnalysisRecord {
  id: string;
  projectId?: string;
  imageUri: string;
  createdAt: number;
  analysis: ReferenceAnalysisResult;
  userNotes?: string;
}

export interface CoachQuestionAnswer {
  question: string;
  answer: string;
  suggestedOverlay?: "grid" | "loomis" | "perspective" | "contour" | "shading" | "proportions";
}

export interface AnalysisConsentState {
  hasConsented: boolean;
  canUploadToCloud: boolean;
}
