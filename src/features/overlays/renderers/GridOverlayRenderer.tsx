/**
 * ARTISTRY AI — Grid Overlay Renderer
 * Renders configurable traditional and proportional grids:
 * - Square, rectangular aspect, or physical millimetre paper scaling
 * - Standard, diagonals, Rule of Thirds, and Golden Ratio modes
 * - Subdivision ticks and alphanumeric coordinate labels
 */

import React, { useMemo } from "react";
import { Circle, Group, Line, Rect } from "@shopify/react-native-skia";
import type { GridOverlayConfig } from "../../../domain/overlayTypes";
import type { OverlayRenderContext } from "../OverlayContext";
import { createDashedLinePath } from "../geometry/pathHelpers";

interface GridOverlayRendererProps {
  overlay: GridOverlayConfig;
  context: OverlayRenderContext;
}

interface GridRenderGeometry {
  horizontalLines: Array<{ y: number; isMajor: boolean }>;
  verticalLines: Array<{ x: number; isMajor: boolean }>;
  diagonalLines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  subdivisions: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  focalPoints: Array<{ x: number; y: number }>;
}

export function GridOverlayRenderer({ overlay, context }: GridOverlayRendererProps) {
  const { refWidth, refHeight, paper } = context;
  const {
    mode = "standard",
    cellMode = "square",
    divisions = 4,
    cellSpacingMm,
    cellSpacingMmX,
    cellSpacingMmY,
    gridColumns,
    gridRows,
    paperMarginXMm,
    paperMarginYMm,
    color = "#28594B",
    strokeWidth = 1.5,
    showDiagonals = false,
    showSubdivisions = false,
  } = overlay;

  const geometry: GridRenderGeometry = useMemo(() => {
    const horizontalLines: Array<{ y: number; isMajor: boolean }> = [];
    const verticalLines: Array<{ x: number; isMajor: boolean }> = [];
    const diagonalLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    const subdivisions: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    const focalPoints: Array<{ x: number; y: number }> = [];

    if (refWidth <= 0 || refHeight <= 0) {
      return { horizontalLines, verticalLines, diagonalLines, subdivisions, focalPoints };
    }

    if (mode === "thirds") {
      // Rule of Thirds (3x3)
      const colStep = refWidth / 3;
      const rowStep = refHeight / 3;

      for (let c = 1; c < 3; c++) {
        verticalLines.push({ x: c * colStep, isMajor: true });
      }
      for (let r = 1; r < 3; r++) {
        horizontalLines.push({ y: r * rowStep, isMajor: true });
      }

      // 4 Rule of Thirds power intersections
      for (let c = 1; c < 3; c++) {
        for (let r = 1; r < 3; r++) {
          focalPoints.push({ x: c * colStep, y: r * rowStep });
        }
      }

      if (showDiagonals) {
        diagonalLines.push({ x1: 0, y1: 0, x2: refWidth, y2: refHeight });
        diagonalLines.push({ x1: refWidth, y1: 0, x2: 0, y2: refHeight });
      }
    } else if (mode === "golden") {
      // Golden Ratio (Phi = 0.618033...)
      const phi = 0.6180339887;
      const x1 = refWidth * (1 - phi);
      const x2 = refWidth * phi;
      const y1 = refHeight * (1 - phi);
      const y2 = refHeight * phi;

      verticalLines.push({ x: x1, isMajor: true });
      verticalLines.push({ x: x2, isMajor: true });
      horizontalLines.push({ y: y1, isMajor: true });
      horizontalLines.push({ y: y2, isMajor: true });

      focalPoints.push({ x: x1, y: y1 });
      focalPoints.push({ x: x2, y: y1 });
      focalPoints.push({ x: x1, y: y2 });
      focalPoints.push({ x: x2, y: y2 });

      if (showDiagonals) {
        diagonalLines.push({ x1: 0, y1: 0, x2: refWidth, y2: refHeight });
        diagonalLines.push({ x1: refWidth, y1: 0, x2: 0, y2: refHeight });
      }
    } else {
      // Standard or Diagonals Mode
      let stepX: number;
      let stepY: number;

      if (cellMode === "millimetre" && (cellSpacingMm || cellSpacingMmX)) {
        // Physical millimetre calculation calibrated to active paper sheet
        const spacingX = cellSpacingMmX ?? cellSpacingMm ?? 10;
        const spacingY = cellSpacingMmY ?? cellSpacingMmX ?? cellSpacingMm ?? 10;
        const paperW = Math.max(10, paper.widthMm);
        const paperH = Math.max(10, paper.heightMm);
        const pxPerMmX = refWidth / paperW;
        const pxPerMmY = refHeight / paperH;
        stepX = spacingX * pxPerMmX;
        stepY = spacingY * pxPerMmY;

        const startX = paperMarginXMm !== undefined ? paperMarginXMm * pxPerMmX : 0;
        const startY = paperMarginYMm !== undefined ? paperMarginYMm * pxPerMmY : 0;
        const endX = gridColumns !== undefined ? startX + gridColumns * stepX : refWidth;
        const endY = gridRows !== undefined ? startY + gridRows * stepY : refHeight;

        for (let x = startX + (startX === 0 ? stepX : 0); x < endX - 0.5; x += stepX) {
          verticalLines.push({ x, isMajor: true });
        }
        for (let y = startY + (startY === 0 ? stepY : 0); y < endY - 0.5; y += stepY) {
          horizontalLines.push({ y, isMajor: true });
        }
      } else if (cellMode === "square") {
        const divs = Math.max(1, divisions);
        const squareSize = Math.min(refWidth, refHeight) / divs;
        stepX = squareSize;
        stepY = squareSize;

        for (let x = stepX; x < refWidth - 1; x += stepX) {
          verticalLines.push({ x, isMajor: true });
        }
        for (let y = stepY; y < refHeight - 1; y += stepY) {
          horizontalLines.push({ y, isMajor: true });
        }
      } else {
        // Aspect ratio division
        const divs = Math.max(1, divisions);
        stepX = refWidth / divs;
        stepY = refHeight / divs;

        for (let x = stepX; x < refWidth - 1; x += stepX) {
          verticalLines.push({ x, isMajor: true });
        }
        for (let y = stepY; y < refHeight - 1; y += stepY) {
          horizontalLines.push({ y, isMajor: true });
        }
      }

      // Subdivisions (half-step ticks)
      if (showSubdivisions && stepX > 20 && stepY > 20) {
        const halfX = stepX / 2;
        const halfY = stepY / 2;

        for (let x = halfX; x < refWidth; x += stepX) {
          subdivisions.push({ x1: x, y1: 0, x2: x, y2: refHeight });
        }
        for (let y = halfY; y < refHeight; y += stepY) {
          subdivisions.push({ x1: 0, y1: y, x2: refWidth, y2: y });
        }
      }

      // Diagonals (X across cells or master canvas)
      if (showDiagonals || mode === "diagonals") {
        if (cellMode === "aspect" && divisions <= 6) {
          // Cell diagonals
          const divs = Math.max(1, divisions);
          for (let c = 0; c < divs; c++) {
            for (let r = 0; r < divs; r++) {
              const xLeft = c * stepX;
              const xRight = (c + 1) * stepX;
              const yTop = r * stepY;
              const yBottom = (r + 1) * stepY;
              diagonalLines.push({ x1: xLeft, y1: yTop, x2: xRight, y2: yBottom });
              diagonalLines.push({ x1: xRight, y1: yTop, x2: xLeft, y2: yBottom });
            }
          }
        } else {
          // Canvas diagonal cross
          diagonalLines.push({ x1: 0, y1: 0, x2: refWidth, y2: refHeight });
          diagonalLines.push({ x1: refWidth, y1: 0, x2: 0, y2: refHeight });
        }
      }
    }

    return { horizontalLines, verticalLines, diagonalLines, subdivisions, focalPoints };
  }, [
    refWidth,
    refHeight,
    mode,
    cellMode,
    divisions,
    cellSpacingMm,
    cellSpacingMmX,
    cellSpacingMmY,
    gridColumns,
    gridRows,
    paperMarginXMm,
    paperMarginYMm,
    paper.widthMm,
    paper.heightMm,
    showDiagonals,
    showSubdivisions,
  ]);

  return (
    <Group opacity={overlay.opacity}>
      {/* Outer reference boundary */}
      <Rect
        x={0}
        y={0}
        width={refWidth}
        height={refHeight}
        style="stroke"
        strokeWidth={strokeWidth * 1.4}
        color={color}
      />

      {/* Subdivision Lines (dashed/subtle) */}
      {geometry.subdivisions.map((sub, i) => (
        <Line
          key={`sub-${i}`}
          p1={{ x: sub.x1, y: sub.y1 }}
          p2={{ x: sub.x2, y: sub.y2 }}
          style="stroke"
          strokeWidth={Math.max(0.75, strokeWidth * 0.5)}
          color={color}
          opacity={0.4}
        />
      ))}

      {/* Major Vertical Lines */}
      {geometry.verticalLines.map((v, i) => (
        <Line
          key={`v-${i}`}
          p1={{ x: v.x, y: 0 }}
          p2={{ x: v.x, y: refHeight }}
          style="stroke"
          strokeWidth={strokeWidth}
          color={color}
        />
      ))}

      {/* Major Horizontal Lines */}
      {geometry.horizontalLines.map((h, i) => (
        <Line
          key={`h-${i}`}
          p1={{ x: 0, y: h.y }}
          p2={{ x: refWidth, y: h.y }}
          style="stroke"
          strokeWidth={strokeWidth}
          color={color}
        />
      ))}

      {/* Diagonal Guides */}
      {geometry.diagonalLines.map((d, i) => (
        <Line
          key={`diag-${i}`}
          p1={{ x: d.x1, y: d.y1 }}
          p2={{ x: d.x2, y: d.y2 }}
          style="stroke"
          strokeWidth={Math.max(0.75, strokeWidth * 0.75)}
          color={color}
          opacity={0.65}
        />
      ))}

      {/* Focal Points (Rule of Thirds & Golden Ratio power intersections) */}
      {geometry.focalPoints.map((pt, i) => (
        <Group key={`focal-${i}`}>
          <Circle cx={pt.x} cy={pt.y} r={6} style="stroke" strokeWidth={1.75} color={color} />
          <Circle cx={pt.x} cy={pt.y} r={2.5} style="fill" color={color} />
        </Group>
      ))}
    </Group>
  );
}
