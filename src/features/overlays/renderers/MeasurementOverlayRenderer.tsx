/**
 * ARTISTRY AI — Measurement & Plumb Alignment Overlay Renderer
 * Renders sight-size comparative calipers and plumb lines:
 * - True vertical & horizontal plumb alignment lines with plumb weights
 * - Comparative measurement calipers with perpendicular tick arms
 * - Ratio subdivisions for sight-size proportion checking
 */

import React, { useMemo } from "react";
import { Circle, Group, Line, Path } from "@shopify/react-native-skia";
import type {
  MeasurementCaliper,
  MeasurementOverlayConfig,
  PlumbOverlayConfig,
} from "../../../domain/overlayTypes";
import type { OverlayRenderContext } from "../OverlayContext";
import { createDashedLinePath } from "../geometry/pathHelpers";

interface MeasurementOverlayRendererProps {
  overlay: MeasurementOverlayConfig | PlumbOverlayConfig;
  context: OverlayRenderContext;
}

export function MeasurementOverlayRenderer({ overlay, context }: MeasurementOverlayRendererProps) {
  const { refWidth, refHeight } = context;

  if (overlay.type === "plumb") {
    const {
      verticalLines = [0.5],
      horizontalLines = [0.5],
      color = "#D5A844",
      strokeWidth = 1.5,
    } = overlay;

    return (
      <Group opacity={overlay.opacity}>
        {/* Vertical Plumb Lines */}
        {verticalLines.map((normX, idx) => {
          const x = normX * refWidth;
          return (
            <Group key={`plumb-v-${idx}`}>
              <Line
                p1={{ x, y: 0 }}
                p2={{ x, y: refHeight }}
                style="stroke"
                strokeWidth={strokeWidth}
                color={color}
              />
              {/* Plumb bob weight marker at bottom */}
              <Line
                p1={{ x: x - 7, y: refHeight - 12 }}
                p2={{ x: x + 7, y: refHeight - 12 }}
                style="stroke"
                strokeWidth={strokeWidth}
                color={color}
              />
              <Line
                p1={{ x: x - 7, y: refHeight - 12 }}
                p2={{ x, y: refHeight - 2 }}
                style="stroke"
                strokeWidth={strokeWidth}
                color={color}
              />
              <Line
                p1={{ x: x + 7, y: refHeight - 12 }}
                p2={{ x, y: refHeight - 2 }}
                style="stroke"
                strokeWidth={strokeWidth}
                color={color}
              />
              {/* Top suspension anchor */}
              <Circle cx={x} cy={6} r={3} style="fill" color={color} />
            </Group>
          );
        })}

        {/* Horizontal Level Alignment Lines */}
        {horizontalLines.map((normY, idx) => {
          const y = normY * refHeight;
          return (
            <Group key={`plumb-h-${idx}`}>
              <Line
                p1={{ x: 0, y }}
                p2={{ x: refWidth, y }}
                style="stroke"
                strokeWidth={strokeWidth}
                color={color}
              />
              {/* Left & Right level indicators */}
              <Circle cx={6} cy={y} r={3} style="fill" color={color} />
              <Circle cx={refWidth - 6} cy={y} r={3} style="fill" color={color} />
            </Group>
          );
        })}

        {/* Crosshair intersection indicators */}
        {verticalLines.map((normX, vi) =>
          horizontalLines.map((normY, hi) => {
            const x = normX * refWidth;
            const y = normY * refHeight;
            return (
              <Group key={`cross-${vi}-${hi}`}>
                <Circle cx={x} cy={y} r={5} style="stroke" strokeWidth={1.5} color={color} />
                <Circle cx={x} cy={y} r={1.5} style="fill" color={color} />
              </Group>
            );
          })
        )}
      </Group>
    );
  }

  // Measurement Calipers Mode
  const {
    calipers = [],
    referenceUnitLength,
    color = "#3A86FF",
  } = overlay;

  return (
    <Group opacity={overlay.opacity}>
      {calipers.map((caliper, idx) => {
        const x1 = caliper.p1.x * refWidth;
        const y1 = caliper.p1.y * refHeight;
        const x2 = caliper.p2.x * refWidth;
        const y2 = caliper.p2.y * refHeight;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len <= 0) return null;

        // Normal perpendicular vector for caliper end tick arms
        const nx = (-dy / len) * 12;
        const ny = (dx / len) * 12;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        return (
          <Group key={caliper.id || `caliper-${idx}`}>
            {/* Primary Caliper Spine Line */}
            <Line
              p1={{ x: x1, y: y1 }}
              p2={{ x: x2, y: y2 }}
              style="stroke"
              strokeWidth={2.0}
              color={color}
            />

            {/* Start Caliper Arm Ticks */}
            <Line
              p1={{ x: x1 - nx, y: y1 - ny }}
              p2={{ x: x1 + nx, y: y1 + ny }}
              style="stroke"
              strokeWidth={2.0}
              color={color}
            />
            <Circle cx={x1} cy={y1} r={3} style="fill" color={color} />

            {/* End Caliper Arm Ticks */}
            <Line
              p1={{ x: x2 - nx, y: y2 - ny }}
              p2={{ x: x2 + nx, y: y2 + ny }}
              style="stroke"
              strokeWidth={2.0}
              color={color}
            />
            <Circle cx={x2} cy={y2} r={3} style="fill" color={color} />

            {/* Midpoint Divider Tick */}
            <Circle cx={midX} cy={midY} r={3.5} style="stroke" strokeWidth={1.5} color={color} />
          </Group>
        );
      })}
    </Group>
  );
}
