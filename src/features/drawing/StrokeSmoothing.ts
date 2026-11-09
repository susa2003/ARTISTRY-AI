import type { StrokePoint } from "../../domain/types";

export type SmoothingLevel = "off" | "low" | "medium" | "high";

/**
 * Applies Catmull-Rom / Midpoint curve smoothing to raw touchscreen input points.
 * Eliminates hand tremors and digitizer sampling angles.
 */
export function smoothStrokePoints(
  points: StrokePoint[],
  level: SmoothingLevel = "medium"
): StrokePoint[] {
  if (level === "off" || points.length < 3) {
    return points;
  }

  const iterations = level === "low" ? 1 : level === "medium" ? 2 : 3;
  let smoothed = [...points];

  for (let iter = 0; iter < iterations; iter++) {
    if (smoothed.length < 3) break;
    const next: StrokePoint[] = [];
    next.push(smoothed[0]!); // Keep exact start point

    for (let i = 0; i < smoothed.length - 1; i++) {
      const p0 = smoothed[i]!;
      const p1 = smoothed[i + 1]!;

      // Midpoint 1 (1/4 distance)
      const qx = p0.x * 0.75 + p1.x * 0.25;
      const qy = p0.y * 0.75 + p1.y * 0.25;
      const qp = ((p0.pressure ?? 1) * 3 + (p1.pressure ?? 1)) / 4;

      // Midpoint 2 (3/4 distance)
      const rx = p0.x * 0.25 + p1.x * 0.75;
      const ry = p0.y * 0.25 + p1.y * 0.75;
      const rp = ((p0.pressure ?? 1) + (p1.pressure ?? 1) * 3) / 4;

      next.push({ x: qx, y: qy, pressure: qp });
      next.push({ x: rx, y: ry, pressure: rp });
    }

    next.push(smoothed[smoothed.length - 1]!); // Keep exact end point
    smoothed = next;
  }

  return smoothed;
}

/**
 * Calculates velocity-based dynamic stroke tapering.
 */
export function calculateDynamicWidth(
  baseWidth: number,
  kind: "brush" | "pencil" | "pen" | "eraser",
  pressure = 1.0,
  velocity = 1.0
): number {
  if (kind === "pencil") {
    // Pencil responds subtly to pressure
    return Math.max(1, baseWidth * (0.7 + pressure * 0.3));
  }
  if (kind === "pen") {
    // Ink pen tapers based on velocity and pressure
    const factor = Math.max(0.35, Math.min(1.4, 1.2 - velocity * 0.4 + pressure * 0.3));
    return Math.max(1, baseWidth * factor);
  }
  if (kind === "eraser") {
    return baseWidth;
  }
  // Standard brush
  return Math.max(1, baseWidth * (0.8 + pressure * 0.2));
}
