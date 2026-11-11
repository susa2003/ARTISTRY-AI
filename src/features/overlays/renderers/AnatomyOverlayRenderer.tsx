/**
 * ARTISTRY AI — Anatomy Academy Overlay Renderer
 * Renders anatomical guides:
 * - Canonical 8-head proportion divisions (Cranium to Feet)
 * - Skeletal gesture armature (spine, ribcage, pelvis, limbs)
 * - Major muscle group contours (pectorals, deltoids, quadriceps)
 * - Classical facial proportion divisions
 */

import React, { useMemo } from "react";
import { Circle, Group, Line, Path } from "@shopify/react-native-skia";
import type { AnatomyOverlayConfig } from "../../../domain/overlayTypes";
import type { OverlayRenderContext } from "../OverlayContext";
import {
  calculateAnatomy,
  type AnatomyConfig,
} from "../../anatomy/AnatomyEngine";
import { createCurvedSplinePath, createPolygonPath } from "../geometry/pathHelpers";

interface AnatomyOverlayRendererProps {
  overlay: AnatomyOverlayConfig;
  context: OverlayRenderContext;
}

export function AnatomyOverlayRenderer({ overlay, context }: AnatomyOverlayRendererProps) {
  const { refWidth, refHeight } = context;
  const {
    mode = "proportions",
    gender = "neutral",
    heightRatio = 0.82,
    centerX = 0.5,
    centerY = 0.08,
    showMuscles = true,
    color = "#28594B",
    strokeWidth = 1.5,
  } = overlay;

  const config: AnatomyConfig = useMemo(() => ({
    mode,
    gender,
    heightRatio,
    centerX,
    centerY,
    color,
    opacity: overlay.opacity,
    showMuscles,
  }), [mode, gender, heightRatio, centerX, centerY, color, overlay.opacity, showMuscles]);

  const data = useMemo(() => {
    return calculateAnatomy(refWidth, refHeight, config);
  }, [refWidth, refHeight, config]);

  const showSkeletal = mode === "skeletal" || mode === "proportions";
  const showMuscular = mode === "muscular" || Boolean(showMuscles);
  const showFacial = mode === "facial";
  const showProportions = mode === "proportions" || mode === "skeletal" || mode === "muscular";

  return (
    <Group opacity={overlay.opacity}>
      {/* 1. Vertical Symmetry Centerline / Line of Gravity */}
      {showProportions && (
        <Line
          p1={data.centerLine[0]}
          p2={data.centerLine[1]}
          style="stroke"
          strokeWidth={strokeWidth * 1.2}
          color="#CB7857"
        />
      )}

      {/* 2. Canonical 8-Head Division Horizontal Bands */}
      {showProportions &&
        data.divisions.map((div) => (
          <Group key={`div-${div.index}`}>
            <Line
              p1={{ x: refWidth * 0.1, y: div.y }}
              p2={{ x: refWidth * 0.9, y: div.y }}
              style="stroke"
              strokeWidth={div.index % 2 === 0 ? strokeWidth * 1.2 : strokeWidth * 0.8}
              color={color}
            />
            {/* Division side tick indicators */}
            <Line
              p1={{ x: refWidth * 0.1, y: div.y - 4 }}
              p2={{ x: refWidth * 0.1, y: div.y + 4 }}
              style="stroke"
              strokeWidth={strokeWidth}
              color={color}
            />
            <Line
              p1={{ x: refWidth * 0.9, y: div.y - 4 }}
              p2={{ x: refWidth * 0.9, y: div.y + 4 }}
              style="stroke"
              strokeWidth={strokeWidth}
              color={color}
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
            strokeWidth={strokeWidth * 1.3}
            color="#D5A844"
          />
        ))}

      {/* 4. Skeletal Landmark Lines & Ovals */}
      {showSkeletal &&
        data.skeletalLines.map((bone, idx) => {
          if (bone.type === "line") {
            const path = createPolygonPath(bone.points, false);
            return (
              <Path
                key={`bone-${idx}`}
                path={path}
                style="stroke"
                strokeWidth={strokeWidth * 1.4}
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
                strokeWidth={strokeWidth * 1.2}
                color="#596A94"
              />
            );
          }
          return null;
        })}

      {/* 5. Muscular Anatomy Volumes (Pectorals, Deltoids, Core, Legs) */}
      {showMuscular &&
        data.muscles.map((muscle, idx) => {
          const path = createCurvedSplinePath(muscle.points, true);
          return (
            <Path
              key={`muscle-${idx}`}
              path={path}
              style="stroke"
              strokeWidth={strokeWidth * 1.1}
              strokeCap="round"
              strokeJoin="round"
              color="#A3546D"
              opacity={0.8}
            />
          );
        })}

      {/* 6. Facial Proportion Rules */}
      {showFacial &&
        data.facialProportions.map((guide, idx) => (
          <Line
            key={`face-${idx}`}
            p1={guide.line[0]}
            p2={guide.line[1]}
            style="stroke"
            strokeWidth={strokeWidth}
            color="#CB7857"
          />
        ))}
    </Group>
  );
}
