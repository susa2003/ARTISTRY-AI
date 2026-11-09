import type { Stroke, StrokePoint } from "../../domain/types";

export type LoomisParams = {
  centerX: number;       // Cranium center X (0 to 1 normalized to canvas width)
  centerY: number;       // Cranium center Y (0 to 1 normalized to canvas height)
  radius: number;        // Cranium sphere radius (normalized to canvas width)
  yaw: number;           // Head rotation (-60 to +60 degrees, 0 = frontal)
  pitch: number;         // Head tilt up/down (-45 to +45 degrees, 0 = level)
  roll: number;          // Head tilt left/right (-30 to +30 degrees, 0 = vertical)
  jawLength: number;     // Multiplier for chin length (default 1.0)
};

export type LoomisStageInfo = {
  stage: number;
  title: string;
  subtitle: string;
  description: string;
  instruction: string;
  color: string;
};

export const LOOMIS_STAGES: LoomisStageInfo[] = [
  {
    stage: 1,
    title: "1. Cranium Sphere",
    subtitle: "The Primary Ball of the Head",
    description: "The cranium is essentially a sphere. Establish its overall scale and position first.",
    instruction: "Place the circle over the top and back of the head. Adjust the radius to fit the cranial mass.",
    color: "#28594B", // Forest green
  },
  {
    stage: 2,
    title: "2. Brow Axis & Centerline",
    subtitle: "Establishing Head Angle & Tilt",
    description: "The brow line is the sphere's equator; the centerline drops vertically from crown to chin.",
    instruction: "Rotate yaw to match where the subject looks, and pitch to match chin tilt up or down.",
    color: "#CB7857", // Terracotta
  },
  {
    stage: 3,
    title: "3. Side Plane Disc",
    subtitle: "The Flattened Temple Plane",
    description: "The human head is flattened on the sides. Slice off an elliptical disc from temple to ear.",
    instruction: "The disc diameter is roughly 2/3 the cranium height. The ear attaches inside its lower rear quadrant.",
    color: "#D5A844", // Warm gold
  },
  {
    stage: 4,
    title: "4. Jawline Construction",
    subtitle: "Dropping the Jaw Wedge",
    description: "From the center of the side plane and the brow, drop the angle of the jaw down to the chin wedge.",
    instruction: "Follow the jaw contour from below the ear to the chin point at the base of the lower third.",
    color: "#596A94", // Slate blue
  },
  {
    stage: 5,
    title: "5. Facial Thirds Division",
    subtitle: "The Classic Proportions",
    description: "The face divides into three equal bands: Hairline to Brow, Brow to Nose Base, and Nose Base to Chin.",
    instruction: "Check these three measurements along the curved centerline before adding any facial features.",
    color: "#8B4F69", // Berry/Wine
  },
  {
    stage: 6,
    title: "6. Feature Placement",
    subtitle: "Eye Sockets, Nose, Mouth & Ears",
    description: "Block in the keystones: eye socket cavities, nose pyramid wedge, mouth barrel, and ear attachment.",
    instruction: "Eyes sit on the brow equator line; ears align between the brow line and the base of the nose.",
    color: "#1C211D", // Charcoal
  },
  {
    stage: 7,
    title: "7. Planes of the Face",
    subtitle: "Cheekbones & Temporal Facets",
    description: "Carve the structural facets: zygomatic arches, forehead planes, and the chin box.",
    instruction: "These planes create the architectural foundation needed to shade form accurately.",
    color: "#3B7A57", // Deep sage
  },
  {
    stage: 8,
    title: "8. Planar Tonal Mapping",
    subtitle: "Core Shadow & Light Boundaries",
    description: "Separate the light planes from the shadow planes along the primary terminator line.",
    instruction: "Group the side and underneath planes into shadow to give the head immediate 3D volume.",
    color: "#17201C", // Ink dark
  },
];

export const DEFAULT_LOOMIS_PARAMS: LoomisParams = {
  centerX: 0.50,
  centerY: 0.42,
  radius: 0.26,
  yaw: 12,
  pitch: 4,
  roll: -3,
  jawLength: 1.0,
};

type Point2D = { x: number; y: number };

