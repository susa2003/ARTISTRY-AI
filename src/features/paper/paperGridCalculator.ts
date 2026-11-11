/**
 * ARTISTRY AI — Smart Paper-Based Grid Spacing Calculator Engine
 * Authoritative mathematical engine for Paper & Print Studio:
 * - ISO & ANSI paper definitions with portrait/landscape orientation
 * - Preset & custom decimal grid spacing with unit conversions (mm, cm, in)
 * - Row and column calculation: columns = floor(paperWidth / spacingX), rows = floor(paperHeight / spacingY)
 * - Active grid dimensions, remaining edge space, and symmetric margin calculation
 * - Smart grid recommendations customized to paper size
 * - 300 DPI print calibration and millimeter-accurate SVG/HTML export generation
 */

import type { PaperOrientation, PaperSize } from "../../domain/overlayTypes";
import type {
  ExportDpi,
  GridAlignmentMode,
  GridRecommendation,
  GridSpacingPreset,
  PaperDimensions,
  PaperGridCalculation,
  SpacingUnit,
} from "./types";

export const MM_PER_INCH = 25.4;
export const STANDARD_DPI: ExportDpi = 300;
export const PT_PER_MM = 72 / 25.4; // 1 mm = 2.83464567 PostScript points

export const STANDARD_PAPER_DEFINITIONS: Record<Exclude<PaperSize, "CUSTOM">, PaperDimensions> = {
  A3: { widthMm: 297, heightMm: 420 },
  A4: { widthMm: 210, heightMm: 297 },
  A5: { widthMm: 148, heightMm: 210 },
  A6: { widthMm: 105, heightMm: 148 },
  US_LETTER: { widthMm: 215.9, heightMm: 279.4 },
};

export const GRID_SPACING_PRESETS: GridSpacingPreset[] = [
  { id: "p-5mm", label: "5 mm", valueMm: 5, unit: "mm", displayValue: "5 mm" },
  { id: "p-10mm", label: "10 mm (1 cm)", valueMm: 10, unit: "cm", displayValue: "1 cm" },
  { id: "p-15mm", label: "15 mm", valueMm: 15, unit: "mm", displayValue: "15 mm" },
  { id: "p-20mm", label: "20 mm (2 cm)", valueMm: 20, unit: "cm", displayValue: "2 cm" },
  { id: "p-25mm", label: "25 mm", valueMm: 25, unit: "mm", displayValue: "25 mm" },
  { id: "p-30mm", label: "30 mm (3 cm)", valueMm: 30, unit: "cm", displayValue: "3 cm" },
  { id: "p-40mm", label: "40 mm", valueMm: 40, unit: "mm", displayValue: "40 mm" },
  { id: "p-50mm", label: "50 mm (5 cm)", valueMm: 50, unit: "cm", displayValue: "5 cm" },
];

/**
 * Converts a value from any supported unit to real-world millimetres.
 */
export function unitToMm(value: number, unit: SpacingUnit): number {
  if (value <= 0 || isNaN(value)) return 10;
  switch (unit) {
    case "cm":
      return Math.round(value * 10 * 100) / 100;
    case "in":
      return Math.round(value * MM_PER_INCH * 100) / 100;
    case "mm":
    default:
      return Math.round(value * 100) / 100;
  }
}

/**
 * Converts a millimetre value to the target display unit.
 */
export function mmToUnit(mm: number, unit: SpacingUnit): number {
  if (mm <= 0 || isNaN(mm)) return 0;
  switch (unit) {
    case "cm":
      return Math.round((mm / 10) * 100) / 100;
    case "in":
      return Math.round((mm / MM_PER_INCH) * 1000) / 1000;
    case "mm":
    default:
      return Math.round(mm * 100) / 100;
  }
}

/**
 * Calculates physical paper dimensions taking orientation and custom sizes into account.
 */
export function calculatePaperDimensions(
  size: PaperSize,
  orientation: PaperOrientation,
  customWidthMm?: number,
  customHeightMm?: number
): PaperDimensions {
  let baseW: number;
  let baseH: number;

  if (size === "CUSTOM") {
    baseW = Math.max(20, Math.min(2000, customWidthMm ?? 210));
    baseH = Math.max(20, Math.min(2000, customHeightMm ?? 297));
  } else {
    const def = STANDARD_PAPER_DEFINITIONS[size];
    baseW = def.widthMm;
    baseH = def.heightMm;
  }

  const minDim = Math.min(baseW, baseH);
  const maxDim = Math.max(baseW, baseH);

  if (orientation === "landscape") {
    return {
      widthMm: Math.round(maxDim * 100) / 100,
      heightMm: Math.round(minDim * 100) / 100,
    };
  }

  return {
    widthMm: Math.round(minDim * 100) / 100,
    heightMm: Math.round(maxDim * 100) / 100,
  };
}

