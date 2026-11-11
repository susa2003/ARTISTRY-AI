/**
 * ARTISTRY AI — Overlay Path Helpers
 * Geometric utilities for building Skia vector paths for traditional drawing methods.
 * Uses Skia.PathBuilder to construct immutable SkPath instances.
 */

import { Skia, type SkPath } from "@shopify/react-native-skia";

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Creates an axis-aligned ellipse path centered at (cx, cy) with radii (rx, ry).
 */
export function createEllipsePath(cx: number, cy: number, rx: number, ry: number, steps: number = 32): SkPath {
  const builder = Skia.PathBuilder.Make();
  if (rx <= 0 || ry <= 0) return builder.build();

  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const x = cx + rx * Math.cos(theta);
    const y = cy + ry * Math.sin(theta);
    if (i === 0) {
      builder.moveTo(x, y);
    } else {
      builder.lineTo(x, y);
    }
  }
  builder.close();
  return builder.build();
}

/**
 * Creates a rotated ellipse path centered at (cx, cy) with radii (rx, ry) rotated by angleRad.
 */
export function createRotatedEllipsePath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angleRad: number,
  steps: number = 36
): SkPath {
  const builder = Skia.PathBuilder.Make();
  if (rx <= 0 || ry <= 0) return builder.build();

  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);

  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const localX = rx * Math.cos(theta);
    const localY = ry * Math.sin(theta);

    const worldX = cx + (localX * cosA - localY * sinA);
    const worldY = cy + (localX * sinA + localY * cosA);

    if (i === 0) {
      builder.moveTo(worldX, worldY);
    } else {
      builder.lineTo(worldX, worldY);
    }
  }
  builder.close();
  return builder.build();
}

/**
 * Creates a quadratic or cubic Bezier curve path connecting a series of points.
 */
export function createCurvedSplinePath(points: Point2D[], closed: boolean = false): SkPath {
  const builder = Skia.PathBuilder.Make();
  if (points.length < 2) return builder.build();

  builder.moveTo(points[0]!.x, points[0]!.y);

  if (points.length === 2) {
    builder.lineTo(points[1]!.x, points[1]!.y);
    return builder.build();
  }

  for (let i = 0; i < points.length - 1; i++) {
    const pCurrent = points[i]!;
    const pNext = points[i + 1]!;
    const midX = (pCurrent.x + pNext.x) / 2;
    const midY = (pCurrent.y + pNext.y) / 2;
    builder.quadTo(pCurrent.x, pCurrent.y, midX, midY);
  }

  const last = points[points.length - 1]!;
  builder.lineTo(last.x, last.y);

  if (closed) {
    builder.close();
  }

  return builder.build();
}

/**
 * Creates an arrow path with a line from (x1, y1) to (x2, y2) and an arrowhead at (x2, y2).
 */
export function createArrowPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  headSize: number = 14
): SkPath {
  const builder = Skia.PathBuilder.Make();
  builder.moveTo(x1, y1);
  builder.lineTo(x2, y2);

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrowAngle = Math.PI / 6; // 30 degrees

  const leftX = x2 - headSize * Math.cos(angle - arrowAngle);
  const leftY = y2 - headSize * Math.sin(angle - arrowAngle);
  const rightX = x2 - headSize * Math.cos(angle + arrowAngle);
  const rightY = y2 - headSize * Math.sin(angle + arrowAngle);

  builder.moveTo(leftX, leftY);
  builder.lineTo(x2, y2);
  builder.lineTo(rightX, rightY);

  return builder.build();
}

/**
 * Creates a dashed line path from (x1, y1) to (x2, y2).
 */
export function createDashedLinePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dashLength: number = 8,
  gapLength: number = 6
): SkPath {
  const builder = Skia.PathBuilder.Make();
  const dx = x2 - x1;
  const dy = y2 - y1;
  const totalLength = Math.sqrt(dx * dx + dy * dy);
  if (totalLength <= 0) return builder.build();

  const unitX = dx / totalLength;
  const unitY = dy / totalLength;

  let currentDist = 0;
  let drawing = true;

  while (currentDist < totalLength) {
    const segLength = drawing ? dashLength : gapLength;
    const nextDist = Math.min(totalLength, currentDist + segLength);

    if (drawing) {
      builder.moveTo(x1 + unitX * currentDist, y1 + unitY * currentDist);
      builder.lineTo(x1 + unitX * nextDist, y1 + unitY * nextDist);
    }

    currentDist = nextDist;
    drawing = !drawing;
  }

  return builder.build();
}

/**
 * Creates a polygon envelope path from an array of vertices.
 */
export function createPolygonPath(points: Point2D[], close: boolean = true): SkPath {
  const builder = Skia.PathBuilder.Make();
  if (points.length === 0) return builder.build();

  builder.moveTo(points[0]!.x, points[0]!.y);
  for (let i = 1; i < points.length; i++) {
    builder.lineTo(points[i]!.x, points[i]!.y);
  }
  if (close && points.length > 2) {
    builder.close();
  }
  return builder.build();
}
