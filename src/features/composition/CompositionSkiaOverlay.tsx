import React from "react";
import { Circle, Group, Line, Rect } from "@shopify/react-native-skia";
import type { CompositionResult } from "../../services/ai/types";

export type CompositionOverlayProps = {
  result: CompositionResult;
  width: number;
  height: number;
  scale?: number;
  showThirds?: boolean;
  showCropGuide?: boolean;
};

export const CompositionSkiaOverlay: React.FC<CompositionOverlayProps> = ({
  result,
  width,
  height,
  scale = 1,
  showThirds = true,
  showCropGuide = true,
}) => {
  const x1 = (width / 3) * scale;
  const x2 = ((2 * width) / 3) * scale;
  const y1 = (height / 3) * scale;
  const y2 = ((2 * height) / 3) * scale;

  return (
    <Group>
      {/* Rule of Thirds Grid */}
      {showThirds && (
        <Group>
          <Line p1={{ x: x1, y: 0 }} p2={{ x: x1, y: height * scale }} color="#2196F388" strokeWidth={1.5} />
          <Line p1={{ x: x2, y: 0 }} p2={{ x: x2, y: height * scale }} color="#2196F388" strokeWidth={1.5} />
          <Line p1={{ x: 0, y: y1 }} p2={{ x: width * scale, y: y1 }} color="#2196F388" strokeWidth={1.5} />
          <Line p1={{ x: 0, y: y2 }} p2={{ x: width * scale, y: y2 }} color="#2196F388" strokeWidth={1.5} />

          {/* Power Intersection Circles */}
          <Circle cx={x1} cy={y1} r={5 * scale} color="#F44336" />
          <Circle cx={x2} cy={y1} r={5 * scale} color="#F44336" />
          <Circle cx={x1} cy={y2} r={5 * scale} color="#F44336" />
          <Circle cx={x2} cy={y2} r={5 * scale} color="#F44336" />
        </Group>
      )}

      {/* Suggested Crop Box */}
      {showCropGuide && result.suggestedCropping && (
        <Rect
          x={result.suggestedCropping.x * scale}
          y={result.suggestedCropping.y * scale}
          width={result.suggestedCropping.width * scale}
          height={result.suggestedCropping.height * scale}
          color="#4CAF5088"
          style="stroke"
          strokeWidth={2 * scale}
        />
      )}

      {/* Visual Weight Center of Mass */}
      <Circle
        cx={result.visualWeightCenter.x * scale}
        cy={result.visualWeightCenter.y * scale}
        r={7 * scale}
        color="#FF9800"
        style="stroke"
        strokeWidth={2.5 * scale}
      />
    </Group>
  );
};
