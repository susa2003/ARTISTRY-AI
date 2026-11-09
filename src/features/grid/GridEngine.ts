import type { Stroke, StrokePoint } from "../../domain/types";

export type GridMode = "standard" | "diagonals" | "thirds" | "golden";

export type GridConfig = {
  mode: GridMode;
  divisions: number;       // e.g. 3, 4, 5, 6, 8, 10 (used for standard & diagonals)
  color: string;           // Hex color
  opacity: number;         // 0.1 to 1.0
  strokeWidth: number;     // 1 to 5 px
  showLabels: boolean;     // Alphanumeric labels (A1, B2...)
  showDiagonals: boolean;  // Cell diagonal X guides
  selectedCell: { col: number; row: number } | null;
};

export const DEFAULT_GRID_CONFIG: GridConfig = {
  mode: "standard",
  divisions: 4,
  color: "#28594B",
  opacity: 0.75,
  strokeWidth: 1.5,
  showLabels: true,
  showDiagonals: false,
  selectedCell: null,
};

export type GridLine = {
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  isMajor?: boolean;
};

export type GridCell = {
  col: number;
  row: number;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GridRenderData = {
  lines: GridLine[];
  diagonalLines: GridLine[];
  cells: GridCell[];
  focalPoints: Array<{ x: number; y: number }>;
};

const COLUMN_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function calculateGrid(
  width: number,
  height: number,
  config: GridConfig
): GridRenderData {
  const lines: GridLine[] = [];
  const diagonalLines: GridLine[] = [];
  const cells: GridCell[] = [];
  const focalPoints: Array<{ x: number; y: number }> = [];

  if (config.mode === "thirds") {
    // 3x3 Rule of Thirds
    const colStep = width / 3;
    const rowStep = height / 3;

    for (let c = 1; c < 3; c++) {
      lines.push({
        p1: { x: c * colStep, y: 0 },
        p2: { x: c * colStep, y: height },
        isMajor: true,
      });
    }
    for (let r = 1; r < 3; r++) {
      lines.push({
        p1: { x: 0, y: r * rowStep },
        p2: { x: width, y: r * rowStep },
        isMajor: true,
      });
    }

    // 4 Rule of Thirds Focal Intersections
    for (let c = 1; c < 3; c++) {
      for (let r = 1; r < 3; r++) {
        focalPoints.push({ x: c * colStep, y: r * rowStep });
      }
    }

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        cells.push({
          col: c,
          row: r,
          label: `${COLUMN_LETTERS[c] ?? "A"}${r + 1}`,
          x: c * colStep,
          y: r * rowStep,
          width: colStep,
          height: rowStep,
        });
      }
    }
  } else if (config.mode === "golden") {
    // Golden Ratio (1 : 0.6180339887)
    const phi = 0.6180339887;
    const x1 = width * (1 - phi);
    const x2 = width * phi;
    const y1 = height * (1 - phi);
    const y2 = height * phi;

    lines.push({ p1: { x: x1, y: 0 }, p2: { x: x1, y: height }, isMajor: true });
    lines.push({ p1: { x: x2, y: 0 }, p2: { x: x2, y: height }, isMajor: true });
    lines.push({ p1: { x: 0, y: y1 }, p2: { x: width, y: y1 }, isMajor: true });
    lines.push({ p1: { x: 0, y: y2 }, p2: { x: width, y: y2 }, isMajor: true });

    focalPoints.push({ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x1, y: y2 }, { x: x2, y: y2 });
  } else {
    // Standard or Diagonals Mode
    const divisions = Math.max(2, Math.min(12, config.divisions));
    const colStep = width / divisions;
    const rowStep = height / divisions;

    // Vertical column lines
    for (let c = 1; c < divisions; c++) {
      lines.push({
        p1: { x: c * colStep, y: 0 },
        p2: { x: c * colStep, y: height },
        isMajor: c % 2 === 0,
      });
    }

    // Horizontal row lines
    for (let r = 1; r < divisions; r++) {
      lines.push({
        p1: { x: 0, y: r * rowStep },
        p2: { x: width, y: r * rowStep },
        isMajor: r % 2 === 0,
      });
    }

    // Populate cell coordinates
    for (let r = 0; r < divisions; r++) {
      for (let c = 0; c < divisions; c++) {
        const x = c * colStep;
        const y = r * rowStep;
        cells.push({
          col: c,
          row: r,
          label: `${COLUMN_LETTERS[c % COLUMN_LETTERS.length] ?? "A"}${r + 1}`,
          x,
          y,
          width: colStep,
          height: rowStep,
        });

        // Cell diagonals if requested
        if (config.mode === "diagonals" || config.showDiagonals) {
          diagonalLines.push({
            p1: { x, y },
            p2: { x: x + colStep, y: y + rowStep },
          });
          diagonalLines.push({
            p1: { x: x + colStep, y },
            p2: { x, y: y + rowStep },
          });
        }
      }
    }

    // Global diagonals across the whole canvas
    if (config.mode === "diagonals") {
      diagonalLines.push({ p1: { x: 0, y: 0 }, p2: { x: width, y: height }, isMajor: true });
      diagonalLines.push({ p1: { x: width, y: 0 }, p2: { x: 0, y: height }, isMajor: true });
    }
  }

  return { lines, diagonalLines, cells, focalPoints };
}

/**
 * Converts a grid into vector strokes so it can be added as a guide layer to any drawing project.
 */
export function convertGridToStrokes(
  width: number,
  height: number,
  config: GridConfig
): Stroke[] {
  const data = calculateGrid(width, height, config);
  const strokes: Stroke[] = [];
  const makeId = () => `grid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  // Grid border
  strokes.push({
    id: makeId(),
    kind: "pencil",
    color: config.color,
    width: config.strokeWidth * 1.5,
    points: [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
      { x: 0, y: 0 },
    ],
  });

  // Orthogonal lines
  data.lines.forEach((line) => {
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: config.color,
      width: line.isMajor ? config.strokeWidth * 1.2 : config.strokeWidth,
      points: [
        { x: line.p1.x, y: line.p1.y },
        { x: line.p2.x, y: line.p2.y },
      ],
    });
  });

  // Diagonal lines
  data.diagonalLines.forEach((diag) => {
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: config.color,
      width: config.strokeWidth * 0.8,
      points: [
        { x: diag.p1.x, y: diag.p1.y },
        { x: diag.p2.x, y: diag.p2.y },
      ],
    });
  });

  return strokes;
}
