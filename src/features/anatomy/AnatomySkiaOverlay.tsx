import React, { useMemo } from "react";
import { Circle, Group, Line, Path, Skia } from "@shopify/react-native-skia";
import { calculateAnatomy, type AnatomyConfig } from "./AnatomyEngine";

type Props = {
  width: number;
  height: number;
  config: AnatomyConfig;
};

export function AnatomySkiaOverlay({ width, height, config }: Props) {
  const data = useMemo(() => calculateAnatomy(width, height, config), [width, height, config]);

  const showSkeletal = config.mode === "skeletal" || config.mode === "proportions";
  const showMuscular = config.mode === "muscular" || Boolean(config.showMuscles);
  const showFacial = config.mode === "facial";
  const showProportions = config.mode === "proportions" || config.mode === "skeletal" || config.mode === "muscular";

  return (
    <Group opacity={config.opacity}>
      {/* 1. Vertical Symmetry Centerline */}
      {showProportions && (
        <Line
          p1={data.centerLine[0]}
          p2={data.centerLine[1]}
          style="stroke"
          strokeWidth={1.8}
          color="#CB7857"
        />
      )}

      {/* 2. 8-Head Division Horizontal Bands */}
      {showProportions &&
        data.divisions.map((div) => (
          <Group key={`div-${div.index}`}>
            <Line
              p1={{ x: width * 0.1, y: div.y }}
              p2={{ x: width * 0.9, y: div.y }}
              style="stroke"
              strokeWidth={div.index % 2 === 0 ? 1.6 : 1.0}
              color={config.color}
            />
          </Group>
        ))}

      {/* 3. Shoulder & Pelvic Width Proportions */}
      {showProportions &&
        data.widthGuides.map((guide, idx) => (
          <Line
            key={`width-${idx}`}
            p1={guide.line[0]}
            p2={guide.line[1]}
            style="stroke"
            strokeWidth={2.0}
            color="#D5A844"
          />
        ))}

      {/* 4. Skeletal Landmark Lines & Ovals */}
      {showSkeletal &&
        data.skeletalLines.map((bone, idx) => {
          if (bone.type === "line") {
            const builder = Skia.PathBuilder.Make();
            if (bone.points.length > 0) {
              builder.moveTo(bone.points[0]!.x, bone.points[0]!.y);
              for (let i = 1; i < bone.points.length; i++) {
                builder.lineTo(bone.points[i]!.x, bone.points[i]!.y);
              }
            }
            return (
              <Path
                key={`bone-${idx}`}
                path={builder.build()}
                style="stroke"
                strokeWidth={2.2}
                strokeCap="round"
                strokeJoin="round"
                color="#596A94"
              />
            );
          } else if (bone.type === "ellipse" && bone.radius) {
            return (
              <Circle
                key={`bone-${idx}`}
                cx={bone.points[0]!.x}
                cy={bone.points[0]!.y}
                r={bone.radius}
                style="stroke"
                strokeWidth={1.8}
                color="#596A94"
              />
            );
          }
          return null;
        })}

      {/* 5. Muscular Anatomy Volumes (Deltoids, Pectorals, Core, Legs) */}
      {showMuscular &&
        data.muscles.map((muscle, idx) => {
          const builder = Skia.PathBuilder.Make();
          if (muscle.points.length > 0) {
            builder.moveTo(muscle.points[0]!.x, muscle.points[0]!.y);
            for (let i = 1; i < muscle.points.length; i++) {
              builder.lineTo(muscle.points[i]!.x, muscle.points[i]!.y);
            }
          }
          const isCore = muscle.group === "torso" || muscle.group === "chest";
          return (
            <Group key={`muscle-${idx}`}>
              <Path
                path={builder.build()}
                style="stroke"
                strokeWidth={isCore ? 2.0 : 1.7}
                strokeCap="round"
                strokeJoin="round"
                color={isCore ? "#28594B" : "#3B8C6E"}
              />
            </Group>
          );
        })}

      {/* 6. Facial Proportion Lines (Rule of 5 Eyes) */}
      {showFacial &&
        data.facialProportions.map((face, idx) => (
          <Line
            key={`face-${idx}`}
            p1={face.line[0]}
            p2={face.line[1]}
            style="stroke"
            strokeWidth={1.6}
            color="#8B4F69"
          />
        ))}
    </Group>
  );
}
