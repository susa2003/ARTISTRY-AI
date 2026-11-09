import type { GeneratedReferenceRecord } from "../../domain/types";
import { aiService } from "../../services/ai/AIServiceManager";
import type { ReferenceCategory, ReferenceGenerateOptions, ReferenceGenerateResult } from "../../services/ai/types";
import * as database from "../../storage/database";
import { createId } from "../../storage/imageFiles";

export const REFERENCE_CATEGORIES: Array<{ id: ReferenceCategory; label: string; icon: string }> = [
  { id: "portraits", label: "Portraits", icon: "user" },
  { id: "anime", label: "Anime & Manga", icon: "smile" },
  { id: "anatomy", label: "Figure Anatomy", icon: "activity" },
  { id: "handsfeet", label: "Hands & Feet", icon: "hand" },
  { id: "animals", label: "Animals & Wildlife", icon: "feather" },
  { id: "stilllife", label: "Still Life", icon: "coffee" },
  { id: "landscapes", label: "Landscapes & Nature", icon: "sun" },
  { id: "architecture", label: "Architecture", icon: "home" },
  { id: "vehicles", label: "Vehicles & Tech", icon: "truck" },
  { id: "objects", label: "Props & Objects", icon: "box" },
  { id: "flowers", label: "Botanicals & Flora", icon: "heart" },
];

export async function requestReferenceGeneration(
  options: ReferenceGenerateOptions
): Promise<GeneratedReferenceRecord> {
  const result: ReferenceGenerateResult = await aiService.generateReference(options);

  const record: GeneratedReferenceRecord = {
    id: createId(),
    prompt: options.prompt,
    category: options.category,
    style: options.style,
    pose: options.pose ?? "neutral",
    lighting: options.lighting ?? "front",
    uri: result.uri,
    createdAt: Date.now(),
  };

  await database.saveGeneratedReference(record);
  return record;
}

export async function fetchGeneratedReferences(): Promise<GeneratedReferenceRecord[]> {
  return database.getGeneratedReferences();
}

export async function removeGeneratedReference(id: string): Promise<void> {
  return database.deleteGeneratedReference(id);
}
