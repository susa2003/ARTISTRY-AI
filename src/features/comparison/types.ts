/**
 * ARTISTRY AI — Sub-Phase 7D: Drawing Comparison & Feedback Types
 * Definitions for comparison modes, alignment transforms, feedback items,
 * visual discrepancy analysis, and SQLite persistence.
 */

export type DrawingComparisonMode =
  | "side_by_side"
  | "reference_overlay"
  | "drawing_overlay"
  | "opacity_overlay"
  | "split_view"
  | "difference_map";

export type FeedbackCategory =
  | "proportion"
  | "placement"
  | "angle"
  | "contour"
  | "spacing"
  | "tonal";

export type ConfidenceLevel = "high" | "medium" | "approximate";

export interface ImageAlignmentSettings {
  scale: number;        // Zoom / scale factor (0.2x to 5.0x, default 1.0)
  translateX: number;   // Horizontal offset in points/pixels (default 0)
  translateY: number;   // Vertical offset in points/pixels (default 0)
  rotationDeg: number;  // Rotation in degrees (-180 to 180, default 0)
  flipHorizontal: boolean;
  preserveAspectRatio: boolean;
  perspectiveTiltX?: number; // Optional horizontal keystone tilt (-30 to 30)
  perspectiveTiltY?: number; // Optional vertical keystone tilt (-30 to 30)
}

export const DEFAULT_ALIGNMENT_SETTINGS: ImageAlignmentSettings = {
  scale: 1.0,
  translateX: 0,
  translateY: 0,
  rotationDeg: 0,
  flipHorizontal: false,
  preserveAspectRatio: true,
  perspectiveTiltX: 0,
  perspectiveTiltY: 0,
};

export interface DrawingFeedbackItem {
  id: string;
  category: FeedbackCategory;
  detectedDifference: string;
  approximateLocation: string;
  explanation: string;
  suggestedCorrection: string;
  confidence: ConfidenceLevel;
  severity: "minor" | "moderate" | "significant";
  measuredVariancePercent?: number; // e.g. +8% or -12%
}

export interface DrawingComparisonFeedbackResult {
  id: string;
  timestamp: number;
  overallMatchScore: number; // 0 to 100
  items: DrawingFeedbackItem[];
  categoryScores: Record<FeedbackCategory, number>;
  summary: string;
  limitationsNotice: string;
  isLocalProcessing: boolean;
}

export interface SavedDrawingComparisonRecord {
  id: string;
  projectId?: string;
  referenceUri: string;
  drawingUri: string;
  alignment: ImageAlignmentSettings;
  comparisonMode: DrawingComparisonMode;
  feedback: DrawingComparisonFeedbackResult;
  userNotes?: string;
  createdAt: number;
}