function rotatePoint(p: Point2D, center: Point2D, angleRad: number): Point2D {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export type LoomisRenderData = {
  craniumCircle: { cx: number; cy: number; r: number };
  centerAxis: Point2D[];
  browAxis: Point2D[];
  sideDisc: { cx: number; cy: number; rx: number; ry: number; rotation: number };
  sideDiscCrossAxes: { horizontal: [Point2D, Point2D]; vertical: [Point2D, Point2D] };
  jawContour: Point2D[];
  facialThirdsLines: Array<{ label: string; line: [Point2D, Point2D]; point: Point2D }>;
  featureBlockIn: {
    eyeLine: [Point2D, Point2D];
    leftEyeSocket: Point2D[];
    rightEyeSocket: Point2D[];
    nosePyramid: Point2D[];
    mouthLine: [Point2D, Point2D];
    earContour: Point2D[];
  };
  facePlanes: Array<{ name: string; polygon: Point2D[] }>;
  shadowPlanes: Array<{ polygon: Point2D[]; opacity: number }>;
};

/**
 * Calculates complete 3D geometric construction points for the 8-stage Loomis method.
 */
export function calculateLoomisGeometry(
  params: LoomisParams,
  width: number,
  height: number
): LoomisRenderData {
  const cx = params.centerX * width;
  const cy = params.centerY * height;
  const r = params.radius * Math.min(width, height);
  const yawRad = (params.yaw * Math.PI) / 180;
  const pitchRad = (params.pitch * Math.PI) / 180;
  const rollRad = (params.roll * Math.PI) / 180;
  const center: Point2D = { x: cx, y: cy };

  // --- Stage 1 & 2: Cranium Sphere & Axes ---
  // The vertical centerline curves across the front of the sphere based on yaw
  // Offset of the front vertical centerline from the sphere center
  const centerLineXOffset = Math.sin(yawRad) * r * 0.75;
  const browYOffset = Math.sin(pitchRad) * r * 0.55;

  // Brow line curve across the sphere
  const browSteps = 16;
  const browAxis: Point2D[] = [];
  for (let i = 0; i <= browSteps; i++) {
    const t = (i / browSteps) * 2 - 1; // -1 to 1
    const xRaw = cx + t * r;
    // Spherical sag according to pitch
    const sag = (1 - t * t) * Math.sin(pitchRad) * r * 0.35;
    const yRaw = cy + browYOffset + sag;
    browAxis.push(rotatePoint({ x: xRaw, y: yRaw }, center, rollRad));
  }

  // Vertical Centerline dropping from top of cranium past the chin
  const centerSteps = 24;
  const centerAxis: Point2D[] = [];
  const chinY = cy + r * (1.35 * params.jawLength) + Math.sin(pitchRad) * r * 0.4;
  const topY = cy - r;
  for (let i = 0; i <= centerSteps; i++) {
    const t = i / centerSteps; // 0 (top) to 1 (chin)
    const yRaw = topY + t * (chinY - topY);
    // Spherical curve from yaw
    let xOffset = centerLineXOffset;
    if (t < 0.6) {
      // Curve over cranium sphere
      const sphereT = (t - 0.3) / 0.3;
      xOffset = centerLineXOffset * (1 - 0.25 * (sphereT * sphereT));
    } else {
      // Straightens into the chin
      xOffset = centerLineXOffset * (1 - 0.15 * (t - 0.6));
    }
    centerAxis.push(rotatePoint({ x: cx + xOffset, y: yRaw }, center, rollRad));
  }

  // --- Stage 3: Side Plane Flattened Disc ---
  // The side plane disc is located opposite the turn of the face
  const sideSign = params.yaw >= 0 ? -1 : 1;
  const sideDiscDist = r * 0.52 * Math.cos(yawRad);
  const sideCx = cx + sideSign * sideDiscDist;
  const sideCy = cy + browYOffset * 0.6;
  const sideRx = Math.max(r * 0.12, r * 0.68 * Math.abs(Math.sin(yawRad) * 0.4 + 0.65));
  const sideRy = r * 0.68;

  const sideDiscCenter = rotatePoint({ x: sideCx, y: sideCy }, center, rollRad);

  const sideDiscCrossAxes = {
    horizontal: [
      rotatePoint({ x: sideCx - sideRx, y: sideCy }, center, rollRad),
      rotatePoint({ x: sideCx + sideRx, y: sideCy }, center, rollRad),
    ] as [Point2D, Point2D],
    vertical: [
      rotatePoint({ x: sideCx, y: sideCy - sideRy }, center, rollRad),
      rotatePoint({ x: sideCx, y: sideCy + sideRy }, center, rollRad),
    ] as [Point2D, Point2D],
  };

  // --- Stage 4: Jawline Construction ---
  // Jaw drops from side disc vertical axis through the ear angle to the chin
  const earJawStart = rotatePoint({ x: sideCx, y: sideCy + sideRy * 0.2 }, center, rollRad);
  const jawAngle = rotatePoint({ x: sideCx - sideSign * sideRx * 0.3, y: sideCy + sideRy * 0.8 }, center, rollRad);
  const chinCenter = centerAxis[centerAxis.length - 1] ?? { x: cx, y: chinY };
  const chinLeft = rotatePoint({ x: chinCenter.x - r * 0.18, y: chinCenter.y }, chinCenter, rollRad);
  const chinRight = rotatePoint({ x: chinCenter.x + r * 0.18, y: chinCenter.y }, chinCenter, rollRad);

  // Opposite jaw side contour
  const oppJawTop = rotatePoint({ x: cx - sideSign * r * 0.88, y: cy + browYOffset + r * 0.2 }, center, rollRad);
  const oppJawMid = rotatePoint({ x: cx - sideSign * r * 0.75, y: cy + browYOffset + r * 0.65 }, center, rollRad);

  const jawContour: Point2D[] = [
    earJawStart,
    jawAngle,
    chinLeft,
    chinCenter,
    chinRight,
    oppJawMid,
    oppJawTop,
  ];

  // --- Stage 5: Facial Thirds Division ---
  // 1. Hairline (~cy - r * 0.35)
  // 2. Brow line (~cy + browYOffset)
  // 3. Nose base line (~cy + browYOffset + r * 0.55 * params.jawLength)
  // 4. Chin base line (chinCenter.y)
  const hairlineY = cy - r * 0.38 + browYOffset * 0.3;
  const browY = cy + browYOffset;
  const noseBaseY = cy + browYOffset + r * 0.58 * params.jawLength;

  const makeThirdLine = (yVal: number, label: string) => {
    const pt = rotatePoint({ x: cx + centerLineXOffset, y: yVal }, center, rollRad);
    const left = rotatePoint({ x: cx - r * 0.8, y: yVal }, center, rollRad);
    const right = rotatePoint({ x: cx + r * 0.8, y: yVal }, center, rollRad);
    return { label, line: [left, right] as [Point2D, Point2D], point: pt };
  };

  const facialThirdsLines = [
    makeThirdLine(hairlineY, "Hairline (1/3)"),
    makeThirdLine(browY, "Brow line (2/3)"),
    makeThirdLine(noseBaseY, "Nose base (3/3)"),
    { label: "Chin line", line: [chinLeft, chinRight] as [Point2D, Point2D], point: chinCenter },
  ];

  // --- Stage 6: Feature Block-In ---
  const eyeLineY = browY + r * 0.14;
  const eyeLine: [Point2D, Point2D] = [
    rotatePoint({ x: cx - r * 0.75, y: eyeLineY }, center, rollRad),
    rotatePoint({ x: cx + r * 0.75, y: eyeLineY }, center, rollRad),
  ];

  // Eye sockets
  const eyeDist = r * 0.32;
  const eyeWidth = r * 0.22;
  const eyeHeight = r * 0.14;
  const leftEyeCenter = rotatePoint({ x: cx + centerLineXOffset - eyeDist, y: eyeLineY }, center, rollRad);
  const rightEyeCenter = rotatePoint({ x: cx + centerLineXOffset + eyeDist * 0.8, y: eyeLineY }, center, rollRad);

  const makeSocket = (c: Point2D) => [
    rotatePoint({ x: c.x - eyeWidth / 2, y: c.y - eyeHeight / 2 }, c, rollRad),
    rotatePoint({ x: c.x + eyeWidth / 2, y: c.y - eyeHeight / 2 }, c, rollRad),
    rotatePoint({ x: c.x + eyeWidth / 2, y: c.y + eyeHeight / 2 }, c, rollRad),
    rotatePoint({ x: c.x - eyeWidth / 2, y: c.y + eyeHeight / 2 }, c, rollRad),
  ];

  // Nose pyramid
  const keystoneTop = rotatePoint({ x: cx + centerLineXOffset, y: browY }, center, rollRad);
  const noseBottom = rotatePoint({ x: cx + centerLineXOffset, y: noseBaseY }, center, rollRad);
  const noseLeft = rotatePoint({ x: cx + centerLineXOffset - r * 0.16, y: noseBaseY - r * 0.05 }, center, rollRad);
  const noseRight = rotatePoint({ x: cx + centerLineXOffset + r * 0.16, y: noseBaseY - r * 0.05 }, center, rollRad);
  const nosePyramid = [keystoneTop, noseRight, noseBottom, noseLeft, keystoneTop];

  // Mouth line (1/3 down between nose and chin)
  const mouthY = noseBaseY + (chinY - noseBaseY) * 0.33;
  const mouthWidth = r * 0.38;
  const mouthLine: [Point2D, Point2D] = [
    rotatePoint({ x: cx + centerLineXOffset - mouthWidth / 2, y: mouthY }, center, rollRad),
    rotatePoint({ x: cx + centerLineXOffset + mouthWidth / 2, y: mouthY }, center, rollRad),
  ];

  // Ear placement (anchored at side disc, from brow to nose level)
  const earTop = rotatePoint({ x: sideCx + sideSign * sideRx * 0.1, y: browY }, center, rollRad);
  const earBottom = rotatePoint({ x: sideCx + sideSign * sideRx * 0.2, y: noseBaseY }, center, rollRad);
  const earOuter = rotatePoint({ x: sideCx - sideSign * sideRx * 0.3, y: (browY + noseBaseY) / 2 }, center, rollRad);
  const earContour = [earTop, earOuter, earBottom];

  // --- Stage 7: Planes of the Face ---
  const cheekLeft = rotatePoint({ x: cx + centerLineXOffset - r * 0.55, y: eyeLineY + r * 0.22 }, center, rollRad);
  const cheekRight = rotatePoint({ x: cx + centerLineXOffset + r * 0.55, y: eyeLineY + r * 0.22 }, center, rollRad);

  const facePlanes = [
    { name: "Forehead", polygon: [makeThirdLine(hairlineY, "").line[0], makeThirdLine(hairlineY, "").line[1], makeThirdLine(browY, "").line[1], makeThirdLine(browY, "").line[0]] },
    { name: "Cheek Left", polygon: [leftEyeCenter, cheekLeft, noseLeft] },
    { name: "Cheek Right", polygon: [rightEyeCenter, cheekRight, noseRight] },
    { name: "Chin Pad", polygon: [noseBottom, chinLeft, chinRight] },
  ];

  // --- Stage 8: Shadow / Light Planes ---
  // Simulates shadow terminator across side plane and under jaw
  const shadowSide = sideSign > 0 ? "right" : "left";
  const shadowPlanes = [
    {
      polygon: [earTop, earBottom, jawAngle, earJawStart],
      opacity: 0.25,
    },
    {
      polygon: [noseBottom, mouthLine[0], mouthLine[1]],
      opacity: 0.18,
    },
    {
      polygon: [chinLeft, chinRight, { x: chinCenter.x, y: chinCenter.y + r * 0.12 }],
      opacity: 0.30,
    },
  ];

  return {
    craniumCircle: { cx, cy, r },
    centerAxis,
    browAxis,
    sideDisc: {
      cx: sideDiscCenter.x,
      cy: sideDiscCenter.y,
      rx: sideRx,
      ry: sideRy,
      rotation: rollRad,
    },
    sideDiscCrossAxes,
    jawContour,
    facialThirdsLines,
    featureBlockIn: {
      eyeLine,
      leftEyeSocket: makeSocket(leftEyeCenter),
      rightEyeSocket: makeSocket(rightEyeCenter),
      nosePyramid,
      mouthLine,
      earContour,
    },
    facePlanes,
    shadowPlanes,
  };
}

/**
 * Converts Loomis geometry for any stage into real drawing Stroke objects
 * so they can be saved as an actual layer in the user's project.
 */
export function convertLoomisToStrokes(
  params: LoomisParams,
  upToStage: number,
  canvasWidth: number,
  canvasHeight: number
): Stroke[] {
  const geo = calculateLoomisGeometry(params, canvasWidth, canvasHeight);
  const strokes: Stroke[] = [];
  const makeId = () => `loomis-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  // Stage 1: Cranium Circle
  if (upToStage >= 1) {
    const circlePoints: StrokePoint[] = [];
    const steps = 36;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      circlePoints.push({
        x: geo.craniumCircle.cx + Math.cos(angle) * geo.craniumCircle.r,
        y: geo.craniumCircle.cy + Math.sin(angle) * geo.craniumCircle.r,
      });
    }
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: "#28594B",
      width: 2.8,
      points: circlePoints,
    });
  }

  // Stage 2: Axes
  if (upToStage >= 2) {
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: "#CB7857",
      width: 2.2,
      points: geo.centerAxis.map((p) => ({ x: p.x, y: p.y })),
    });
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: "#CB7857",
      width: 2.2,
      points: geo.browAxis.map((p) => ({ x: p.x, y: p.y })),
    });
  }

  // Stage 3: Side Disc
  if (upToStage >= 3) {
    const discPoints: StrokePoint[] = [];
    const steps = 32;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const rawX = geo.sideDisc.cx + Math.cos(angle) * geo.sideDisc.rx;
      const rawY = geo.sideDisc.cy + Math.sin(angle) * geo.sideDisc.ry;
      discPoints.push({ x: rawX, y: rawY });
    }
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: "#D5A844",
      width: 2.0,
      points: discPoints,
    });
    // Cross axes
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: "#D5A844",
      width: 1.6,
      points: geo.sideDiscCrossAxes.horizontal.map((p) => ({ x: p.x, y: p.y })),
    });
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: "#D5A844",
      width: 1.6,
      points: geo.sideDiscCrossAxes.vertical.map((p) => ({ x: p.x, y: p.y })),
    });
  }

  // Stage 4: Jawline
  if (upToStage >= 4) {
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: "#596A94",
      width: 2.6,
      points: geo.jawContour.map((p) => ({ x: p.x, y: p.y })),
    });
  }

  // Stage 5: Facial Thirds
  if (upToStage >= 5) {
    geo.facialThirdsLines.forEach((item) => {
      strokes.push({
        id: makeId(),
        kind: "pencil",
        color: "#8B4F69",
        width: 1.8,
        points: item.line.map((p) => ({ x: p.x, y: p.y })),
      });
    });
  }

  // Stage 6: Feature Block-In
  if (upToStage >= 6) {
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: "#1C211D",
      width: 1.8,
      points: geo.featureBlockIn.eyeLine.map((p) => ({ x: p.x, y: p.y })),
    });
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: "#1C211D",
      width: 2.0,
      points: geo.featureBlockIn.leftEyeSocket.concat(geo.featureBlockIn.leftEyeSocket[0]!).map((p) => ({ x: p.x, y: p.y })),
    });
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: "#1C211D",
      width: 2.0,
      points: geo.featureBlockIn.rightEyeSocket.concat(geo.featureBlockIn.rightEyeSocket[0]!).map((p) => ({ x: p.x, y: p.y })),
    });
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: "#1C211D",
      width: 2.2,
      points: geo.featureBlockIn.nosePyramid.map((p) => ({ x: p.x, y: p.y })),
    });
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: "#1C211D",
      width: 2.2,
      points: geo.featureBlockIn.mouthLine.map((p) => ({ x: p.x, y: p.y })),
    });
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: "#1C211D",
      width: 2.0,
      points: geo.featureBlockIn.earContour.map((p) => ({ x: p.x, y: p.y })),
    });
  }

  // Stage 7: Face Planes
  if (upToStage >= 7) {
    geo.facePlanes.forEach((plane) => {
      strokes.push({
        id: makeId(),
        kind: "pencil",
        color: "#3B7A57",
        width: 1.6,
        points: plane.polygon.concat(plane.polygon[0]!).map((p) => ({ x: p.x, y: p.y })),
      });
    });
  }

  // Stage 8: Planar Tonal Boundaries
  if (upToStage >= 8) {
    geo.shadowPlanes.forEach((shadow) => {
      strokes.push({
        id: makeId(),
        kind: "pencil",
        color: "#17201C",
        width: 2.4,
        points: shadow.polygon.concat(shadow.polygon[0]!).map((p) => ({ x: p.x, y: p.y })),
      });
    });
  }

  return strokes;
}