export interface CalculatePaperGridParams {
  paperSize: PaperSize;
  orientation: PaperOrientation;
  spacingXMm: number;
  spacingYMm?: number;
  customWidthMm?: number;
  customHeightMm?: number;
  selectedUnit?: SpacingUnit;
  targetDpi?: ExportDpi;

  // Independent Margins & Placement (Phase 6 Tasks 1-2)
  marginTopMm?: number;
  marginBottomMm?: number;
  marginLeftMm?: number;
  marginRightMm?: number;
  marginMm?: number;
  alignmentMode?: GridAlignmentMode;
  fitInsideMargins?: boolean;
}

/**
 * Master calculation function for the Smart Paper Grid Calculator.
 */
export function calculatePaperGrid(params: CalculatePaperGridParams): PaperGridCalculation {
  const {
    paperSize,
    orientation,
    spacingXMm,
    spacingYMm,
    customWidthMm,
    customHeightMm,
    selectedUnit = "mm",
    targetDpi = STANDARD_DPI,
    marginTopMm,
    marginBottomMm,
    marginLeftMm,
    marginRightMm,
    marginMm,
    alignmentMode = "centered",
    fitInsideMargins = false,
  } = params;

  // 1. Resolve Paper Dimensions
  const dims = calculatePaperDimensions(paperSize, orientation, customWidthMm, customHeightMm);
  const paperWidthMm = dims.widthMm;
  const paperHeightMm = dims.heightMm;

  // 2. Resolve Safe Spacing
  const safeSpacingX = Math.max(1, Math.min(paperWidthMm, spacingXMm || 10));
  const safeSpacingY = Math.max(1, Math.min(paperHeightMm, spacingYMm ?? safeSpacingX));
  const isSquare = Math.abs(safeSpacingX - safeSpacingY) < 0.001;

  // 3. Resolve Independent Margins & Printable Area
  const safeTop = Math.max(0, marginTopMm ?? marginMm ?? 0);
  const safeBottom = Math.max(0, marginBottomMm ?? marginMm ?? 0);
  const safeLeft = Math.max(0, marginLeftMm ?? marginMm ?? 0);
  const safeRight = Math.max(0, marginRightMm ?? marginMm ?? 0);

  const printableWidthMm = Math.max(10, Math.round((paperWidthMm - safeLeft - safeRight) * 100) / 100);
  const printableHeightMm = Math.max(10, Math.round((paperHeightMm - safeTop - safeBottom) * 100) / 100);

  // 4. Calculate Columns and Rows (Floor calculation per specification)
  const calcBaseW = fitInsideMargins ? printableWidthMm : paperWidthMm;
  const calcBaseH = fitInsideMargins ? printableHeightMm : paperHeightMm;

  const columns = Math.max(1, Math.floor(calcBaseW / safeSpacingX));
  const rows = Math.max(1, Math.floor(calcBaseH / safeSpacingY));
  const totalCells = columns * rows;

  // 5. Calculate Total Grid Dimensions & Remainders
  const totalGridWidthMm = Math.round(columns * safeSpacingX * 100) / 100;
  const totalGridHeightMm = Math.round(rows * safeSpacingY * 100) / 100;

  const remainderXMm = Math.round(Math.max(0, calcBaseW - totalGridWidthMm) * 100) / 100;
  const remainderYMm = Math.round(Math.max(0, calcBaseH - totalGridHeightMm) * 100) / 100;

  // 6. Placement & Active Grid Offsets
  let gridOffsetX: number;
  let gridOffsetY: number;

  if (fitInsideMargins) {
    if (alignmentMode === "top-left") {
      gridOffsetX = safeLeft;
      gridOffsetY = safeTop;
    } else {
      // centered inside printable area
      gridOffsetX = Math.round((safeLeft + remainderXMm / 2) * 100) / 100;
      gridOffsetY = Math.round((safeTop + remainderYMm / 2) * 100) / 100;
    }
  } else {
    if (alignmentMode === "top-left") {
      gridOffsetX = safeLeft;
      gridOffsetY = safeTop;
    } else {
      // centered across paper sheet
      gridOffsetX = Math.round((remainderXMm / 2) * 100) / 100;
      gridOffsetY = Math.round((remainderYMm / 2) * 100) / 100;
    }
  }

  const marginXMm = gridOffsetX;
  const marginYMm = gridOffsetY;

  // 7. Physical PDF & Print Points (72 PostScript points / inch)
  const pageWidthPt = Math.round(paperWidthMm * PT_PER_MM * 100) / 100;
  const pageHeightPt = Math.round(paperHeightMm * PT_PER_MM * 100) / 100;
  const printableWidthPt = Math.round(printableWidthMm * PT_PER_MM * 100) / 100;
  const printableHeightPt = Math.round(printableHeightMm * PT_PER_MM * 100) / 100;
  const cellWidthPt = Math.round(safeSpacingX * PT_PER_MM * 100) / 100;
  const cellHeightPt = Math.round(safeSpacingY * PT_PER_MM * 100) / 100;

  // 8. Target DPI Print Calibration
  const pxPerMm = targetDpi / MM_PER_INCH;
  const pixelWidth = Math.round(paperWidthMm * pxPerMm);
  const pixelHeight = Math.round(paperHeightMm * pxPerMm);
  const cellWidthPx = Math.round(safeSpacingX * pxPerMm);
  const cellHeightPx = Math.round(safeSpacingY * pxPerMm);

  // Legacy 300 DPI compatibility fields
  const pxPerMm300 = STANDARD_DPI / MM_PER_INCH;
  const pixelWidth300Dpi = Math.round(paperWidthMm * pxPerMm300);
  const pixelHeight300Dpi = Math.round(paperHeightMm * pxPerMm300);
  const cellWidthPx300Dpi = Math.round(safeSpacingX * pxPerMm300);
  const cellHeightPx300Dpi = Math.round(safeSpacingY * pxPerMm300);

  return {
    paperSize,
    orientation,
    paperWidthMm,
    paperHeightMm,
    spacingXMm: safeSpacingX,
    spacingYMm: safeSpacingY,
    isSquare,
    selectedUnit,

    marginTopMm: safeTop,
    marginBottomMm: safeBottom,
    marginLeftMm: safeLeft,
    marginRightMm: safeRight,
    printableWidthMm,
    printableHeightMm,
    alignmentMode,

    columns,
    rows,
    totalCells,
    cellWidthMm: safeSpacingX,
    cellHeightMm: safeSpacingY,
    totalGridWidthMm,
    totalGridHeightMm,

    remainderXMm,
    remainderYMm,
    gridOffsetX,
    gridOffsetY,
    marginXMm,
    marginYMm,

    pageWidthPt,
    pageHeightPt,
    printableWidthPt,
    printableHeightPt,
    cellWidthPt,
    cellHeightPt,

    targetDpi,
    pixelWidth,
    pixelHeight,
    cellWidthPx,
    cellHeightPx,

    pixelWidth300Dpi,
    pixelHeight300Dpi,
    cellWidthPx300Dpi,
    cellHeightPx300Dpi,
  };
}

