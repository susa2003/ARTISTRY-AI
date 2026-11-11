/**
 * ARTISTRY AI — Bargue Drawing Course Block-In Overlay Renderer
 * Renders the classical academic block-in method created by Charles Bargue:
 * - Straight-line polygonal bounding envelope (chords before curves)
 * - True vertical plumb line anchors from primary apex
 * - Sight-size horizontal/vertical comparative division bands
 * - Major proportion benchmark lines
 */

import React, { useMemo } from "react";
import { Circle, Group, Line, Path, Rect } from "@shopify/react-native-skia";
import type { BargueOverlayConfig } from "../../../domain/overlayTypes";
import type { OverlayRenderContext } from "../OverlayContext";
import {
  createDashedLinePath,
  createPolygonPath,
  type Point2D,
} from "../geometry/pathHelpers";

interface BargueOverlayRendererProps {
  overlay: BargueOverlayConfig;
  context: OverlayRenderContext;
}

export function BargueOverlayRenderer({ overlay, context }: BargueOverlayRendererProps) {
  const { refWidth, refHeight } = context;
  const {
    blockInPoints = [],
    showEnvelope = true,
    showPlumbAnchors = true,
    sightSizeDivision = 3,
    color = "#A85D3B",
    strokeWidth = 1.75,
  } = overlay;

  // Convert normalized block-in vertices to reference pixels
  const points: Point2D[] = useMemo(() => {
    if (blockInPoints && blockInPoints.length >= 3) {
      return blockInPoints.map((pt) => ({
        x: pt.x * refWidth,
        y: pt.y * refHeight,
      }));
    }

    // Default classical academic block-in envelope if no custom points provided
    return [
      { x: refWidth * 0.5, y: refHeight * 0.12 },   // Top apex (crown)
      { x: refWidth * 0.72, y: refHeight * 0.28 },  // Upper right angle (shoulder/hair)
      { x: refWidth * 0.78, y: refHeight * 0.55 },  // Mid right angle (elbow/waist)
      { x: refWidth * 0.65, y: refHeight * 0.85 },  // Lower right angle (knee/base)
      { x: refWidth * 0.45, y: refHeight * 0.88 },  // Bottom baseline (feet/chin)
      { x: refWidth * 0.25, y: refHeight * 0.7 },   // Lower left angle
      { x: refWidth * 0.22, y: refHeight * 0.4 },   // Mid left angle
      { x: refWidth * 0.35, y: refHeight * 0.2 },   // Upper left angle
    ];
  }, [blockInPoints, refWidth, refHeight]);

  // Compute bounding box of block-in points
  const bounds = useMemo(() => {
    if (points.length === 0) {
      return { minX: 0, maxX: refWidth, minY: 0, maxY: refHeight };
    }
    let minX = points[0]!.x;
    let maxX = points[0]!.x;
    let minY = points[0]!.y;
    let maxY = points[0]!.y;

    for (const pt of points) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }
    return { minX, maxX, minY, maxY };
  }, [points, refWidth, refHeight]);

  // Straight-line polygon envelope path
  const envelopePath = useMemo(() => {
    return createPolygonPath(points, true);
  }, [points]);

  // Sight-size horizontal division bands
  const divisionBands = useMemo(() => {
    const bands: Array<{ y: number; fraction: string }> = [];
    const divs = Math.max(2, Math.min(8, sightSizeDivision));
    const envelopeHeight = bounds.maxY - bounds.minY;

    for (let i = 1; i < divs; i++) {
      const y = bounds.minY + (envelopeHeight * i) / divs;
      bands.push({ y, fraction: `${i}/${divs}` });
    }
    return bands;
  }, [bounds, sightSizeDivision]);

  // Plumb line anchors: dropped from apex through center of mass to baseline
  const plumbX = (bounds.minX + bounds.maxX) / 2;

  // Dashed plumb line path
  const plumbPath = useMemo(() => {
    return createDashedLinePath(plumbX, 0, plumbX, refHeight, 10, 6);
  }, [plumbX, refHeight]);

  return (
    <Group opacity={overlay.opacity}>
      {/* Plumb Line Anchor & plumb bob mark */}
      {showPlumbAnchors && (
        <>
          <Path
            path={plumbPath}
            style="stroke"
            strokeWidth={strokeWidth}
            color={color}
            opacity={0.8}
          />
          {/* Top plumb anchor mark */}
          <Circle cx={plumbX} cy={bounds.minY} r={4.5} style="stroke" strokeWidth={1.5} color={color} />
          <Circle cx={plumbX} cy={bounds.minY} r={2} style="fill" color={color} />
          {/* Bottom plumb bob weight indicator */}
          <Line
            p1={{ x: plumbX - 8, y: bounds.maxY + 15 }}
            p2={{ x: plumbX + 8, y: bounds.maxY + 15 }}
            style="stroke"
            strokeWidth={strokeWidth}
            color={color}
          />
          <Line
            p1={{ x: plumbX, y: bounds.maxY }}
            p2={{ x: plumbX, y: bounds.maxY + 15 }}
            style="stroke"
            strokeWidth={strokeWidth}
            color={color}
          />
        </>
      )}

      {/* Straight-line Block-In Envelope */}
      {showEnvelope && (
        <>
          <Path
            path={envelopePath}
            style="stroke"
            strokeWidth={strokeWidth * 1.3}
            color={color}
          />
          {/* Vertex Nodes */}
          {points.map((pt, i) => (
            <Circle
              key={`pt-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={3.5}
              style="fill"
              color={color}
            />
          ))}
        </>
      )}

      {/* Sight-Size Comparative Benchmark Division Lines */}
      {divisionBands.map((band, idx) => (
        <Group key={`band-${idx}`}>
          <Line
            p1={{ x: bounds.minX - 15, y: band.y }}
            p2={{ x: bounds.maxX + 15, y: band.y }}
            style="stroke"
            strokeWidth={strokeWidth * 0.75}
            color={color}
            opacity={0.55}
          />
          {/* Benchmark division tick marks at edges */}
          <Line
            p1={{ x: bounds.minX - 15, y: band.y - 5 }}
            p2={{ x: bounds.minX - 15, y: band.y + 5 }}
            style="stroke"
            strokeWidth={strokeWidth}
            color={color}
          />
          <Line
            p1={{ x: bounds.maxX + 15, y: band.y - 5 }}
            p2={{ x: bounds.maxX + 15, y: band.y + 5 }}
            style="stroke"
            strokeWidth={strokeWidth}
            color={color}
          />
        </Group>
      ))}

      {/* Envelope Top and Bottom horizontal boundary limits */}
      <Line
        p1={{ x: bounds.minX - 25, y: bounds.minY }}
        p2={{ x: bounds.maxX + 25, y: bounds.minY }}
        style="stroke"
        strokeWidth={strokeWidth * 0.9}
        color={color}
        opacity={0.7}
      />
      <Line
        p1={{ x: bounds.minX - 25, y: bounds.maxY }}
        p2={{ x: bounds.maxX + 25, y: bounds.maxY }}
        style="stroke"
        strokeWidth={strokeWidth * 0.9}
        color={color}
        opacity={0.7}
      />
    </Group>
  );
}
