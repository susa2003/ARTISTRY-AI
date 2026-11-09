import React from "react";
import { Circle, Group, Line } from "@shopify/react-native-skia";
import type { LightingResult } from "../../services/ai/types";

export type LightingOverlayProps = {
  lighting: LightingResult;
  width: number;
  height: number;
  scale?: number;
};

export const LightingSkiaOverlay: React.FC<LightingOverlayProps> = ({
  lighting,
  width,
  height,
  scale = 1,
}) => {
  const cx = width / 2;
  const cy = height / 2;
  const rad = (lighting.primaryLightAngle * Math.PI) / 180;

  const arrowLen = 120;
  const arrowStartX = cx - Math.cos(rad) * (arrowLen + 70);
  const arrowStartY = cy - Math.sin(rad) * (arrowLen + 70);
  const arrowEndX = cx - Math.cos(rad) * 70;
  const arrowEndY = cy - Math.sin(rad) * 70;

  const headAngle = Math.PI / 6;
  const barbLen = 20;

  return (
    <Group>
      {/* Light Vector Arrow */}
      <Line
        p1={{ x: arrowStartX * scale, y: arrowStartY * scale }}
        p2={{ x: arrowEndX * scale, y: arrowEndY * scale }}
        color="#FFA000"
        strokeWidth={4 * scale}
      />
      <Line
        p1={{ x: arrowEndX * scale, y: arrowEndY * scale }}
        p2={{
          x: (arrowEndX - Math.cos(rad - headAngle) * barbLen) * scale,
          y: (arrowEndY - Math.sin(rad - headAngle) * barbLen) * scale,
        }}
        color="#FFA000"
        strokeWidth={4 * scale}
      />
      <Line
        p1={{ x: arrowEndX * scale, y: arrowEndY * scale }}
        p2={{
          x: (arrowEndX - Math.cos(rad + headAngle) * barbLen) * scale,
          y: (arrowEndY - Math.sin(rad + headAngle) * barbLen) * scale,
        }}
        color="#FFA000"
        strokeWidth={4 * scale}
      />

      {/* Highlight Zones */}
      {lighting.highlightZones.map((hz, idx) => (
        <Circle
          key={`hz-${idx}`}
          cx={hz.x * scale}
          cy={hz.y * scale}
          r={hz.radius * scale}
          color="#FFD54F55"
          style="fill"
        />
      ))}

      {/* Core Shadow Zones */}
      {lighting.coreShadowZones.map((sz, idx) => (
        <Circle
          key={`sz-${idx}`}
          cx={sz.x * scale}
          cy={sz.y * scale}
          r={sz.radius * scale}
          color="#26323866"
          style="fill"
        />
      ))}
    </Group>
  );
};
