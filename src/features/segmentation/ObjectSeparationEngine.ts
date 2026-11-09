import { aiService } from "../../services/ai/AIServiceManager";
import type { SegmentationResult } from "../../services/ai/types";

export async function processObjectSeparation(
  imageUri: string,
  pixels?: Uint8Array | Float32Array | null,
  width: number = 800,
  height: number = 800
): Promise<SegmentationResult> {
  return aiService.segmentSubject(imageUri, pixels, width, height);
}
