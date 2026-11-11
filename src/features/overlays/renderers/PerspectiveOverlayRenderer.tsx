/**
 * ARTISTRY AI — Perspective Assistant Overlay Renderer
 * Renders 1-point, 2-point, and 3-point linear perspective grids:
 * - Horizon line / eye level across the reference canvas
 * - Vanishing point (VP) markers and labels
 * - Converging perspective rays (orthogonals) radiating from each VP
 * - Vertical orthogonal guides
 */

import React, { useMemo } from "react";
import { Circle, Group, Line, Rect } from "@shopify/react-native-skia";
import type { PerspectiveOverlayConfig } from "../../../domain/overlayTypes";
import type { OverlayRenderContext } from "../OverlayContext";
import {
  calculatePerspective,
  type PerspectiveConfig,
} from "../../perspective/PerspectiveEngine";

interface PerspectiveOverlayRendererProps {
  overlay: PerspectiveOverlayConfig;
  context: OverlayRenderContext;
}

export function PerspectiveOverlayRenderer({ overlay, context }: PerspectiveOverlayRendererProps) {
  const { refWidth, refHeight } = context;
  const {
    mode = "2-point",
    horizonY = 0.5,
    vp1X = 0.1,
    vp2X = 0.9,
    vp3Y = -0.3,
    rayCount = 10,
    showVerticals = true,
    color = "#596A94",
    strokeWidth = 1.5,
  } = overlay;

  const config: PerspectiveConfig = useMemo(() => ({
    mode,
    horizonY,
    vp1X,
    vp2X,
    vp3Y,
    rayCount,
    showVerticals,
    color,
    opacity: overlay.opacity,
  }), [mode, horizonY, vp1X, vp2X, vp3Y, rayCount, showVerticals, color, overlay.opacity]);

  const data = useMemo(() => {
    return calculatePerspective(refWidth, refHeight, config);
  }, [refWidth, refHeight, config]);

  return (
    <Group opacity={overlay.opacity}>
      {/* Horizon Line (Eye Level) */}
      <Line
        p1={data.horizonLine[0]}
        p2={data.horizonLine[1]}
        style="stroke"
        strokeWidth={strokeWidth * 1.5}
        color={color}
      />

      {/* Radiating Perspective Rays (Orthogonals) */}
      {data.rays.map((ray, i) => (
        <Line
          key={`ray-${i}`}
          p1={ray.p1}
          p2={ray.p2}
          style="stroke"
          strokeWidth={Math.max(0.75, strokeWidth * 0.7)}
          color={color}
          opacity={0.55}
        />
      ))}

      {/* Vertical Orthogonal Lines */}
      {showVerticals &&
        data.verticals.map((vert, i) => (
          <Line
            key={`vert-${i}`}
            p1={vert.p1}
            p2={vert.p2}
            style="stroke"
            strokeWidth={Math.max(0.75, strokeWidth * 0.65)}
            color={color}
            opacity={0.4}
          />
        ))}

      {/* Vanishing Point (VP) Node Markers */}
      {data.vanishingPoints.map((vp, i) => {
        // Only render VP markers that are near or on canvas
        const isVisible =
          vp.x >= -refWidth * 0.3 &&
          vp.x <= refWidth * 1.3 &&
          vp.y >= -refHeight * 0.3 &&
          vp.y <= refHeight * 1.3;

        if (!isVisible) return null;

        return (
          <Group key={`vp-${i}`}>
            <Circle cx={vp.x} cy={vp.y} r={7} style="stroke" strokeWidth={2} color="#D5A844" />
            <Circle cx={vp.x} cy={vp.y} r={3} style="fill" color="#D5A844" />
            <Line
              p1={{ x: vp.x - 10, y: vp.y }}
              p2={{ x: vp.x + 10, y: vp.y }}
              style="stroke"
              strokeWidth={1.5}
              color="#D5A844"
            />
            <Line
              p1={{ x: vp.x, y: vp.y - 10 }}
              p2={{ x: vp.x, y: vp.y + 10 }}
              style="stroke"
              strokeWidth={1.5}
              color="#D5A844"
            />
          </Group>
        );
      })}
    </Group>
  );
}
