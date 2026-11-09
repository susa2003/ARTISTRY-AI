import type { Stroke } from "../../domain/types";
import { aiService } from "../../services/ai/AIServiceManager";
import type { LightingResult } from "../../services/ai/types";
import { createId } from "../../storage/imageFiles";

export async function detectLighting(
  imageUri?: string,
  pixels?: Uint8Array | Float32Array | null,
  width: number = 800,
  height: number = 800
): Promise<LightingResult> {
  return aiService.predictLighting(imageUri, pixels, width, height);
}

export function convertLightingToStrokes(lighting: LightingResult, width: number, height: number): Stroke[] {
  const strokes: Stroke[] = [];
  const cx = width / 2;
  const cy = height / 2;
  const rad = (lighting.primaryLightAngle * Math.PI) / 180;

  // 3D Directional Light Ray Arrow pointing toward center
  const arrowLen = 140;
  const arrowStartX = cx - Math.cos(rad) * (arrowLen + 60);
  const arrowStartY = cy - Math.sin(rad) * (arrowLen + 60);
  const arrowEndX = cx - Math.cos(rad) * 60;
  const arrowEndY = cy - Math.sin(rad) * 60;

  strokes.push({
    id: createId(),
    kind: "pen",
    color: "#F39C12",
    width: 3.5,
    points: [
      { x: arrowStartX, y: arrowStartY },
      { x: arrowEndX, y: arrowEndY },
    ],
  });

  // Arrowhead barb 1 & 2
  const headAngle = Math.PI / 6;
  const barbLen = 22;
  strokes.push({
    id: createId(),
    kind: "pen",
    color: "#F39C12",
    width: 3,
    points: [
      { x: arrowEndX - Math.cos(rad - headAngle) * barbLen, y: arrowEndY - Math.sin(rad - headAngle) * barbLen },
      { x: arrowEndX, y: arrowEndY },
      { x: arrowEndX - Math.cos(rad + headAngle) * barbLen, y: arrowEndY - Math.sin(rad + headAngle) * barbLen },
    ],
  });

  // Highlight Circle Zone
  lighting.highlightZones.forEach((hz) => {
    const pts: Array<{ x: number; y: number }> = [];
    for (let a = 0; a <= 360; a += 20) {
      const r = (a * Math.PI) / 180;
      pts.push({ x: hz.x + Math.cos(r) * hz.radius, y: hz.y + Math.sin(r) * hz.radius });
    }
    strokes.push({
      id: createId(),
      kind: "pencil",
      color: "#F1C40F",
      width: 2,
      points: pts,
    });
  });

  // Core Shadow Terminator Arc
  lighting.coreShadowZones.forEach((sz) => {
    const pts: Array<{ x: number; y: number }> = [];
    for (let a = 0; a <= 180; a += 15) {
      const r = ((lighting.primaryLightAngle + 90 + a) * Math.PI) / 180;
      pts.push({ x: sz.x + Math.cos(r) * sz.radius, y: sz.y + Math.sin(r) * sz.radius });
    }
    strokes.push({
      id: createId(),
      kind: "pencil",
      color: "#2C3E50",
      width: 3,
      points: pts,
    });
  });

  return strokes;
}
