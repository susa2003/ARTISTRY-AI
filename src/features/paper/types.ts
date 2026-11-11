/**
 * ARTISTRY AI — Paper & Print Studio Types
 * Domain structures for smart paper-based grid calculations, physical dimensions,
 * metric/imperial unit conversions, independent margins, and PDF print models.
 */

import type { PaperOrientation, PaperSize } from "../../domain/overlayTypes";

export type SpacingUnit = "mm" | "cm" | "in";

export interface PaperDimensions {
  widthMm: number;
  heightMm: number;
}

export interface GridSpacingPreset {
  id: string;
  label: string;
  valueMm: number;
  unit: SpacingUnit;
  displayValue: string;
}

export interface GridRecommendation {
  id: string;
  presetMm: number;
  label: string;
  columns: number;
  rows: number;
  remainderXMm: number;
  remainderYMm: number;
  tier: "fine" | "balanced" | "coarse";
  description: string;
}

export type GridAlignmentMode = "centered" | "top-left" | "custom";
export type ExportTemplateType = "blank" | "grid" | "reference-overlays";
export type ExportDpi = 150 | 200 | 300 | 600;

export interface PaperMarginsMm {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PaperGridCalculation {
  // Input dimensions
  paperSize: PaperSize;
  orientation: PaperOrientation;
  paperWidthMm: number;
  paperHeightMm: number;

  // Selected spacing
  spacingXMm: number;
  spacingYMm: number;
  isSquare: boolean;
  selectedUnit: SpacingUnit;

  // Margins & Printable Area
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  printableWidthMm: number;
  printableHeightMm: number;
  alignmentMode: GridAlignmentMode;

  // Calculated cell counts
  columns: number;
  rows: number;
  totalCells: number;

  // Actual cell dimensions
  cellWidthMm: number;
  cellHeightMm: number;

  // Total active grid bounds
  totalGridWidthMm: number;
  totalGridHeightMm: number;

  // Leftover edge space & active grid offsets
  remainderXMm: number;
  remainderYMm: number;
  gridOffsetX: number; // Effective X offset from left edge of paper
  gridOffsetY: number; // Effective Y offset from top edge of paper
  marginXMm: number;   // Symmetric/effective horizontal margin
  marginYMm: number;   // Symmetric/effective vertical margin

  // Physical PDF & Print Points (72 PostScript points / inch)
  pageWidthPt: number;
  pageHeightPt: number;
  printableWidthPt: number;
  printableHeightPt: number;
  cellWidthPt: number;
  cellHeightPt: number;

  // Target DPI Print Calibration
  targetDpi: ExportDpi;
  pixelWidth: number;
  pixelHeight: number;
  cellWidthPx: number;
  cellHeightPx: number;

  // Legacy compatibility fields
  pixelWidth300Dpi: number;
  pixelHeight300Dpi: number;
  cellWidthPx300Dpi: number;
  cellHeightPx300Dpi: number;
}

export interface ExportSettings {
  templateType: ExportTemplateType;
  dpi: ExportDpi;
  includeLabels: boolean;
  includeMargins: boolean;
  includeReferencePhoto: boolean;
  includeOverlays: boolean;
  includeRulers: boolean;
  color: string;
  strokeWidthPt: number;
}
