import type { Stroke } from "../../domain/types";
import { aiService } from "../../services/ai/AIServiceManager";
import type { CompositionResult } from "../../services/ai/types";
import { createId } from "../../storage/imageFiles";

export async function analyzeCompositionFidelity(
  imageUri?: string,
  pixels?: Uint8Array | Float32Array | null,
  width: number = 800,
  height: number = 800
): Promise<CompositionResult> {
  return aiService.analyzeComposition(imageUri, pixels, width, height);
}

export function convertCompositionToStrokes(
  width: number,
  height: number,
  mode: "thirds" | "golden_spiral" | "diagonal" = "thirds"
): Stroke[] {
  const strokes: Stroke[] = [];

  if (mode === "thirds") {
    // 2 horizontal and 2 vertical Rule-of-Thirds lines
    const x1 = width / 3;
    const x2 = (2 * width) / 3;
    const y1 = height / 3;
    const y2 = (2 * height) / 3;

    strokes.push({
      id: createId(),
      kind: "pencil",
      color: "#3498DB",
      width: 2,
      points: [{ x: x1, y: 0 }, { x: x1, y: height }],
    });
    strokes.push({
      id: createId(),
      kind: "pencil",
      color: "#3498DB",
      width: 2,
      points: [{ x: x2, y: 0 }, { x: x2, y: height }],
    });
    strokes.push({
      id: createId(),
      kind: "pencil",
      color: "#3498DB",
      width: 2,
      points: [{ x: 0, y: y1 }, { x: width, y: y1 }],
    });
    strokes.push({
      id: createId(),
      kind: "pencil",
      color: "#3498DB",
      width: 2,
      points: [{ x: 0, y: y2 }, { x: width, y: y2 }],
    });

    // 4 Power Point circles
    const powerPoints = [
      { x: x1, y: y1 }, { x: x2, y: y1 },
      { x: x1, y: y2 }, { x: x2, y: y2 },
    ];
    powerPoints.forEach((pp) => {
      const circlePts: Array<{ x: number; y: number }> = [];
      for (let a = 0; a <= 360; a += 30) {
        const rad = (a * Math.PI) / 180;
        circlePts.push({ x: pp.x + Math.cos(rad) * 12, y: pp.y + Math.sin(rad) * 12 });
      }
      strokes.push({
        id: createId(),
        kind: "pen",
        color: "#E74C3C",
        width: 2.5,
        points: circlePts,
      });
    });
  } else if (mode === "golden_spiral") {
    // Golden ratio logarithmic spiral approximation
    const pts: Array<{ x: number; y: number }> = [];
    const phi = 1.61803398875;
    const steps = 60;
    const maxTheta = 4 * Math.PI;
    const a = 8;
    const b = Math.log(phi) / (Math.PI / 2);
    const originX = width * 0.618;
    const originY = height * 0.618;

    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * maxTheta;
      const r = a * Math.exp(b * theta);
      pts.push({
        x: originX + r * Math.cos(theta),
        y: originY + r * Math.sin(theta),
      });
    }

    strokes.push({
      id: createId(),
      kind: "pen",
      color: "#D4AC0D",
      width: 2.5,
      points: pts,
    });
  }

  return strokes;
}
