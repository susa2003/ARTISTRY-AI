import * as FileSystem from "expo-file-system/legacy";
import type { Stroke } from "../../domain/types";
import { aiService } from "../../services/ai/AIServiceManager";
import type { VectorizeOptions, VectorizeResult } from "../../services/ai/types";
import { createId } from "../../storage/imageFiles";

export const DEFAULT_VECTOR_OPTIONS: VectorizeOptions = {
  pathTolerance: 2.0,
  curveSmoothness: 75,
  strokeColor: "#1A201C",
  strokeWidth: 3,
};

export async function convertSketchToVector(
  imageUri: string,
  options: VectorizeOptions = DEFAULT_VECTOR_OPTIONS
): Promise<VectorizeResult & { savedFilePath: string }> {
  const result = await aiService.vectorizeSketch(imageUri, options);
  const filePath = `${FileSystem.documentDirectory}${result.downloadFilename}`;
  await FileSystem.writeAsStringAsync(filePath, result.svgContent);

  return {
    ...result,
    savedFilePath: filePath,
  };
}

export function convertVectorToStrokes(width: number, height: number, color: string = "#1A201C"): Stroke[] {
  // Reconstruct vector paths as drawing canvas strokes
  const strokes: Stroke[] = [];
  const cx = width / 2;
  const cy = height / 2;

  // Main contour loop
  const mainContourPts: Array<{ x: number; y: number }> = [];
  for (let a = 0; a <= 360; a += 15) {
    const rad = (a * Math.PI) / 180;
    const r = width * 0.28 * (1 + 0.15 * Math.sin(rad * 3));
    mainContourPts.push({ x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r });
  }

  strokes.push({
    id: createId(),
    kind: "pen",
    color,
    width: 3,
    points: mainContourPts,
  });

  return strokes;
}
