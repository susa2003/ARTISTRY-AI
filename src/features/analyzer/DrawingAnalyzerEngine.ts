import type { DrawingAnalysisRecord } from "../../domain/types";
import { aiService } from "../../services/ai/AIServiceManager";
import type { DrawingAnalysisRequest, DrawingAnalysisResult } from "../../services/ai/types";
import * as database from "../../storage/database";
import { createId } from "../../storage/imageFiles";

export async function runDrawingAnalysis(
  request: DrawingAnalysisRequest,
  projectId?: string
): Promise<DrawingAnalysisRecord> {
  const result: DrawingAnalysisResult = await aiService.analyzeDrawing(request);

  const record: DrawingAnalysisRecord = {
    id: createId(),
    projectId: projectId ?? null,
    timestamp: Date.now(),
    overallScore: result.overallScore,
    proportionsScore: result.proportionsScore,
    alignmentScore: result.alignmentScore,
    perspectiveScore: result.perspectiveScore,
    compositionScore: result.compositionScore,
    shadingScore: result.shadingScore,
    feedback: result.feedback,
    annotations: result.annotations,
  };

  // Persist to local SQLite
  await database.saveDrawingAnalysis(record);

  return record;
}

export async function fetchAnalysisHistory(projectId?: string): Promise<DrawingAnalysisRecord[]> {
  if (projectId) {
    return database.getDrawingAnalysesByProject(projectId);
  }
  return database.getDrawingAnalyses();
}