/**
 * Returns tailored smart grid recommendations for a given paper size.
 */
export function getSmartRecommendations(
  paperWidthMm: number,
  paperHeightMm: number
): GridRecommendation[] {
  const candidatePresets = [
    { mm: 10, label: "1 cm", tier: "fine" as const, desc: "High-detail precision for fine graphite portraits" },
    { mm: 20, label: "2 cm", tier: "balanced" as const, desc: "Standard classical transfer grid" },
    { mm: 30, label: "3 cm", tier: "coarse" as const, desc: "Fast anatomical & still-life block-in" },
    { mm: 50, label: "5 cm", tier: "coarse" as const, desc: "Broad poster & landscape composition grid" },
  ];

  return candidatePresets
    .filter((p) => p.mm <= paperWidthMm / 2 && p.mm <= paperHeightMm / 2)
    .map((p) => {
      const cols = Math.floor(paperWidthMm / p.mm);
      const rows = Math.floor(paperHeightMm / p.mm);
      const totalW = cols * p.mm;
      const totalH = rows * p.mm;
      const remX = Math.round((paperWidthMm - totalW) * 10) / 10;
      const remY = Math.round((paperHeightMm - totalH) * 10) / 10;

      return {
        id: `rec-${p.mm}mm`,
        presetMm: p.mm,
        label: p.label,
        columns: cols,
        rows,
        remainderXMm: remX,
        remainderYMm: remY,
        tier: p.tier,
        description: p.desc,
      };
    });
}

const COLUMN_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Converts a zero-based column index to spreadsheet-style lettering (A, B, C... Z, AA, AB...).
 */
export function getColumnLetter(colIndex: number): string {
  if (colIndex < 26) {
    return COLUMN_LETTERS[colIndex] ?? "A";
  }
  const first = Math.floor(colIndex / 26) - 1;
  const second = colIndex % 26;
  return `${COLUMN_LETTERS[first] ?? "A"}${COLUMN_LETTERS[second] ?? "A"}`;
}

/**
 * Generates an SVG string representation calibrated to exact physical millimetres.
 * Suitable for vector rendering, PDF embedding, and 300 DPI high-resolution printing.
 */
