import { aiService } from "../../services/ai/AIServiceManager";
import type { LineArtCleanOptions } from "../../services/ai/types";

export const DEFAULT_LINE_CLEAN_OPTIONS: LineArtCleanOptions = {
  threshold: 160,
  smoothing: 3,
  removeNoise: true,
  enhanceEdges: true,
};

export async function processLineArtCleaning(
  imageUri: string,
  options: LineArtCleanOptions = DEFAULT_LINE_CLEAN_OPTIONS
): Promise<string> {
  return aiService.cleanLineArt(imageUri, options);
}
