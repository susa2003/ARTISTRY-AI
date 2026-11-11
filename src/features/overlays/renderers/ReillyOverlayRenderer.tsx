/**
 * ARTISTRY AI — Reilly Method Rhythm Abstraction Overlay Renderer
 * Renders the structural rhythm curves developed by Frank J. Reilly:
 * - Brow curve and glabella/nasal keystone
 * - Zygomatic cheek rhythm arcs
 * - Chin & mouth barrel loop
 * - Sternocleidomastoid neck ribbons
 * - Cranial and facial structural rhythm loops
 */

import React, { useMemo } from "react";
import { Circle, Group, Line, Path } from "@shopify/react-native-skia";
import type { ReillyOverlayConfig } from "../../../domain/overlayTypes";
import type { OverlayRenderContext } from "../OverlayContext";
import {
  createCurvedSplinePath,
  createRotatedEllipsePath,
  type Point2D,
} from "../geometry/pathHelpers";

interface ReillyOverlayRendererProps {
  overlay: ReillyOverlayConfig;
  context: OverlayRenderContext;
}

export function ReillyOverlayRenderer({ overlay, context }: ReillyOverlayRendererProps) {
  const { refWidth, refHeight } = context;
  const {
    centerX = 0.5,
    centerY = 0.45,
    scale = 1.0,
    rotation = 0,
    showBrowCurve = true,
    showCheekArcs = true,
    showNasalKeystone = true,
    showChinLoop = true,
    showNeckRibbons = true,
    color = "#8B4F69",
    strokeWidth = 1.75,
  } = overlay;

  const curves = useMemo(() => {
    const cx = centerX * refWidth;
    const cy = centerY * refHeight;
    const baseUnit = Math.min(refWidth, refHeight) * 0.25 * Math.max(0.2, scale);
    const rad = (rotation * Math.PI) / 180;
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);

    // Transform local normalized unit point to reference image coordinates
    const toWorld = (lx: number, ly: number): Point2D => {
      const rx = lx * baseUnit;
      const ry = ly * baseUnit;
      return {
        x: cx + (rx * cosR - ry * sinR),
        y: cy + (rx * sinR + ry * cosR),
      };
    };

    // 1. Central Axis Rhythm (from forehead hairline down through chin to neck)
    const centralAxis: Point2D[] = [
      toWorld(0, -1.3),
      toWorld(0, -0.6),
      toWorld(0, 0),
      toWorld(0, 0.45),
      toWorld(0, 0.9),
      toWorld(0, 1.4),
    ];

    // 2. Brow Curve (sweeping across temples through glabella)
    const browCurve: Point2D[] = [
      toWorld(-1.05, -0.25),
      toWorld(-0.55, -0.15),
      toWorld(0, -0.1),
      toWorld(0.55, -0.15),
      toWorld(1.05, -0.25),
    ];

    // 3. Nasal Keystone (trapezoid between the eyes / glabella)
    const keystone: Point2D[] = [
      toWorld(-0.16, -0.22),
      toWorld(0.16, -0.22),
      toWorld(0.12, 0.05),
      toWorld(-0.12, 0.05),
      toWorld(-0.16, -0.22),
    ];

    // 4. Nose Triangle to Alar Base
    const noseRibbons: Point2D[] = [
      toWorld(-0.12, 0.05),
      toWorld(-0.24, 0.42),
      toWorld(0, 0.48),
      toWorld(0.24, 0.42),
      toWorld(0.12, 0.05),
    ];

    // 5. Cheek Arcs (Zygomatic rhythm arcs sweeping down toward mouth and chin)
    const leftCheekArc: Point2D[] = [
      toWorld(-0.95, -0.15),
      toWorld(-0.75, 0.25),
      toWorld(-0.4, 0.65),
      toWorld(0, 0.95),
    ];
    const rightCheekArc: Point2D[] = [
      toWorld(0.95, -0.15),
      toWorld(0.75, 0.25),
      toWorld(0.4, 0.65),
      toWorld(0, 0.95),
    ];

    // 6. Chin & Mouth Barrel Loop
    const chinLoop: Point2D[] = [
      toWorld(-0.35, 0.55),
      toWorld(-0.38, 0.78),
      toWorld(0, 0.98),
      toWorld(0.38, 0.78),
      toWorld(0.35, 0.55),
      toWorld(0, 0.5),
      toWorld(-0.35, 0.55),
    ];

    // 7. Orbital Eye Ovals
    const leftEyeOrbit: Point2D[] = [
      toWorld(-0.62, -0.12),
      toWorld(-0.4, -0.22),
      toWorld(-0.18, -0.12),
      toWorld(-0.38, 0.02),
      toWorld(-0.62, -0.12),
    ];
    const rightEyeOrbit: Point2D[] = [
      toWorld(0.18, -0.12),
      toWorld(0.4, -0.22),
      toWorld(0.62, -0.12),
      toWorld(0.38, 0.02),
      toWorld(0.18, -0.12),
    ];

    // 8. Neck Ribbons (Sternocleidomastoid rhythm lines to suprasternal clavicle pit)
    const leftNeckRibbon: Point2D[] = [
      toWorld(-0.85, 0.45),
      toWorld(-0.55, 1.05),
      toWorld(-0.08, 1.55),
    ];
    const rightNeckRibbon: Point2D[] = [
      toWorld(0.85, 0.45),
      toWorld(0.55, 1.05),
      toWorld(0.08, 1.55),
    ];

    return {
      cx,
      cy,
      baseUnit,
      rad,
      centralAxis,
      browCurve,
      keystone,
      noseRibbons,
      leftCheekArc,
      rightCheekArc,
      chinLoop,
      leftEyeOrbit,
      rightEyeOrbit,
      leftNeckRibbon,
      rightNeckRibbon,
    };
  }, [centerX, centerY, refWidth, refHeight, scale, rotation]);

  const centralAxisPath = useMemo(() => createCurvedSplinePath(curves.centralAxis), [curves.centralAxis]);
  const browPath = useMemo(() => createCurvedSplinePath(curves.browCurve), [curves.browCurve]);
  const keystonePath = useMemo(() => createCurvedSplinePath(curves.keystone), [curves.keystone]);
  const noseRibbonPath = useMemo(() => createCurvedSplinePath(curves.noseRibbons), [curves.noseRibbons]);
  const leftCheekPath = useMemo(() => createCurvedSplinePath(curves.leftCheekArc), [curves.leftCheekArc]);
  const rightCheekPath = useMemo(() => createCurvedSplinePath(curves.rightCheekArc), [curves.rightCheekArc]);
  const chinLoopPath = useMemo(() => createCurvedSplinePath(curves.chinLoop), [curves.chinLoop]);
  const leftEyeOrbitPath = useMemo(() => createCurvedSplinePath(curves.leftEyeOrbit), [curves.leftEyeOrbit]);
  const rightEyeOrbitPath = useMemo(() => createCurvedSplinePath(curves.rightEyeOrbit), [curves.rightEyeOrbit]);
  const leftNeckPath = useMemo(() => createCurvedSplinePath(curves.leftNeckRibbon), [curves.leftNeckRibbon]);
  const rightNeckPath = useMemo(() => createCurvedSplinePath(curves.rightNeckRibbon), [curves.rightNeckRibbon]);

  // Cranial primary oval
  const cranialOvalPath = useMemo(() => {
    return createRotatedEllipsePath(curves.cx, curves.cy - curves.baseUnit * 0.2, curves.baseUnit * 0.95, curves.baseUnit * 1.15, curves.rad);
  }, [curves.cx, curves.cy, curves.baseUnit, curves.rad]);

  return (
    <Group opacity={overlay.opacity}>
      {/* Cranium Rhythm Loop */}
      <Path
        path={cranialOvalPath}
        style="stroke"
        strokeWidth={strokeWidth}
        color={color}
        opacity={0.65}
      />

      {/* Central Rhythm Axis */}
      <Path
        path={centralAxisPath}
        style="stroke"
        strokeWidth={strokeWidth * 1.1}
        color={color}
      />

      {/* Orbital Eye Loops */}
      <Path
        path={leftEyeOrbitPath}
        style="stroke"
        strokeWidth={strokeWidth * 0.85}
        color={color}
        opacity={0.8}
      />
      <Path
        path={rightEyeOrbitPath}
        style="stroke"
        strokeWidth={strokeWidth * 0.85}
        color={color}
        opacity={0.8}
      />

      {/* Brow Curve */}
      {showBrowCurve && (
        <Path
          path={browPath}
          style="stroke"
          strokeWidth={strokeWidth * 1.25}
          color={color}
        />
      )}

      {/* Nasal Keystone */}
      {showNasalKeystone && (
        <>
          <Path
            path={keystonePath}
            style="stroke"
            strokeWidth={strokeWidth}
            color={color}
          />
          <Path
            path={noseRibbonPath}
            style="stroke"
            strokeWidth={strokeWidth * 0.9}
            color={color}
          />
        </>
      )}

      {/* Zygomatic Cheek Arcs */}
      {showCheekArcs && (
        <>
          <Path
            path={leftCheekPath}
            style="stroke"
            strokeWidth={strokeWidth * 1.15}
            color={color}
          />
          <Path
            path={rightCheekPath}
            style="stroke"
            strokeWidth={strokeWidth * 1.15}
            color={color}
          />
        </>
      )}

      {/* Chin & Mouth Barrel Loop */}
      {showChinLoop && (
        <Path
          path={chinLoopPath}
          style="stroke"
          strokeWidth={strokeWidth * 1.1}
          color={color}
        />
      )}

      {/* Sternocleidomastoid Neck Ribbons */}
      {showNeckRibbons && (
        <>
          <Path
            path={leftNeckPath}
            style="stroke"
            strokeWidth={strokeWidth * 1.2}
            color={color}
          />
          <Path
            path={rightNeckPath}
            style="stroke"
            strokeWidth={strokeWidth * 1.2}
            color={color}
          />
          {/* Suprasternal notch pit */}
          <Circle
            cx={curves.centralAxis[curves.centralAxis.length - 1]!.x}
            cy={curves.centralAxis[curves.centralAxis.length - 1]!.y}
            r={3.5}
            style="fill"
            color={color}
          />
        </>
      )}
    </Group>
  );
}
