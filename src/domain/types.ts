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
  | "learning";

export type BrushKind = "brush" | "pencil" | "pen" | "eraser";

export type StrokePoint = { x: number; y: number; pressure?: number };

export type Stroke = {
  id: string;
  kind: BrushKind;
  color: string;
  width: number;
  points: StrokePoint[];
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
