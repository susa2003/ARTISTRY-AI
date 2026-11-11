/**
 * ARTISTRY AI — 5-Value Shading & Directional Lighting Overlay Renderer
 * Renders traditional tonal and lighting guides:
 * - 3D Directional Light Dial with azimuth and elevation
 * - Primary light vector arrow across the subject
 * - Core shadow terminator boundary curve
 * - 5-value tonal scale swatches with recommended graphite pencil grades (2H to 6B)
 */

import React, { useMemo } from "react";
import { Circle, Group, Line, Path, Rect } from "@shopify/react-native-skia";
import type { ShadingOverlayConfig } from "../../../domain/overlayTypes";
import type { OverlayRenderContext } from "../OverlayContext";
import {
  createArrowPath,
  createCurvedSplinePath,
  type Point2D,
} from "../geometry/pathHelpers";

interface ShadingOverlayRendererProps {
  overlay: ShadingOverlayConfig;
  context: OverlayRenderContext;
}

export const TONAL_VALUE_ZONES = [
  { level: 1, name: "Highlight", color: "#F9F8F3", pencil: "2H–H", dark: false },
  { level: 2, name: "Midtone", color: "#C6C4B8", pencil: "HB", dark: false },
  { level: 3, name: "Core Shadow", color: "#666255", pencil: "2B", dark: true },
  { level: 4, name: "Reflected", color: "#8C897B", pencil: "B", dark: true },
  { level: 5, name: "Cast Shadow", color: "#1F1D19", pencil: "4B–6B", dark: true },
];