export function generatePrintableSvg(
  calc: PaperGridCalculation,
  title = "ARTISTRY AI — Physical Grid Template"
): string {
  const {
    paperWidthMm,
    paperHeightMm,
    columns,
    rows,
    spacingXMm,
    spacingYMm,
    marginXMm,
    marginYMm,
    totalGridWidthMm,
    totalGridHeightMm,
  } = calc;

  const lines: string[] = [];
  const labels: string[] = [];

  // 1. Vertical grid lines
  for (let c = 0; c <= columns; c++) {
    const x = Math.round((marginXMm + c * spacingXMm) * 100) / 100;
    const isEdge = c === 0 || c === columns;
    lines.push(
      `<line x1="${x}" y1="${marginYMm}" x2="${x}" y2="${marginYMm + totalGridHeightMm}" stroke="${isEdge ? "#1B2E24" : "#28594B"}" stroke-width="${isEdge ? "0.4" : "0.2"}" />`
    );
  }

  // 2. Horizontal grid lines
  for (let r = 0; r <= rows; r++) {
    const y = Math.round((marginYMm + r * spacingYMm) * 100) / 100;
    const isEdge = r === 0 || r === rows;
    lines.push(
      `<line x1="${marginXMm}" y1="${y}" x2="${marginXMm + totalGridWidthMm}" y2="${y}" stroke="${isEdge ? "#1B2E24" : "#28594B"}" stroke-width="${isEdge ? "0.4" : "0.2"}" />`
    );
  }

  // 3. Column labels (Letters A, B, C...)
  for (let c = 0; c < columns; c++) {
    const x = Math.round((marginXMm + c * spacingXMm + spacingXMm / 2) * 100) / 100;
    const y = Math.max(3, marginYMm - 2);
    labels.push(
      `<text x="${x}" y="${y}" font-family="monospace" font-size="2.4" font-weight="bold" fill="#3D4A41" text-anchor="middle">${getColumnLetter(c)}</text>`
    );
  }

  // 4. Row labels (Numbers 1, 2, 3...)
  for (let r = 0; r < rows; r++) {
    const x = Math.max(3, marginXMm - 2);
    const y = Math.round((marginYMm + r * spacingYMm + spacingYMm / 2 + 1) * 100) / 100;
    labels.push(
      `<text x="${x}" y="${y}" font-family="monospace" font-size="2.4" font-weight="bold" fill="#3D4A41" text-anchor="end">${r + 1}</text>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${paperWidthMm}mm"
     height="${paperHeightMm}mm"
     viewBox="0 0 ${paperWidthMm} ${paperHeightMm}">
  <!-- Background Paper Sheet -->
  <rect x="0" y="0" width="${paperWidthMm}" height="${paperHeightMm}" fill="#FFFFFF" />

  <!-- Margins Shading -->
  <rect x="0" y="0" width="${paperWidthMm}" height="${paperHeightMm}" fill="none" stroke="#D3CCC0" stroke-width="0.3" stroke-dasharray="1,1" />

  <!-- Active Grid Outer Boundary -->
  <rect x="${marginXMm}" y="${marginYMm}" width="${totalGridWidthMm}" height="${totalGridHeightMm}" fill="none" stroke="#1B2E24" stroke-width="0.5" />

  <!-- Grid Lines -->
  <g id="grid-lines">
    ${lines.join("\n    ")}
  </g>

  <!-- Labels -->
  <g id="grid-labels">
    ${labels.join("\n    ")}
  </g>

  <!-- Header Footer Metadata -->
  <text x="${paperWidthMm / 2}" y="${paperHeightMm - 2}" font-family="sans-serif" font-size="2.0" fill="#8B9A90" text-anchor="middle">
    ${title} · ${calc.paperSize} (${paperWidthMm}×${paperHeightMm} mm) · Grid: ${columns}×${rows} (${spacingXMm}mm) · 300 DPI Print Calibrated
  </text>
</svg>`;
}

/**
 * Generates standalone printable HTML document with CSS @page millimeter dimensions
 * enabling perfect 1:1 scale physical printing from any Android or desktop browser.
 */
export function generatePrintableHtml(
  calc: PaperGridCalculation,
  referenceImageUri?: string | null,
  title = "ARTISTRY AI — Traditional Drawing Grid Template"
): string {
  const svg = generatePrintableSvg(calc, title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page {
      size: ${calc.paperWidthMm}mm ${calc.paperHeightMm}mm;
      margin: 0;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
    }
    body {
      margin: 0;
      padding: 0;
      background: #EAE6DD;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .sheet-wrapper {
      width: ${calc.paperWidthMm}mm;
      height: ${calc.paperHeightMm}mm;
      background: #FFFFFF;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      position: relative;
      overflow: hidden;
      margin: 20px auto;
    }
    .grid-svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  </style>
</head>
<body>
  <div class="sheet-wrapper">
    ${svg}
  </div>
</body>
</html>`;
}
