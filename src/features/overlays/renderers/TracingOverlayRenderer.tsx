/**
 * ARTISTRY AI — Tracing & Lightbox Overlay Renderer
 * Renders optical transfer guides for lightbox and carbon paper tracing:
 * - Corner registration marks for precision paper alignment
 * - Lightbox luminous matte framing
 * - Transfer alignment crosshairs and margin benchmarks
 */

import React from "react";
import { Circle, Group, Line, Rect } from "@shopify/react-native-skia";
import type { TracingOverlayConfig } from "../../../domain/overlayTypes";
import type { OverlayRenderContext } from "../OverlayContext";

interface TracingOverlayRendererProps {
  overlay: TracingOverlayConfig;
  context: OverlayRenderContext;
}

export function TracingOverlayRenderer({ overlay, context }: TracingOverlayRendererProps) {
  const { refWidth, refHeight } = context;
  const {
    mode = "contrast",
    edgeBoost = true,
    invert = false,
  } = overlay;

  const strokeColor = invert ? "#F5F3EC" : "#28594B";
  const arm = Math.min(24, Math.min(refWidth, refHeight) * 0.05);

  return (
    <Group opacity={overlay.opacity}>
      {/* Lightbox Registration Outer Frame */}
      <Rect
        x={0}
        y={0}
        width={refWidth}
        height={refHeight}
        style="stroke"
        strokeWidth={1.5}
        color={strokeColor}
      />

      {/* 4 Corner Transfer Registration Crosses (for carbon/graphite paper alignment) */}
      {/* Top-Left */}
      <Line p1={{ x: 0, y: arm }} p2={{ x: arm * 2, y: arm }} style="stroke" strokeWidth={1.5} color={strokeColor} />
      <Line p1={{ x: arm, y: 0 }} p2={{ x: arm, y: arm * 2 }} style="stroke" strokeWidth={1.5} color={strokeColor} />
      <Circle cx={arm} cy={arm} r={2.5} style="fill" color={strokeColor} />

      {/* Top-Right */}
      <Line p1={{ x: refWidth - arm * 2, y: arm }} p2={{ x: refWidth, y: arm }} style="stroke" strokeWidth={1.5} color={strokeColor} />
      <Line p1={{ x: refWidth - arm, y: 0 }} p2={{ x: refWidth - arm, y: arm * 2 }} style="stroke" strokeWidth={1.5} color={strokeColor} />
      <Circle cx={refWidth - arm} cy={arm} r={2.5} style="fill" color={strokeColor} />

      {/* Bottom-Left */}
      <Line p1={{ x: 0, y: refHeight - arm }} p2={{ x: arm * 2, y: refHeight - arm }} style="stroke" strokeWidth={1.5} color={strokeColor} />
      <Line p1={{ x: arm, y: refHeight - arm * 2 }} p2={{ x: arm, y: refHeight }} style="stroke" strokeWidth={1.5} color={strokeColor} />
      <Circle cx={arm} cy={refHeight - arm} r={2.5} style="fill" color={strokeColor} />

      {/* Bottom-Right */}
      <Line p1={{ x: refWidth - arm * 2, y: refHeight - arm }} p2={{ x: refWidth, y: refHeight - arm }} style="stroke" strokeWidth={1.5} color={strokeColor} />
      <Line p1={{ x: refWidth - arm, y: refHeight - arm * 2 }} p2={{ x: refWidth - arm, y: refHeight }} style="stroke" strokeWidth={1.5} color={strokeColor} />
      <Circle cx={refWidth - arm} cy={refHeight - arm} r={2.5} style="fill" color={strokeColor} />

      {/* Subtle edge-boost framing border if enabled */}
      {edgeBoost && (
        <Rect
          x={4}
          y={4}
          width={Math.max(1, refWidth - 8)}
          height={Math.max(1, refHeight - 8)}
          style="stroke"
          strokeWidth={0.75}
          color={strokeColor}
          opacity={0.4}
        />
      )}
    </Group>
  );
}
