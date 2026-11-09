import type { Stroke } from "../../domain/types";
import { aiService } from "../../services/ai/AIServiceManager";
import type { PoseLandmark, PoseResult } from "../../services/ai/types";
import { createId } from "../../storage/imageFiles";

export const POSE_PRESETS: Array<{ id: string; name: string; description: string }> = [
  { id: "standing_contrapposto", name: "Classic Contrapposto", description: "Weight shifted to one leg with counterbalanced hips and shoulders." },
  { id: "action_run", name: "Dynamic Sprint", description: "Extreme forward torso lean with high line-of-action curvature." },
  { id: "seated_gesture", name: "Relaxed Seated", description: "Curved spine with arms resting on knees." },
  { id: "combat_stance", name: "Defensive Boxing Stance", description: "Tucked chin, rounded upper back, lowered center of gravity." },
];

export async function detectPoseLandmarks(
  imageUri?: string,
  width: number = 800,
  height: number = 1000
): Promise<PoseResult> {
  return aiService.detectPose(imageUri, width, height);
}

export function convertPoseToStrokes(pose: PoseResult): Stroke[] {
  const strokes: Stroke[] = [];

  // Line of Action (curved spine guide in vibrant teal/cyan)
  const loaPoints: Array<{ x: number; y: number }> = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic Bézier curve formula: (1-t)^2 * P0 + 2*(1-t)*t * P1 + t^2 * P2
    const x =
      (1 - t) * (1 - t) * pose.lineOfAction.start.x +
      2 * (1 - t) * t * pose.lineOfAction.control.x +
      t * t * pose.lineOfAction.end.x;
    const y =
      (1 - t) * (1 - t) * pose.lineOfAction.start.y +
      2 * (1 - t) * t * pose.lineOfAction.control.y +
      t * t * pose.lineOfAction.end.y;
    loaPoints.push({ x, y });
  }

  strokes.push({
    id: createId(),
    kind: "pen",
    color: "#00ACC1",
    width: 3.5,
    points: loaPoints,
  });

  // Skeletal connections
  const connections: Array<[number, number]> = [
    [11, 12], // Shoulders
    [11, 13], [13, 15], // Left Arm
    [12, 14], [14, 16], // Right Arm
    [11, 23], [12, 24], // Torso sides
    [23, 24], // Pelvis / Hips
    [23, 25], [25, 27], // Left Leg
    [24, 26], [26, 28], // Right Leg
  ];

  const landmarkMap = new Map<number, PoseLandmark>();
  pose.landmarks.forEach((lm) => landmarkMap.set(lm.index, lm));

  connections.forEach(([i1, i2]) => {
    const p1 = landmarkMap.get(i1);
    const p2 = landmarkMap.get(i2);
    if (p1 && p2) {
      strokes.push({
        id: createId(),
        kind: "pencil",
        color: "#2C3E50",
        width: 3,
        points: [
          { x: p1.x, y: p1.y },
          { x: p2.x, y: p2.y },
        ],
      });
    }
  });

  // Head sphere
  const nose = landmarkMap.get(0);
  if (nose) {
    const r = 35;
    const circlePoints: Array<{ x: number; y: number }> = [];
    for (let a = 0; a <= 360; a += 15) {
      const rad = (a * Math.PI) / 180;
      circlePoints.push({ x: nose.x + Math.cos(rad) * r, y: nose.y + Math.sin(rad) * r });
    }
    strokes.push({
      id: createId(),
      kind: "pencil",
      color: "#E67E22",
      width: 2.5,
      points: circlePoints,
    });
  }

  return strokes;
}
