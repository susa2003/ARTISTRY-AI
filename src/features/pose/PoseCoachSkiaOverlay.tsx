import React from "react";
import { Circle, Group, Line, Path, Skia } from "@shopify/react-native-skia";
import type { PoseLandmark, PoseResult } from "../../services/ai/types";

export type PoseCoachOverlayProps = {
  pose: PoseResult;
  width: number;
  height: number;
  scale?: number;
  showLandmarks?: boolean;
  showLineOfAction?: boolean;
  showTorsoBox?: boolean;
};

export const PoseCoachSkiaOverlay: React.FC<PoseCoachOverlayProps> = ({
  pose,
  width,
  height,
  scale = 1,
  showLandmarks = true,
  showLineOfAction = true,
  showTorsoBox = true,
}) => {
  const lmMap = new Map<number, PoseLandmark>();
  pose.landmarks.forEach((lm) => lmMap.set(lm.index, lm));

  const path = React.useMemo(() => {
    const builder = Skia.PathBuilder.Make();
    builder.moveTo(pose.lineOfAction.start.x * scale, pose.lineOfAction.start.y * scale);
    builder.quadTo(
      pose.lineOfAction.control.x * scale,
      pose.lineOfAction.control.y * scale,
      pose.lineOfAction.end.x * scale,
      pose.lineOfAction.end.y * scale
    );
    return builder.build();
  }, [pose.lineOfAction, scale]);

  const ls = lmMap.get(11);
  const rs = lmMap.get(12);
  const lh = lmMap.get(23);
  const rh = lmMap.get(24);

  return (
    <Group>
      {/* Line of Action */}
      {showLineOfAction && (
        <Path
          path={path}
          color="#00BCD4"
          style="stroke"
          strokeWidth={4 * scale}
          strokeCap="round"
        />
      )}

      {/* Torso Box */}
      {showTorsoBox && ls && rs && lh && rh && (
        <Group>
          <Line
            p1={{ x: ls.x * scale, y: ls.y * scale }}
            p2={{ x: rs.x * scale, y: rs.y * scale }}
            color="#FF9800"
            strokeWidth={3 * scale}
          />
          <Line
            p1={{ x: lh.x * scale, y: lh.y * scale }}
            p2={{ x: rh.x * scale, y: rh.y * scale }}
            color="#FF9800"
            strokeWidth={3 * scale}
          />
          <Line
            p1={{ x: ls.x * scale, y: ls.y * scale }}
            p2={{ x: lh.x * scale, y: lh.y * scale }}
            color="#9C27B0"
            strokeWidth={2.5 * scale}
          />
          <Line
            p1={{ x: rs.x * scale, y: rs.y * scale }}
            p2={{ x: rh.x * scale, y: rh.y * scale }}
            color="#9C27B0"
            strokeWidth={2.5 * scale}
          />
        </Group>
      )}

      {/* Landmarks */}
      {showLandmarks &&
        pose.landmarks.map((lm) => (
          <Group key={`lm-${lm.index}`}>
            <Circle
              cx={lm.x * scale}
              cy={lm.y * scale}
              r={6 * scale}
              color="#FFFFFF"
            />
            <Circle
              cx={lm.x * scale}
              cy={lm.y * scale}
              r={4 * scale}
              color="#E91E63"
            />
          </Group>
        ))}

      {/* Balance Center */}
      <Circle
        cx={pose.balanceCenter.x * scale}
        cy={pose.balanceCenter.y * scale}
        r={8 * scale}
        color="#4CAF50"
        style="stroke"
        strokeWidth={2 * scale}
      />
    </Group>
  );
};
