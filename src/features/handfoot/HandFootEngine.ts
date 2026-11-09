import type { Stroke } from "../../domain/types";
import { aiService } from "../../services/ai/AIServiceManager";
import type { HandFootResult, HandFootType, HandLandmark } from "../../services/ai/types";
import { createId } from "../../storage/imageFiles";

export async function analyzeHandOrFoot(
  type: HandFootType,
  imageUri?: string,
  width: number = 800,
  height: number = 800
): Promise<HandFootResult> {
  return aiService.analyzeHandFoot(type, imageUri, width, height);
}

export function convertHandFootToStrokes(result: HandFootResult): Stroke[] {
  const strokes: Stroke[] = [];
  const lmMap = new Map<number, HandLandmark>();
  result.landmarks.forEach((lm) => lmMap.set(lm.index, lm));

  if (result.type === "hand") {
    // Palm Bounding Trapezoid
    const pb = result.palmBoundingBox;
    strokes.push({
      id: createId(),
      kind: "pencil",
      color: "#2C3E50",
      width: 3,
      points: [
        { x: pb.x, y: pb.y },
        { x: pb.x + pb.width, y: pb.y },
        { x: pb.x + pb.width * 0.85, y: pb.y + pb.height },
        { x: pb.x + pb.width * 0.15, y: pb.y + pb.height },
        { x: pb.x, y: pb.y },
      ],
    });

    // 5 Finger Chains
    const fingerChains = [
      [0, 1, 2, 3, 4],    // Thumb
      [5, 6, 7, 8],       // Index
      [9, 10, 11, 12],    // Middle
      [13, 14, 15, 16],   // Ring
      [17, 18, 19, 20],   // Pinky
    ];

    fingerChains.forEach((chain, idx) => {
      const pts: Array<{ x: number; y: number }> = [];
      chain.forEach((i) => {
        const p = lmMap.get(i);
        if (p) pts.push({ x: p.x, y: p.y });
      });
      if (pts.length > 1) {
        strokes.push({
          id: createId(),
          kind: "pen",
          color: idx === 2 ? "#E67E22" : "#34495E", // Highlight middle finger dominance
          width: 2.5,
          points: pts,
        });
      }
    });

    // Knuckle Arch Line
    const knuckles = [lmMap.get(5), lmMap.get(9), lmMap.get(13), lmMap.get(17)].filter(Boolean) as HandLandmark[];
    if (knuckles.length > 1) {
      strokes.push({
        id: createId(),
        kind: "pencil",
        color: "#E74C3C",
        width: 2,
        points: knuckles.map((k) => ({ x: k.x, y: k.y })),
      });
    }
  } else {
    // Foot Wedge Construction
    const pts = result.landmarks.map((l) => ({ x: l.x, y: l.y }));
    if (pts.length > 1) {
      strokes.push({
        id: createId(),
        kind: "pencil",
        color: "#2C3E50",
        width: 3,
        points: pts,
      });
    }
  }

  return strokes;
}
