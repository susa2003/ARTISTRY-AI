/**
 * ARTISTRY AI — Unified Overlay & Workstation Types
 * Defines non-destructive overlay configurations, paper dimensions, and image adjustments
 * shared across the Reference Studio and traditional drawing methods.
 */

export type OverlayType =
  | "grid"
  | "loomis"
  | "reilly"
  | "bargue"
  | "perspective"
  | "anatomy"
  | "shading"
  | "plumb"
  | "measurement"
  | "tracing";

export type PaperSize = "A4" | "A3" | "A5" | "US_LETTER" | "CUSTOM";
export type PaperOrientation = "portrait" | "landscape";

export interface PaperDimensionsMm {
  widthMm: number;
  heightMm: number;
}

export const STANDARD_PAPER_SIZES: Record<Exclude<PaperSize, "CUSTOM">, PaperDimensionsMm> = {
  A4: { widthMm: 210, heightMm: 297 },
  A3: { widthMm: 297, heightMm: 420 },
  A5: { widthMm: 148, heightMm: 210 },
  US_LETTER: { widthMm: 215.9, heightMm: 279.4 },
};

export interface PaperSettings {
  size: PaperSize;
  orientation: PaperOrientation;
  widthMm: number;
  heightMm: number;
  marginMm: number;     // Printable safe boundary margin (standard 5.0 mm)
  targetDpi: number;    // Target print resolution (standard 300 DPI)
}

export const DEFAULT_PAPER_SETTINGS: PaperSettings = {
  size: "A4",
  orientation: "portrait",
  widthMm: 210,
  heightMm: 297,
  marginMm: 5.0,
  targetDpi: 300,
};

export interface ImageCropSettings {
  originX: number;        // Normalized 0.0 to 1.0
  originY: number;        // Normalized 0.0 to 1.0
  width: number;          // Normalized 0.0 to 1.0 (width <= 1.0 - originX)
  height: number;         // Normalized 0.0 to 1.0 (height <= 1.0 - originY)
}

export interface ImageAdjustmentSettings {
  brightness: number;       // -1.0 to 1.0 (default 0.0)
  contrast: number;         // 0.5 to 2.0 (default 1.0)
  exposure: number;         // -2.0 to 2.0 (default 0.0, photographic EV stops)
  saturation: number;       // 0.0 to 2.0 (default 1.0, 0 = desaturated)
  grayscale: boolean | number; // 0.0 to 1.0 (0-100%) or boolean toggle
  whiteoutStrength: number; // 0.0 (natural) to 1.0 (pure paper white)
  opacity: number;          // 0.0 to 1.0 (reference layer opacity, default 1.0)
  rotation: 0 | 90 | 180 | 270;
  crop: ImageCropSettings;
}

export const DEFAULT_IMAGE_ADJUSTMENTS: ImageAdjustmentSettings = {
  brightness: 0.0,
  contrast: 1.0,
  exposure: 0.0,
  saturation: 1.0,
  grayscale: 0.0,
  whiteoutStrength: 0.0,
  opacity: 1.0,
  rotation: 0,
  crop: {
    originX: 0.0,
    originY: 0.0,
    width: 1.0,
    height: 1.0,
  },
};

/**
 * Returns a normalized 0.0 to 1.0 float representing grayscale intensity.
 * Accepts both legacy boolean values and modern 0-100% float values.
 */
export function getGrayscaleFactor(adjustments: ImageAdjustmentSettings): number {
  if (typeof adjustments.grayscale === "number") {
    return Math.max(0.0, Math.min(1.0, adjustments.grayscale));
  }
  return adjustments.grayscale ? 1.0 : 0.0;
}

export interface BaseOverlayConfig {
  id: string;
  type: OverlayType;
  name: string;
  visible: boolean;
  opacity: number;      // 0.0 to 1.0
  locked: boolean;
  zIndex: number;
}

// 1. Grid Overlay Configuration
export interface GridOverlayConfig extends BaseOverlayConfig {
  type: "grid";
  mode: "standard" | "diagonals" | "thirds" | "golden";
  cellMode: "aspect" | "square" | "millimetre";
  divisions: number;         // For standard/diagonals (e.g. 4, 6, 8)
  cellSpacingMm?: number;    // Real-world physical spacing (e.g. 10mm, 20mm)
  cellSpacingMmX?: number;   // Independent horizontal physical spacing in mm
  cellSpacingMmY?: number;   // Independent vertical physical spacing in mm
  gridColumns?: number;      // Calculated horizontal column count
  gridRows?: number;         // Calculated vertical row count
  paperMarginXMm?: number;   // Physical horizontal margin offset in mm
  paperMarginYMm?: number;   // Physical vertical margin offset in mm
  color: string;
  strokeWidth: number;
  showLabels: boolean;       // A1, B2...
  showDiagonals: boolean;
  showSubdivisions: boolean; // 1/2 cell guide ticks
  selectedCell?: { col: number; row: number } | null;
}

