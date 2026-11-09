import { aiService } from "../../services/ai/AIServiceManager";
import type { MultiAngleResult } from "../../services/ai/types";

export async function generateCharacterTurnaround(
  category: string = "character",
  subjectType: string = "humanoid"
): Promise<MultiAngleResult> {
  return aiService.generateTurnaround(category, subjectType);
}
