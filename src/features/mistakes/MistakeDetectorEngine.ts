import { aiService } from "../../services/ai/AIServiceManager";
import type { MistakeDetectionResult } from "../../services/ai/types";

export async function detectDrawingMistakes(
  drawingUri?: string,
  referenceUri?: string,
  pixels?: Uint8Array | Float32Array | null,
  width: number = 800,
  height: number = 800
): Promise<MistakeDetectionResult> {
  return aiService.detectMistakes(drawingUri, referenceUri, pixels, width, height);
}
