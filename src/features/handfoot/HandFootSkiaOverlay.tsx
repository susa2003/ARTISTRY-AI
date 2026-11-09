import React from "react";
import { Circle, Group, Line, Rect } from "@shopify/react-native-skia";
import type { HandFootResult, HandLandmark } from "../../services/ai/types";

export type HandFootOverlayProps = {
  result: HandFootResult;
  width: number;
  height: number;
  scale?: number;
  showPalmBox?: boolean;
  showKnuckleArch?: boolean;
};

export const HandFootSkiaOverlay: React.FC<HandFootOverlayProps> = ({
  result,
  width,
  height,
  scale = 1,
  showPalmBox = true,
  showKnuckleArch = true,
}) => {
  const lmMap = new Map<number, HandLandmark>();
  result.landmarks.forEach((lm) => lmMap.set(lm.index, lm));

  const fingerChains = [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
    [17, 18, 19, 20],
  ];

  return (
    <Group>
      {/* Palm Bounding Box */}
      {showPalmBox && result.palmBoundingBox && (
        <Rect
          x={result.palmBoundingBox.x * scale}
          y={result.palmBoundingBox.y * scale}
          width={result.palmBoundingBox.width * scale}
          height={result.palmBoundingBox.height * scale}
          color="#3F51B533"
          style="stroke"
          strokeWidth={2 * scale}
        />
      )}

      {/* Bones / Segments */}
      {result.type === "hand" ? (
        fingerChains.map((chain, chainIdx) => (
          <Group key={`chain-${chainIdx}`}>
            {chain.slice(0, -1).map((fromIdx, i) => {
              const toIdx = chain[i + 1]!;
              const p1 = lmMap.get(fromIdx);
              const p2 = lmMap.get(toIdx);
              if (!p1 || !p2) return null;
              return (
                <Line
                  key={`bone-${fromIdx}-${toIdx}`}
                  p1={{ x: p1.x * scale, y: p1.y * scale }}
                  p2={{ x: p2.x * scale, y: p2.y * scale }}
                  color={chainIdx === 2 ? "#FF9800" : "#607D8B"}
                  strokeWidth={2.5 * scale}
                />
              );
            })}
          </Group>
        ))
      ) : (
        // Foot connections
        <Group>
          {result.landmarks.slice(0, -1).map((lm, i) => {
            const next = result.landmarks[i + 1]!;
            return (
              <Line
                key={`foot-bone-${i}`}
                p1={{ x: lm.x * scale, y: lm.y * scale }}
                p2={{ x: next.x * scale, y: next.y * scale }}
                color="#607D8B"
                strokeWidth={3 * scale}
              />
            );
          })}
        </Group>
      )}

      {/* Joints & Tips */}
      {result.landmarks.map((lm) => (
        <Group key={`joint-${lm.index}`}>
          <Circle
            cx={lm.x * scale}
            cy={lm.y * scale}
            r={5 * scale}
            color="#FFFFFF"
          />
          <Circle
            cx={lm.x * scale}
            cy={lm.y * scale}
            r={3.5 * scale}
            color={lm.joint === "tip" ? "#E91E63" : "#00BCD4"}
          />
        </Group>
      ))}
    </Group>
  );
};
