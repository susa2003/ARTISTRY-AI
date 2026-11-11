/**
 * ARTISTRY AI — Paper & Print Studio Types
 * Domain structures for smart paper-based grid calculations, physical dimensions,
 * metric/imperial unit conversions, and print calibration models.
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

  // Edge space & margins
  remainderXMm: number;
  remainderYMm: number;
  marginXMm: number; // Left/Right centered margin
  marginYMm: number; // Top/Bottom centered margin

  // 300 DPI Print Calibration
  targetDpi: number;
  pixelWidth300Dpi: number;
  pixelHeight300Dpi: number;
  cellWidthPx300Dpi: number;
  cellHeightPx300Dpi: number;
}
