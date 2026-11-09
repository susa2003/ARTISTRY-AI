import React, { useMemo } from "react";
import { Circle, Group, Line, Rect } from "@shopify/react-native-skia";
import { calculatePerspective, type PerspectiveConfig } from "./PerspectiveEngine";

type Props = {
  width: number;
  height: number;
  config: PerspectiveConfig;
  activeDragTarget?: "vp1" | "vp2" | "vp3" | "horizon" | null;
};

export function PerspectiveSkiaOverlay({ width, height, config, activeDragTarget }: Props) {
  const data = useMemo(() => calculatePerspective(width, height, config), [width, height, config]);

  return (
    <Group opacity={config.opacity}>
      {/* 1. Horizon Line (Eye Level) */}
      <Line
        p1={data.horizonLine[0]}
        p2={data.horizonLine[1]}
        style="stroke"
        strokeWidth={activeDragTarget === "horizon" ? 3.6 : 2.4}
        color={activeDragTarget === "horizon" ? "#D5A844" : "#CB7857"}
      />

      {/* 2. Converging Orthogonal Perspective Rays */}
      {data.rays.map((ray, idx) => (
        <Line
          key={`ray-${idx}`}
          p1={ray.p1}
          p2={ray.p2}
          style="stroke"
          strokeWidth={0.9}
          color={config.color}
        />
      ))}

      {/* 3. Upright Verticals */}
      {data.verticals.map((vert, idx) => (
        <Line
          key={`vert-${idx}`}
          p1={vert.p1}
          p2={vert.p2}
          style="stroke"
          strokeWidth={0.8}
          color={config.color}
        />
      ))}

      {/* 4. Vanishing Point Touch-Drag Anchors */}
      {data.vanishingPoints.map((vp, idx) => {
        const vpKey = idx === 0 ? "vp1" : idx === 1 ? "vp2" : "vp3";
        const isDragging = activeDragTarget === vpKey;

        return (
          <Group key={`vp-${idx}`}>
            {/* Outer touch target ring */}
            <Circle
              cx={vp.x}
              cy={vp.y}
              r={isDragging ? 22 : 16}
              style="stroke"
              strokeWidth={isDragging ? 2.5 : 1.5}
              color={isDragging ? "#D5A844" : "rgba(203, 120, 87, 0.45)"}
            />
            {/* Outer solid rim */}
            <Circle
              cx={vp.x}
              cy={vp.y}
              r={isDragging ? 10 : 7}
              style="stroke"
              strokeWidth={2}
              color="#CB7857"
            />
            {/* Inner anchor dot */}
            <Circle
              cx={vp.x}
              cy={vp.y}
              r={isDragging ? 5 : 3.5}
              style="fill"
              color={isDragging ? "#D5A844" : "#CB7857"}
            />
          </Group>
        );
      })}
    </Group>
  );
}