// 2. Loomis Head Construction Configuration
export interface LoomisOverlayConfig extends BaseOverlayConfig {
  type: "loomis";
  stage: number;             // 1 to 8 progressive construction stages
  centerX: number;           // Normalized 0..1 relative to reference
  centerY: number;
  radius: number;            // Normalized radius relative to reference width
  yaw: number;               // -60 to +60 degrees
  pitch: number;             // -45 to +45 degrees
  roll: number;              // -30 to +30 degrees
  jawLength: number;         // 0.8 to 1.4 multiplier
  color: string;
  strokeWidth: number;
  showConstructionPlanes: boolean;
}

// 3. Reilly Rhythm Abstraction Configuration
export interface ReillyOverlayConfig extends BaseOverlayConfig {
  type: "reilly";
  centerX: number;           // Normalized 0..1
  centerY: number;
  scale: number;             // 0.5 to 2.0
  rotation: number;          // Degrees
  showBrowCurve: boolean;
  showCheekArcs: boolean;
  showNasalKeystone: boolean;
  showChinLoop: boolean;
  showNeckRibbons: boolean;
  color: string;
  strokeWidth: number;
}

// 4. Bargue Block-In & Sight-Size Configuration
export interface BargueOverlayConfig extends BaseOverlayConfig {
  type: "bargue";
  blockInPoints: Array<{ x: number; y: number }>; // Normalized 0..1 vertices
  showEnvelope: boolean;
  showPlumbAnchors: boolean;
  sightSizeDivision: number; // e.g. 2, 3, 4 equal horizontal/vertical bands
  color: string;
  strokeWidth: number;
}

// 5. Perspective Assistant Configuration
export interface PerspectiveOverlayConfig extends BaseOverlayConfig {
  type: "perspective";
  mode: "1-point" | "2-point" | "3-point";
  horizonY: number;          // Normalized 0..1
  vp1X: number;              // Normalized VP1 position
  vp2X: number;              // Normalized VP2 position
  vp3Y: number;              // Normalized VP3 position (zenith/nadir)
  rayCount: number;
  showVerticals: boolean;
  color: string;
  strokeWidth: number;
}

// 6. Anatomy Academy Configuration
export interface AnatomyOverlayConfig extends BaseOverlayConfig {
  type: "anatomy";
  mode: "proportions" | "skeletal" | "muscular" | "facial";
  gender: "neutral" | "heroic" | "female";
  heightRatio: number;       // Figure height relative to reference
  centerX: number;
  centerY: number;
  showMuscles: boolean;
  color: string;
  strokeWidth: number;
}

// 7. Shading & Lighting Configuration
export interface ShadingOverlayConfig extends BaseOverlayConfig {
  type: "shading";
  lightAngle: number;        // 0 to 360 degrees
  lightElevation: number;    // 15 to 75 degrees
  valueSteps: 3 | 5;
  showTerminator: boolean;
  showLightRay: boolean;
  contrast: number;
  showGraphiteGuide: boolean; // Displays recommended pencil grades
}

// 8. Plumb Lines & Alignment Configuration
export interface PlumbOverlayConfig extends BaseOverlayConfig {
  type: "plumb";
  verticalLines: number[];   // Normalized X coordinates (0..1)
  horizontalLines: number[]; // Normalized Y coordinates (0..1)
  color: string;
  strokeWidth: number;
}

// 9. Comparative Measurement Configuration
export interface MeasurementCaliper {
  id: string;
  label: string;
  p1: { x: number; y: number }; // Normalized 0..1
  p2: { x: number; y: number };
  unitRatio?: number;
}

export interface MeasurementOverlayConfig extends BaseOverlayConfig {
  type: "measurement";
  calipers: MeasurementCaliper[];
  referenceUnitLength?: number; // Base measurement unit for comparative sight-size
  color: string;
}

// 10. Tracing & Lightbox Configuration
export interface TracingOverlayConfig extends BaseOverlayConfig {
  type: "tracing";
  mode: "natural" | "contrast" | "inverted" | "lightbox";
  threshold: number;         // 30 to 220 (default 128)
  edgeBoost: boolean;
  invert: boolean;
}

export type UnifiedOverlay =
  | GridOverlayConfig
  | LoomisOverlayConfig
  | ReillyOverlayConfig
  | BargueOverlayConfig
  | PerspectiveOverlayConfig
  | AnatomyOverlayConfig
  | ShadingOverlayConfig
  | PlumbOverlayConfig
  | MeasurementOverlayConfig
  | TracingOverlayConfig;