export function ShadingOverlayRenderer({ overlay, context }: ShadingOverlayRendererProps) {
  const { refWidth, refHeight } = context;
  const {
    lightAngle = 45,
    lightElevation = 45,
    valueSteps = 5,
    showTerminator = true,
    showLightRay = true,
    showGraphiteGuide = true,
  } = overlay;

  const rad = useMemo(() => (lightAngle * Math.PI) / 180, [lightAngle]);
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  // Directional Light Arrow vector (pointing toward center from light direction)
  const lightArrow = useMemo(() => {
    const cx = refWidth * 0.5;
    const cy = refHeight * 0.5;
    const length = Math.min(refWidth, refHeight) * 0.35;

    // Arrow starts outside and points toward center
    const startX = cx - cosA * length;
    const startY = cy - sinA * length;
    const endX = cx - cosA * (length * 0.25);
    const endY = cy - sinA * (length * 0.25);

    return {
      path: createArrowPath(startX, startY, endX, endY, 16),
      sourceX: startX,
      sourceY: startY,
    };
  }, [refWidth, refHeight, cosA, sinA]);

  // Core Shadow Terminator curve (perpendicular to light vector passing across form center)
  const terminatorPath = useMemo(() => {
    const cx = refWidth * 0.5;
    const cy = refHeight * 0.5;
    const length = Math.min(refWidth, refHeight) * 0.45;

    // Perpendicular vector (-sinA, cosA)
    const perpX = -sinA;
    const perpY = cosA;

    // Curved S-shape terminator simulating cylindrical/spherical form boundary
    const points: Point2D[] = [
      { x: cx - perpX * length - cosA * 20, y: cy - perpY * length - sinA * 20 },
      { x: cx - perpX * (length * 0.5) + cosA * 15, y: cy - perpY * (length * 0.5) + sinA * 15 },
      { x: cx, y: cy },
      { x: cx + perpX * (length * 0.5) - cosA * 15, y: cy + perpY * (length * 0.5) - sinA * 15 },
      { x: cx + perpX * length + cosA * 20, y: cy + perpY * length + sinA * 20 },
    ];

    return createCurvedSplinePath(points);
  }, [refWidth, refHeight, cosA, sinA]);

  // 3D Directional Light Dial Compass (rendered top-right)
  const dial = useMemo(() => {
    const margin = 20;
    const radius = 26;
    const cx = refWidth - margin - radius;
    const cy = margin + radius;

    const pointerLen = radius * 0.85;
    const px = cx + cosA * pointerLen;
    const py = cy + sinA * pointerLen;

    return { cx, cy, radius, px, py };
  }, [refWidth, cosA, sinA]);

  // Tonal Swatch strip (rendered along bottom edge)
  const swatches = useMemo(() => {
    const steps = valueSteps === 3 ? [TONAL_VALUE_ZONES[0]!, TONAL_VALUE_ZONES[1]!, TONAL_VALUE_ZONES[2]!] : TONAL_VALUE_ZONES;
    const swatchW = Math.min(48, (refWidth - 40) / steps.length - 4);
    const swatchH = 18;
    const totalW = steps.length * (swatchW + 4) - 4;
    const startX = (refWidth - totalW) / 2;
    const startY = refHeight - 34;

    return steps.map((item, i) => ({
      ...item,
      x: startX + i * (swatchW + 4),
      y: startY,
      width: swatchW,
      height: swatchH,
    }));
  }, [refWidth, refHeight, valueSteps]);

  return (
    <Group opacity={overlay.opacity}>
      {/* 1. Directional Light Vector Arrow */}
      {showLightRay && (
        <Group>
          <Path
            path={lightArrow.path}
            style="stroke"
            strokeWidth={2.5}
            strokeCap="round"
            strokeJoin="round"
            color="#E8C359"
          />
          {/* Sun/Light emitter symbol at origin */}
          <Circle
            cx={lightArrow.sourceX}
            cy={lightArrow.sourceY}
            r={8}
            style="stroke"
            strokeWidth={2}
            color="#E8C359"
          />
          <Circle
            cx={lightArrow.sourceX}
            cy={lightArrow.sourceY}
            r={4}
            style="fill"
            color="#E8C359"
          />
        </Group>
      )}

      {/* 2. Core Shadow Terminator Boundary */}
      {showTerminator && (
        <Path
          path={terminatorPath}
          style="stroke"
          strokeWidth={2.5}
          color="#3B423D"
        />
      )}

      {/* 3. 3D Directional Light Dial Compass */}
      <Group>
        {/* Dial background disc */}
        <Circle cx={dial.cx} cy={dial.cy} r={dial.radius} style="fill" color="#1F2622" opacity={0.88} />
        <Circle cx={dial.cx} cy={dial.cy} r={dial.radius} style="stroke" strokeWidth={1.5} color="#556359" />

        {/* Dial cardinal ticks (N, S, E, W) */}
        <Line p1={{ x: dial.cx, y: dial.cy - dial.radius }} p2={{ x: dial.cx, y: dial.cy - dial.radius + 5 }} style="stroke" strokeWidth={1.5} color="#859489" />
        <Line p1={{ x: dial.cx, y: dial.cy + dial.radius }} p2={{ x: dial.cx, y: dial.cy + dial.radius - 5 }} style="stroke" strokeWidth={1.5} color="#859489" />
        <Line p1={{ x: dial.cx - dial.radius, y: dial.cy }} p2={{ x: dial.cx - dial.radius + 5, y: dial.cy }} style="stroke" strokeWidth={1.5} color="#859489" />
        <Line p1={{ x: dial.cx + dial.radius, y: dial.cy }} p2={{ x: dial.cx + dial.radius - 5, y: dial.cy }} style="stroke" strokeWidth={1.5} color="#859489" />

        {/* Light Direction Pointer Hand */}
        <Line
          p1={{ x: dial.cx, y: dial.cy }}
          p2={{ x: dial.px, y: dial.py }}
          style="stroke"
          strokeWidth={2.2}
          color="#E8C359"
        />
        <Circle cx={dial.px} cy={dial.py} r={3} style="fill" color="#E8C359" />
        <Circle cx={dial.cx} cy={dial.cy} r={2} style="fill" color="#F5F3EC" />
      </Group>

      {/* 4. Tonal Scale Value Swatches (Bottom Bar) */}
      <Group>
        {swatches.map((swatch, idx) => (
          <Group key={`tone-${idx}`}>
            <Rect
              x={swatch.x}
              y={swatch.y}
              width={swatch.width}
              height={swatch.height}
              style="fill"
              color={swatch.color}
            />
            <Rect
              x={swatch.x}
              y={swatch.y}
              width={swatch.width}
              height={swatch.height}
              style="stroke"
              strokeWidth={1}
              color="#3B463F"
            />
          </Group>
        ))}
      </Group>
    </Group>
  );
}
