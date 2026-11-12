/**
 * ARTISTRY AI — Practice Studio Types
 * Definitions for traditional drawing exercises, skill categories,
 * difficulty levels, timed sessions, and persistence records.
 */

export type PracticeCategory =
  | "basic_shapes"
  | "proportion"
  | "gesture"
  | "facial_construction"
  | "anatomy"
  | "perspective"
  | "light_shadow"
  | "contour";

export type PracticeDifficulty = "beginner" | "intermediate" | "advanced";

export type PracticeSessionStatus = "completed" | "in_progress" | "abandoned";

export interface PracticeExercise {
  id: string;
  title: string;
  category: PracticeCategory;
  difficulty: PracticeDifficulty;
  estimatedDurationMinutes: number;
  objective: string;
  requiredMaterials: string[];
  instructions: string[];
  recommendedOverlay?: "grid" | "loomis" | "perspective" | "contour" | "shading" | "proportions";
  completionCriteria: string;
  physicalPaperGuidance: string;
  selfAssessmentChecklist: string[];
}

export interface PracticeSessionRecord {
  id: string;
  exerciseId: string;
  category: PracticeCategory;
  difficulty: PracticeDifficulty;
  targetDurationMinutes: number;
  elapsedDurationSeconds: number;
  status: PracticeSessionStatus;
  notes?: string;
  selfAssessmentResults?: Record<string, boolean>;
  startedAt: number;
  completedAt?: number;
  createdAt: number;
}

export interface PracticeTimerState {
  targetDurationMinutes: number;
  accumulatedMs: number;
  startEpochMs: number | null;
  isRunning: boolean;
  isFinished: boolean;
}

export interface PracticeStats {
  totalSessions: number;
  completedCount: number;
  totalPracticeTimeMinutes: number;
  currentStreak: number;
}
