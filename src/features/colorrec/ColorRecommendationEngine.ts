import type { SavedPaletteRecord } from "../../domain/types";
import { aiService } from "../../services/ai/AIServiceManager";
import type { ColorPaletteRecommendation } from "../../services/ai/types";
import * as database from "../../storage/database";
import { createId } from "../../storage/imageFiles";

export async function generateColorRecommendations(
  dominantHexes: string[]
): Promise<ColorPaletteRecommendation> {
  return aiService.recommendColors(dominantHexes);
}

export async function persistPalette(name: string, colors: string[]): Promise<SavedPaletteRecord> {
  const record: SavedPaletteRecord = {
    id: createId(),
    name,
    colors,
    createdAt: Date.now(),
  };
  await database.savePalette(record);
  return record;
}

export async function fetchSavedPalettes(): Promise<SavedPaletteRecord[]> {
  return database.getSavedPalettes();
}

export async function removePalette(id: string): Promise<void> {
  return database.deletePalette(id);
}
