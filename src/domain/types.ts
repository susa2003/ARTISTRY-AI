export * from "./overlayTypes";

export type ToolId =
  | "loomis"
  | "steps"
  | "sketch"
  | "tracing"
  | "grid"
  | "analyzer"
  | "shading"
  | "color"
  | "anatomy"
  | "perspective"
  | "compare"
  | "library"
  | "learning"
  | "generator"
  | "progress"
  | "pose"
  | "handfoot"
  | "lighting"
  | "composition"
  | "linecleaner"
  | "segmentation"
  | "colorrec"
  | "turnaround"
  | "replay"
  | "mistakes"
  | "mentor"
  | "vectorizer";

export type ExperienceMode = "beginner" | "professional";
export type AppLanguage = "en" | "ta";

export type BrushKind = "brush" | "pencil" | "pen" | "eraser";

export type StrokePoint = { x: number; y: number; pressure?: number };

export type Stroke = {
  id: string;
  kind: BrushKind;
  color: string;
  width: number;
  points: StrokePoint[];
  timestamp?: number;
  startTime?: number;
};

export type DrawingLayer = {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode?: "srcOver" | "multiply" | "screen" | "overlay";
  strokes: Stroke[];
};

export type ProjectDocument = {
  id: string;
  name: string;
  width: number;
  height: number;
  layers: DrawingLayer[];
  activeLayerId: string;
  referenceUri?: string | null;
  referenceOpacity?: number;
  paperSettings?: import("./overlayTypes").PaperSettings;
  imageAdjustments?: import("./overlayTypes").ImageAdjustmentSettings;
  overlays?: import("./overlayTypes").UnifiedOverlay[];
  experienceMode?: ExperienceMode;
  createdAt: number;
  updatedAt: number;
};

export type ProjectSummary = Pick<
  ProjectDocument,
  "id" | "name" | "width" | "height" | "createdAt" | "updatedAt" | "referenceUri"
>;

export type LocalReference = {
  id: string;
  name: string;
  uri: string;
  originalUri: string;
  width: number;
  height: number;
  isEdited: boolean;
  updatedAt: number;
};

export type UndoSnapshot = { layers: DrawingLayer[]; activeLayerId: string };

export type AnalysisAnnotation = {
  id: string;
  x: number;
  y: number;
  label: string;
  severity: "low" | "medium" | "high";
  tip: string;
};

export type DrawingAnalysisRecord = {
  id: string;
  projectId?: string | null;
  timestamp: number;
  overallScore: number;
  proportionsScore: number;
  alignmentScore: number;
  perspectiveScore: number;
  compositionScore: number;
  shadingScore: number;
  feedback: string[];
  annotations: AnalysisAnnotation[];
};

export type GeneratedReferenceRecord = {
  id: string;
  prompt: string;
  category: string;
  style: string;
  pose: string;
  lighting: string;
  uri: string;
  createdAt: number;
};

export type SavedPaletteRecord = {
  id: string;
  name: string;
  colors: string[];
  createdAt: number;
};

export type StrokeEvent = {
  strokeId: string;
  pointIndex: number;
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
  kind: BrushKind;
  color: string;
  width: number;
};

export type StrokeReplayRecord = {
  id: string;
  projectId: string;
  events: StrokeEvent[];
  durationMs: number;
  createdAt: number;
};
