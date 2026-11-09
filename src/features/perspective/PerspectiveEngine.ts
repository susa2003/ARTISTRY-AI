import type { Stroke, StrokePoint } from "../../domain/types";

export type PerspectiveMode = "1-point" | "2-point" | "3-point";

export type PerspectiveConfig = {
  mode: PerspectiveMode;
  horizonY: number;        // Horizon line Y (0.1 to 0.9 of canvas height)
  vp1X: number;            // 1st Vanishing Point X (0 to 1 of width)
  vp2X: number;            // 2nd Vanishing Point X (for 2-point and 3-point)
  vp3Y: number;            // 3rd Vanishing Point Y (for 3-point, e.g. -0.5 for zenith, 1.5 for nadir)
  rayCount: number;        // Number of radiating rays per VP (6, 8, 12, 16)
  showVerticals: boolean;  // Show vertical orthogonal grid
  color: string;
  opacity: number;
};

export const DEFAULT_PERSPECTIVE_CONFIG: PerspectiveConfig = {
  mode: "2-point",
  horizonY: 0.45,
  vp1X: 0.1,
  vp2X: 0.9,
  vp3Y: -0.3,
  rayCount: 10,
  showVerticals: true,
  color: "#28594B",
  opacity: 0.75,
};

export type PerspectiveLine = {
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  isHorizon?: boolean;
};

export type PerspectiveRenderData = {
  horizonLine: [{ x: number; y: number }, { x: number; y: number }];
  vanishingPoints: Array<{ x: number; y: number; label: string }>;
  rays: PerspectiveLine[];
  verticals: PerspectiveLine[];
};

export function calculatePerspective(
  width: number,
  height: number,
  config: PerspectiveConfig
): PerspectiveRenderData {
  const hy = height * config.horizonY;
  const horizonLine: [{ x: number; y: number }, { x: number; y: number }] = [
    { x: -width * 0.2, y: hy },
    { x: width * 1.2, y: hy },
  ];

  const vanishingPoints: Array<{ x: number; y: number; label: string }> = [];
  const rays: PerspectiveLine[] = [];
  const verticals: PerspectiveLine[] = [];

  const addRaysFromVP = (vp: { x: number; y: number }) => {
    // Generate radiating perspective rays from VP across the canvas boundaries
    const count = Math.max(4, config.rayCount);
    // Radiate along top, bottom, and side edges
    for (let i = 0; i <= count; i++) {
      const bottomX = (width * i) / count;
      rays.push({ p1: vp, p2: { x: bottomX, y: height } });
      const topX = (width * i) / count;
      rays.push({ p1: vp, p2: { x: topX, y: 0 } });
    }
    for (let i = 0; i <= count / 2; i++) {
      const sideY = (height * i) / (count / 2);
      rays.push({ p1: vp, p2: { x: 0, y: sideY } });
      rays.push({ p1: vp, p2: { x: width, y: sideY } });
    }
  };

  if (config.mode === "1-point") {
    const vp1 = { x: width * config.vp1X, y: hy };
    vanishingPoints.push({ ...vp1, label: "VP 1" });
    addRaysFromVP(vp1);

    // Orthogonal grid lines
    if (config.showVerticals) {
      const step = width / 8;
      for (let x = step; x < width; x += step) {
        verticals.push({ p1: { x, y: 0 }, p2: { x, y: height } });
      }
    }
  } else if (config.mode === "2-point") {
    const vp1 = { x: width * config.vp1X, y: hy };
    const vp2 = { x: width * config.vp2X, y: hy };
    vanishingPoints.push({ ...vp1, label: "VP Left" });
    vanishingPoints.push({ ...vp2, label: "VP Right" });

    addRaysFromVP(vp1);
    addRaysFromVP(vp2);

    if (config.showVerticals) {
      const step = width / 10;
      for (let x = step; x < width; x += step) {
        verticals.push({ p1: { x, y: 0 }, p2: { x, y: height } });
      }
    }
  } else if (config.mode === "3-point") {
    const vp1 = { x: width * config.vp1X, y: hy };
    const vp2 = { x: width * config.vp2X, y: hy };
    const vp3 = { x: width * 0.5, y: height * config.vp3Y };
    vanishingPoints.push({ ...vp1, label: "VP Left" });
    vanishingPoints.push({ ...vp2, label: "VP Right" });
    vanishingPoints.push({ ...vp3, label: config.vp3Y < 0.5 ? "Zenith (Sky)" : "Nadir (Ground)" });

    addRaysFromVP(vp1);
    addRaysFromVP(vp2);
    addRaysFromVP(vp3);
  }

  return { horizonLine, vanishingPoints, rays, verticals };
}

/**
 * Converts perspective guides into drawing strokes for canvas integration.
 */
export function convertPerspectiveToStrokes(
  canvasWidth: number,
  canvasHeight: number,
  config: PerspectiveConfig
): Stroke[] {
  const data = calculatePerspective(canvasWidth, canvasHeight, config);
  const strokes: Stroke[] = [];
  const makeId = () => `persp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  // Horizon Line
  strokes.push({
    id: makeId(),
    kind: "pencil",
    color: "#CB7857",
    width: 2.2,
    points: [data.horizonLine[0], data.horizonLine[1]],
  });

  // Perspective Rays
  data.rays.forEach((ray) => {
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: config.color,
      width: 1.0,
      points: [ray.p1, ray.p2],
    });
  });

  // Verticals
  data.verticals.forEach((v) => {
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: config.color,
      width: 1.0,
      points: [v.p1, v.p2],
    });
  });

  return strokes;
}
