import * as SQLite from "expo-sqlite";
import type { SavedDrawingComparisonRecord } from "../features/comparison/types";
import type { SavedReferenceAnalysisRecord } from "../features/assistant/types";
import type { PracticeSessionRecord } from "../features/practice/types";
import type {
  DrawingAnalysisRecord,
  DrawingLayer,
  ExperienceMode,
  GeneratedReferenceRecord,
  ImageAdjustmentSettings,
  LocalReference,
  PaperOrientation,
  PaperSettings,
  PaperSize,
  ProjectDocument,
  ProjectSummary,
  SavedPaletteRecord,
  StrokeReplayRecord,
  UnifiedOverlay,
} from "../domain/types";
import { DEFAULT_IMAGE_ADJUSTMENTS, DEFAULT_PAPER_SETTINGS } from "../domain/types";

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

async function database() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync("artistry-ai.db");
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          width INTEGER NOT NULL,
          height INTEGER NOT NULL,
          layers_json TEXT NOT NULL,
          active_layer_id TEXT NOT NULL,
          reference_uri TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS references_local (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          uri TEXT NOT NULL,
          original_uri TEXT NOT NULL,
          width INTEGER NOT NULL,
          height INTEGER NOT NULL,
          is_edited INTEGER NOT NULL DEFAULT 0,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS app_metadata (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lesson_progress (
          lesson_id TEXT PRIMARY KEY NOT NULL,
          completed INTEGER NOT NULL DEFAULT 1,
          completed_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS challenge_completions (
          id TEXT PRIMARY KEY NOT NULL,
          challenge_title TEXT NOT NULL,
          completed_date TEXT NOT NULL,
          completed_at INTEGER NOT NULL,
          project_id TEXT
        );

        CREATE TABLE IF NOT EXISTS streak_data (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          current_streak INTEGER NOT NULL DEFAULT 0,
          longest_streak INTEGER NOT NULL DEFAULT 0,
          last_active_date TEXT
        );

        CREATE TABLE IF NOT EXISTS drawing_analyses (
          id TEXT PRIMARY KEY NOT NULL,
          project_id TEXT,
          timestamp INTEGER NOT NULL,
          overall_score REAL NOT NULL,
          proportions_score REAL NOT NULL,
          alignment_score REAL NOT NULL,
          perspective_score REAL NOT NULL,
          composition_score REAL NOT NULL,
          shading_score REAL NOT NULL,
          feedback_json TEXT NOT NULL,
          annotations_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS generated_references (
          id TEXT PRIMARY KEY NOT NULL,
          prompt TEXT NOT NULL,
          category TEXT NOT NULL,
          style TEXT NOT NULL,
          pose TEXT NOT NULL,
          lighting TEXT NOT NULL,
          uri TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS saved_palettes (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          colors_json TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS stroke_replays (
          id TEXT PRIMARY KEY NOT NULL,
          project_id TEXT NOT NULL,
          events_json TEXT NOT NULL,
          duration_ms INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS practice_sessions (
          id TEXT PRIMARY KEY NOT NULL,
          exercise_id TEXT NOT NULL,
          category TEXT NOT NULL,
          difficulty TEXT NOT NULL,
          target_duration_minutes INTEGER NOT NULL,
          elapsed_duration_seconds INTEGER NOT NULL,
          status TEXT NOT NULL,
          notes TEXT,
          self_assessment_json TEXT,
          started_at INTEGER NOT NULL,
          completed_at INTEGER,
          created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS reference_analyses (
          id TEXT PRIMARY KEY NOT NULL,
          project_id TEXT,
          image_uri TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          analysis_json TEXT NOT NULL,
          user_notes TEXT
        );

        CREATE TABLE IF NOT EXISTS drawing_comparisons (
          id TEXT PRIMARY KEY NOT NULL,
          project_id TEXT,
          reference_uri TEXT NOT NULL,
          drawing_uri TEXT NOT NULL,
          alignment_json TEXT NOT NULL,
          comparison_mode TEXT NOT NULL,
          feedback_json TEXT NOT NULL,
          user_notes TEXT,
          created_at INTEGER NOT NULL
        );

        INSERT OR IGNORE INTO streak_data (id, current_streak, longest_streak, last_active_date)
        VALUES (1, 0, 0, NULL);
      `);

      // Migration: Ensure workstation columns exist on projects table non-destructively
      try {
        const columns = await db.getAllAsync<{ name: string }>("PRAGMA table_info(projects);");
        const colNames = new Set(columns.map((c) => c.name));

        if (!colNames.has("paper_size")) {
          await db.execAsync("ALTER TABLE projects ADD COLUMN paper_size TEXT DEFAULT 'A4';");
        }
        if (!colNames.has("paper_orientation")) {
          await db.execAsync("ALTER TABLE projects ADD COLUMN paper_orientation TEXT DEFAULT 'portrait';");
        }
        if (!colNames.has("paper_width_mm")) {
          await db.execAsync("ALTER TABLE projects ADD COLUMN paper_width_mm REAL DEFAULT 210.0;");
        }
        if (!colNames.has("paper_height_mm")) {
          await db.execAsync("ALTER TABLE projects ADD COLUMN paper_height_mm REAL DEFAULT 297.0;");
        }
        if (!colNames.has("paper_margin_mm")) {
          await db.execAsync("ALTER TABLE projects ADD COLUMN paper_margin_mm REAL DEFAULT 5.0;");
        }
        if (!colNames.has("whiteout_level")) {
          await db.execAsync("ALTER TABLE projects ADD COLUMN whiteout_level REAL DEFAULT 0.0;");
        }
        if (!colNames.has("image_brightness")) {
          await db.execAsync("ALTER TABLE projects ADD COLUMN image_brightness REAL DEFAULT 0.0;");
        }
        if (!colNames.has("image_contrast")) {
          await db.execAsync("ALTER TABLE projects ADD COLUMN image_contrast REAL DEFAULT 1.0;");
        }
        if (!colNames.has("overlays_json")) {
          await db.execAsync("ALTER TABLE projects ADD COLUMN overlays_json TEXT DEFAULT '[]';");
        }
        if (!colNames.has("adjustments_json")) {
          await db.execAsync("ALTER TABLE projects ADD COLUMN adjustments_json TEXT DEFAULT '{}';");
        }
        if (!colNames.has("experience_mode")) {
          await db.execAsync("ALTER TABLE projects ADD COLUMN experience_mode TEXT DEFAULT 'beginner';");
        }
      } catch {
        // Table info check fallback
      }

      return db;
    })();
  }
  return databasePromise;
}

function decodeProject(row: Record<string, unknown>): ProjectDocument {
  let paperSettings: PaperSettings | undefined;
  if (row.paper_size) {
    paperSettings = {
      size: (row.paper_size as PaperSize) ?? "A4",
      orientation: (row.paper_orientation as PaperOrientation) ?? "portrait",
      widthMm: row.paper_width_mm != null ? Number(row.paper_width_mm) : 210.0,
      heightMm: row.paper_height_mm != null ? Number(row.paper_height_mm) : 297.0,
      marginMm: row.paper_margin_mm != null ? Number(row.paper_margin_mm) : 5.0,
      targetDpi: 300,
    };
  }

  let imageAdjustments: ImageAdjustmentSettings | undefined;
  if (row.adjustments_json) {
    try {
      const parsed = JSON.parse(String(row.adjustments_json));
      if (typeof parsed === "object" && parsed !== null) {
        imageAdjustments = {
          ...DEFAULT_IMAGE_ADJUSTMENTS,
          ...parsed,
          crop: {
            ...DEFAULT_IMAGE_ADJUSTMENTS.crop,
            ...(parsed.crop ?? {}),
          },
        };
      }
    } catch {
      // Safe fallback
    }
  }
  if (!imageAdjustments && (row.whiteout_level != null || row.image_brightness != null)) {
    imageAdjustments = {
      ...DEFAULT_IMAGE_ADJUSTMENTS,
      whiteoutStrength: Number(row.whiteout_level ?? 0),
      brightness: Number(row.image_brightness ?? 0),
      contrast: Number(row.image_contrast ?? 1.0),
    };
  }

  let overlays: UnifiedOverlay[] | undefined;
  if (row.overlays_json) {
    try {
      overlays = JSON.parse(String(row.overlays_json)) as UnifiedOverlay[];
    } catch {
      overlays = [];
    }
  }

  return {
    id: String(row.id),
    name: String(row.name),
    width: Number(row.width),
    height: Number(row.height),
    layers: JSON.parse(String(row.layers_json)) as DrawingLayer[],
    activeLayerId: String(row.active_layer_id),
    referenceUri: row.reference_uri ? String(row.reference_uri) : null,
    referenceOpacity: row.whiteout_level != null ? 1.0 - Number(row.whiteout_level) : undefined,
    paperSettings,
    imageAdjustments,
    overlays,
    experienceMode: (row.experience_mode as ExperienceMode) ?? undefined,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export async function saveProject(project: ProjectDocument) {
  const db = await database();
  const paper = project.paperSettings ?? DEFAULT_PAPER_SETTINGS;
  const adjustments = project.imageAdjustments ?? DEFAULT_IMAGE_ADJUSTMENTS;
  const overlaysJson = JSON.stringify(project.overlays ?? []);
  const adjustmentsJson = JSON.stringify(adjustments);

  await db.runAsync(
    `INSERT INTO projects (
       id, name, width, height, layers_json, active_layer_id, reference_uri,
       created_at, updated_at, paper_size, paper_orientation, paper_width_mm,
       paper_height_mm, paper_margin_mm, whiteout_level, image_brightness,
       image_contrast, overlays_json, adjustments_json, experience_mode
     )
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name,
       width=excluded.width,
       height=excluded.height,
       layers_json=excluded.layers_json,
       active_layer_id=excluded.active_layer_id,
       reference_uri=excluded.reference_uri,
       updated_at=excluded.updated_at,
       paper_size=excluded.paper_size,
       paper_orientation=excluded.paper_orientation,
       paper_width_mm=excluded.paper_width_mm,
       paper_height_mm=excluded.paper_height_mm,
       paper_margin_mm=excluded.paper_margin_mm,
       whiteout_level=excluded.whiteout_level,
       image_brightness=excluded.image_brightness,
       image_contrast=excluded.image_contrast,
       overlays_json=excluded.overlays_json,
       adjustments_json=excluded.adjustments_json,
       experience_mode=excluded.experience_mode`,
    project.id,
    project.name,
    project.width,
    project.height,
    JSON.stringify(project.layers),
    project.activeLayerId,
    project.referenceUri ?? null,
    project.createdAt,
    project.updatedAt,
    paper.size,
    paper.orientation,
    paper.widthMm,
    paper.heightMm,
    paper.marginMm,
    adjustments.whiteoutStrength,
    adjustments.brightness,
    adjustments.contrast,
    overlaysJson,
    adjustmentsJson,
    project.experienceMode ?? "beginner"
  );
}

export async function getProject(id: string) {
  const db = await database();
  const row = await db.getFirstAsync<Record<string, unknown>>("SELECT * FROM projects WHERE id = ?", id);
  return row ? decodeProject(row) : undefined;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const db = await database();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT id,name,width,height,reference_uri,created_at,updated_at FROM projects ORDER BY updated_at DESC",
  );
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    width: Number(row.width),
    height: Number(row.height),
    referenceUri: row.reference_uri ? String(row.reference_uri) : null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  }));
}

export async function removeProject(id: string) {
  const db = await database();
  await db.runAsync("DELETE FROM projects WHERE id = ?", id);
}

export async function saveReference(reference: LocalReference) {
  const db = await database();
  await db.runAsync(
    `INSERT INTO references_local (id,name,uri,original_uri,width,height,is_edited,updated_at)
     VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,uri=excluded.uri,
     width=excluded.width,height=excluded.height,is_edited=excluded.is_edited,updated_at=excluded.updated_at`,
    reference.id,
    reference.name,
    reference.uri,
    reference.originalUri,
    reference.width,
    reference.height,
    reference.isEdited ? 1 : 0,
    reference.updatedAt,
  );
  await db.runAsync(
    "INSERT INTO app_metadata (key,value) VALUES ('active_reference_id',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    reference.id,
  );
}

export async function getActiveReference(): Promise<LocalReference | null> {
  const db = await database();
  const meta = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_metadata WHERE key='active_reference_id'");
  if (!meta) return null;
  const row = await db.getFirstAsync<Record<string, unknown>>("SELECT * FROM references_local WHERE id = ?", meta.value);
  if (!row) return null;
  return {
    id: String(row.id),
    name: String(row.name),
    uri: String(row.uri),
    originalUri: String(row.original_uri),
    width: Number(row.width),
    height: Number(row.height),
    isEdited: Number(row.is_edited) === 1,
    updatedAt: Number(row.updated_at),
  };
}

export async function clearActiveReference() {
  const db = await database();
  await db.runAsync("DELETE FROM app_metadata WHERE key='active_reference_id'");
}

// =========================================================================
// LEARNING CENTER & CHALLENGES PERSISTENCE
// =========================================================================

export async function recordLessonProgress(lessonId: string, completed: boolean) {
  const db = await database();
  if (completed) {
    await db.runAsync(
      `INSERT INTO lesson_progress (lesson_id, completed, completed_at)
       VALUES (?, 1, ?)
       ON CONFLICT(lesson_id) DO UPDATE SET completed=1, completed_at=excluded.completed_at`,
      lessonId,
      Date.now()
    );
  } else {
    await db.runAsync("DELETE FROM lesson_progress WHERE lesson_id = ?", lessonId);
  }
}

export async function getLessonProgress(): Promise<Record<string, { completed: boolean; completedAt: number }>> {
  const db = await database();
  const rows = await db.getAllAsync<{ lesson_id: string; completed: number; completed_at: number }>(
    "SELECT lesson_id, completed, completed_at FROM lesson_progress"
  );
  const result: Record<string, { completed: boolean; completedAt: number }> = {};
  rows.forEach((row) => {
    result[row.lesson_id] = { completed: row.completed === 1, completedAt: row.completed_at };
  });
  return result;
}

export async function getActiveLessonId(): Promise<string | null> {
  const db = await database();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_metadata WHERE key = 'active_lesson_id'"
  );
  return row?.value ?? null;
}

export async function setActiveLessonId(lessonId: string): Promise<void> {
  const db = await database();
  await db.runAsync(
    "INSERT INTO app_metadata (key, value) VALUES ('active_lesson_id', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    lessonId
  );
}

export async function getLessonStepProgress(lessonId: string): Promise<number> {
  const db = await database();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_metadata WHERE key = ?",
    `lesson_step_${lessonId}`
  );
  if (!row) return 1;
  const num = parseInt(row.value, 10);
  return isNaN(num) || num < 1 ? 1 : num;
}

export async function saveLessonStepProgress(lessonId: string, step: number): Promise<void> {
  const db = await database();
  await db.runAsync(
    "INSERT INTO app_metadata (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    `lesson_step_${lessonId}`,
    String(step)
  );
}

export function formatDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function recordChallengeCompletion(
  challengeTitle: string,
  projectId?: string
): Promise<{ streak: number; isNewDay: boolean }> {
  const db = await database();
  const today = formatDateString();
  const now = Date.now();
  const id = `chal-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  await db.runAsync(
    `INSERT INTO challenge_completions (id, challenge_title, completed_date, completed_at, project_id)
     VALUES (?, ?, ?, ?, ?)`,
    id,
    challengeTitle,
    today,
    now,
    projectId ?? null
  );

  // Update date-safe streak
  const streakRow = await db.getFirstAsync<{ current_streak: number; longest_streak: number; last_active_date: string | null }>(
    "SELECT current_streak, longest_streak, last_active_date FROM streak_data WHERE id = 1"
  );

  let currentStreak = streakRow?.current_streak ?? 0;
  let longestStreak = streakRow?.longest_streak ?? 0;
  const lastActive = streakRow?.last_active_date;
  let isNewDay = false;

  if (!lastActive) {
    currentStreak = 1;
    isNewDay = true;
  } else if (lastActive === today) {
    // Already logged today — keep streak
    isNewDay = false;
  } else {
    // Check if yesterday
    const lastDate = new Date(lastActive);
    const currentDate = new Date(today);
    const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
    isNewDay = true;
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  await db.runAsync(
    `UPDATE streak_data SET current_streak = ?, longest_streak = ?, last_active_date = ? WHERE id = 1`,
    currentStreak,
    longestStreak,
    today
  );

  return { streak: currentStreak, isNewDay };
}

export async function getStreakData(): Promise<{ currentStreak: number; longestStreak: number; lastActiveDate: string | null }> {
  const db = await database();
  const row = await db.getFirstAsync<{ current_streak: number; longest_streak: number; last_active_date: string | null }>(
    "SELECT current_streak, longest_streak, last_active_date FROM streak_data WHERE id = 1"
  );
  if (!row) return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };

  // Date-safety check: if user missed more than 1 day, current streak resets to 0 upon inquiry
  if (row.last_active_date) {
    const today = formatDateString();
    const lastDate = new Date(row.last_active_date);
    const currentDate = new Date(today);
    const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) {
      await db.runAsync("UPDATE streak_data SET current_streak = 0 WHERE id = 1");
      return { currentStreak: 0, longestStreak: row.longest_streak, lastActiveDate: row.last_active_date };
    }
  }

  return {
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastActiveDate: row.last_active_date,
  };
}

export async function getChallengeHistory(): Promise<
  Array<{ id: string; challengeTitle: string; completedDate: string; completedAt: number }>
> {
  const db = await database();
  const rows = await db.getAllAsync<{ id: string; challenge_title: string; completed_date: string; completed_at: number }>(
    "SELECT id, challenge_title, completed_date, completed_at FROM challenge_completions ORDER BY completed_at DESC"
  );
  return rows.map((r) => ({
    id: r.id,
    challengeTitle: r.challenge_title,
    completedDate: r.completed_date,
    completedAt: r.completed_at,
  }));
}

// =========================================================================
// PHASE 4: DRAWING ANALYSES
// =========================================================================

export async function saveDrawingAnalysis(analysis: DrawingAnalysisRecord): Promise<void> {
  const db = await database();
  await db.runAsync(
    `INSERT INTO drawing_analyses (id, project_id, timestamp, overall_score, proportions_score,
      alignment_score, perspective_score, composition_score, shading_score, feedback_json, annotations_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
      project_id=excluded.project_id, timestamp=excluded.timestamp, overall_score=excluded.overall_score,
      proportions_score=excluded.proportions_score, alignment_score=excluded.alignment_score,
      perspective_score=excluded.perspective_score, composition_score=excluded.composition_score,
      shading_score=excluded.shading_score, feedback_json=excluded.feedback_json, annotations_json=excluded.annotations_json`,
    analysis.id,
    analysis.projectId ?? null,
    analysis.timestamp,
    analysis.overallScore,
    analysis.proportionsScore,
    analysis.alignmentScore,
    analysis.perspectiveScore,
    analysis.compositionScore,
    analysis.shadingScore,
    JSON.stringify(analysis.feedback),
    JSON.stringify(analysis.annotations)
  );
}

export async function getDrawingAnalyses(limit: number = 20): Promise<DrawingAnalysisRecord[]> {
  const db = await database();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM drawing_analyses ORDER BY timestamp DESC LIMIT ?",
    limit
  );
  return rows.map((row) => ({
    id: String(row.id),
    projectId: row.project_id ? String(row.project_id) : null,
    timestamp: Number(row.timestamp),
    overallScore: Number(row.overall_score),
    proportionsScore: Number(row.proportions_score),
    alignmentScore: Number(row.alignment_score),
    perspectiveScore: Number(row.perspective_score),
    compositionScore: Number(row.composition_score),
    shadingScore: Number(row.shading_score),
    feedback: JSON.parse(String(row.feedback_json || "[]")),
    annotations: JSON.parse(String(row.annotations_json || "[]")),
  }));
}

export async function getDrawingAnalysesByProject(projectId: string): Promise<DrawingAnalysisRecord[]> {
  const db = await database();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM drawing_analyses WHERE project_id = ? ORDER BY timestamp DESC",
    projectId
  );
  return rows.map((row) => ({
    id: String(row.id),
    projectId: row.project_id ? String(row.project_id) : null,
    timestamp: Number(row.timestamp),
    overallScore: Number(row.overall_score),
    proportionsScore: Number(row.proportions_score),
    alignmentScore: Number(row.alignment_score),
    perspectiveScore: Number(row.perspective_score),
    compositionScore: Number(row.composition_score),
    shadingScore: Number(row.shading_score),
    feedback: JSON.parse(String(row.feedback_json || "[]")),
    annotations: JSON.parse(String(row.annotations_json || "[]")),
  }));
}

// =========================================================================
// PHASE 4: GENERATED REFERENCES
// =========================================================================

export async function saveGeneratedReference(ref: GeneratedReferenceRecord): Promise<void> {
  const db = await database();
  await db.runAsync(
    `INSERT INTO generated_references (id, prompt, category, style, pose, lighting, uri, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
      prompt=excluded.prompt, category=excluded.category, style=excluded.style,
      pose=excluded.pose, lighting=excluded.lighting, uri=excluded.uri, created_at=excluded.created_at`,
    ref.id,
    ref.prompt,
    ref.category,
    ref.style,
    ref.pose,
    ref.lighting,
    ref.uri,
    ref.createdAt
  );
}

export async function getGeneratedReferences(limit: number = 30): Promise<GeneratedReferenceRecord[]> {
  const db = await database();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM generated_references ORDER BY created_at DESC LIMIT ?",
    limit
  );
  return rows.map((row) => ({
    id: String(row.id),
    prompt: String(row.prompt),
    category: String(row.category),
    style: String(row.style),
    pose: String(row.pose),
    lighting: String(row.lighting),
    uri: String(row.uri),
    createdAt: Number(row.created_at),
  }));
}

export async function deleteGeneratedReference(id: string): Promise<void> {
  const db = await database();
  await db.runAsync("DELETE FROM generated_references WHERE id = ?", id);
}

// =========================================================================
// PHASE 4: SAVED COLOR PALETTES
// =========================================================================

export async function savePalette(palette: SavedPaletteRecord): Promise<void> {
  const db = await database();
  await db.runAsync(
    `INSERT INTO saved_palettes (id, name, colors_json, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, colors_json=excluded.colors_json, created_at=excluded.created_at`,
    palette.id,
    palette.name,
    JSON.stringify(palette.colors),
    palette.createdAt
  );
}

export async function getSavedPalettes(): Promise<SavedPaletteRecord[]> {
  const db = await database();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM saved_palettes ORDER BY created_at DESC"
  );
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    colors: JSON.parse(String(row.colors_json || "[]")),
    createdAt: Number(row.created_at),
  }));
}

export async function deletePalette(id: string): Promise<void> {
  const db = await database();
  await db.runAsync("DELETE FROM saved_palettes WHERE id = ?", id);
}

// =========================================================================
// PHASE 4: STROKE REPLAY
// =========================================================================

export async function saveStrokeReplay(replay: StrokeReplayRecord): Promise<void> {
  const db = await database();
  await db.runAsync(
    `INSERT INTO stroke_replays (id, project_id, events_json, duration_ms, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET events_json=excluded.events_json, duration_ms=excluded.duration_ms, created_at=excluded.created_at`,
    replay.id,
    replay.projectId,
    JSON.stringify(replay.events),
    replay.durationMs,
    replay.createdAt
  );
}

export async function getStrokeReplay(projectId: string): Promise<StrokeReplayRecord | null> {
  const db = await database();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    "SELECT * FROM stroke_replays WHERE project_id = ? ORDER BY created_at DESC LIMIT 1",
    projectId
  );
  if (!row) return null;
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    events: JSON.parse(String(row.events_json || "[]")),
    durationMs: Number(row.duration_ms),
    createdAt: Number(row.created_at),
  };
}

// =========================================================================
// PHASE 4: EXPERIENCE MODE (BEGINNER vs PROFESSIONAL)
// =========================================================================

export async function getExperienceMode(): Promise<ExperienceMode> {
  const db = await database();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_metadata WHERE key = 'experience_mode'"
  );
  if (row?.value === "professional") return "professional";
  return "beginner";
}

export async function setExperienceMode(mode: ExperienceMode): Promise<void> {
  const db = await database();
  await db.runAsync(
    "INSERT INTO app_metadata (key, value) VALUES ('experience_mode', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    mode
  );
}

// =========================================================================
// PHASE 5: BILINGUAL LOCALIZATION (TAMIL & ENGLISH)
// =========================================================================

export async function getAppLanguage(): Promise<"en" | "ta"> {
  const db = await database();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_metadata WHERE key = 'app_language'"
  );
  if (row?.value === "ta") return "ta";
  return "en";
}

export async function setAppLanguage(lang: "en" | "ta"): Promise<void> {
  const db = await database();
  await db.runAsync(
    "INSERT INTO app_metadata (key, value) VALUES ('app_language', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    lang
  );
}

// =========================================================================
// PHASE 6: AUTHENTICATION & SESSION PERSISTENCE
// =========================================================================

export interface StoredAuthSession {
  user: any;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export async function getStoredAuth(): Promise<StoredAuthSession | null> {
  const db = await database();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_metadata WHERE key = 'auth_session'"
  );
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

export async function setStoredAuth(session: StoredAuthSession): Promise<void> {
  const db = await database();
  await db.runAsync(
    "INSERT INTO app_metadata (key, value) VALUES ('auth_session', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    JSON.stringify(session)
  );
}

export async function clearStoredAuth(): Promise<void> {
  const db = await database();
  await db.runAsync("DELETE FROM app_metadata WHERE key = 'auth_session'");
}

// =========================================================================
// PHASE 7: ONBOARDING COMPLETION PERSISTENCE
// =========================================================================

export async function getOnboardingCompleted(): Promise<boolean> {
  const db = await database();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_metadata WHERE key = 'onboarding_completed'"
  );
  return row?.value === "true";
}

export async function setOnboardingCompleted(completed: boolean): Promise<void> {
  const db = await database();
  await db.runAsync(
    "INSERT INTO app_metadata (key, value) VALUES ('onboarding_completed', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    completed ? "true" : "false"
  );
}

// =========================================================================
// PHASE 7B: PRACTICE STUDIO PERSISTENCE
// =========================================================================

export async function savePracticeSession(session: PracticeSessionRecord): Promise<void> {
  const db = await database();
  await db.runAsync(
    `INSERT INTO practice_sessions (id, exercise_id, category, difficulty, target_duration_minutes,
      elapsed_duration_seconds, status, notes, self_assessment_json, started_at, completed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
      exercise_id=excluded.exercise_id, category=excluded.category, difficulty=excluded.difficulty,
      target_duration_minutes=excluded.target_duration_minutes, elapsed_duration_seconds=excluded.elapsed_duration_seconds,
      status=excluded.status, notes=excluded.notes, self_assessment_json=excluded.self_assessment_json,
      started_at=excluded.started_at, completed_at=excluded.completed_at`,
    session.id,
    session.exerciseId,
    session.category,
    session.difficulty,
    session.targetDurationMinutes,
    session.elapsedDurationSeconds,
    session.status,
    session.notes ?? null,
    session.selfAssessmentResults ? JSON.stringify(session.selfAssessmentResults) : null,
    session.startedAt,
    session.completedAt ?? null,
    session.createdAt
  );
}

export async function getPracticeSessions(limit: number = 50): Promise<PracticeSessionRecord[]> {
  const db = await database();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM practice_sessions ORDER BY created_at DESC LIMIT ?",
    limit
  );
  return rows.map((row) => ({
    id: String(row.id),
    exerciseId: String(row.exercise_id),
    category: row.category as any,
    difficulty: row.difficulty as any,
    targetDurationMinutes: Number(row.target_duration_minutes),
    elapsedDurationSeconds: Number(row.elapsed_duration_seconds),
    status: row.status as any,
    notes: row.notes ? String(row.notes) : undefined,
    selfAssessmentResults: row.self_assessment_json ? JSON.parse(String(row.self_assessment_json)) : undefined,
    startedAt: Number(row.started_at),
    completedAt: row.completed_at != null ? Number(row.completed_at) : undefined,
    createdAt: Number(row.created_at),
  }));
}

export async function getPracticeSessionsByExercise(exerciseId: string): Promise<PracticeSessionRecord[]> {
  const db = await database();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM practice_sessions WHERE exercise_id = ? ORDER BY created_at DESC",
    exerciseId
  );
  return rows.map((row) => ({
    id: String(row.id),
    exerciseId: String(row.exercise_id),
    category: row.category as any,
    difficulty: row.difficulty as any,
    targetDurationMinutes: Number(row.target_duration_minutes),
    elapsedDurationSeconds: Number(row.elapsed_duration_seconds),
    status: row.status as any,
    notes: row.notes ? String(row.notes) : undefined,
    selfAssessmentResults: row.self_assessment_json ? JSON.parse(String(row.self_assessment_json)) : undefined,
    startedAt: Number(row.started_at),
    completedAt: row.completed_at != null ? Number(row.completed_at) : undefined,
    createdAt: Number(row.created_at),
  }));
}

export async function getPracticeSessionStats(): Promise<{
  totalSessions: number;
  completedCount: number;
  totalPracticeTimeMinutes: number;
}> {
  const db = await database();
  const rows = await db.getAllAsync<{ status: string; elapsed_duration_seconds: number }>(
    "SELECT status, elapsed_duration_seconds FROM practice_sessions"
  );
  let totalSessions = rows.length;
  let completedCount = 0;
  let totalSeconds = 0;
  for (const r of rows) {
    if (r.status === "completed") {
      completedCount++;
    }
    totalSeconds += Number(r.elapsed_duration_seconds || 0);
  }
  return {
    totalSessions,
    completedCount,
    totalPracticeTimeMinutes: Math.round(totalSeconds / 60),
  };
}

export async function recordPracticeCompletion(
  session: PracticeSessionRecord
): Promise<{ streak: number; isNewDay: boolean }> {
  await savePracticeSession({
    ...session,
    status: "completed",
    completedAt: session.completedAt ?? Date.now(),
  });

  const db = await database();
  const today = formatDateString();
  const streakRow = await db.getFirstAsync<{ current_streak: number; longest_streak: number; last_active_date: string | null }>(
    "SELECT current_streak, longest_streak, last_active_date FROM streak_data WHERE id = 1"
  );

  let currentStreak = streakRow?.current_streak ?? 0;
  let longestStreak = streakRow?.longest_streak ?? 0;
  const lastActive = streakRow?.last_active_date;
  let isNewDay = false;

  if (!lastActive) {
    currentStreak = 1;
    isNewDay = true;
  } else if (lastActive === today) {
    isNewDay = false;
  } else {
    const lastDate = new Date(lastActive);
    const currentDate = new Date(today);
    const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
    isNewDay = true;
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  await db.runAsync(
    `UPDATE streak_data SET current_streak = ?, longest_streak = ?, last_active_date = ? WHERE id = 1`,
    currentStreak,
    longestStreak,
    today
  );

  return { streak: currentStreak, isNewDay };
}

// =========================================================================
// PHASE 7C: AI DRAWING ASSISTANT & REFERENCE ANALYSIS PERSISTENCE
// =========================================================================

export async function saveReferenceAnalysis(record: SavedReferenceAnalysisRecord): Promise<void> {
  const db = await database();
  await db.runAsync(
    `INSERT INTO reference_analyses (id, project_id, image_uri, created_at, analysis_json, user_notes)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
      project_id=excluded.project_id, image_uri=excluded.image_uri, created_at=excluded.created_at,
      analysis_json=excluded.analysis_json, user_notes=excluded.user_notes`,
    record.id,
    record.projectId ?? null,
    record.imageUri,
    record.createdAt,
    JSON.stringify(record.analysis),
    record.userNotes ?? null
  );
}

export async function getReferenceAnalyses(limit: number = 30): Promise<SavedReferenceAnalysisRecord[]> {
  const db = await database();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM reference_analyses ORDER BY created_at DESC LIMIT ?",
    limit
  );
  return rows.map((row) => ({
    id: String(row.id),
    projectId: row.project_id ? String(row.project_id) : undefined,
    imageUri: String(row.image_uri),
    createdAt: Number(row.created_at),
    analysis: JSON.parse(String(row.analysis_json || "{}")),
    userNotes: row.user_notes ? String(row.user_notes) : undefined,
  }));
}

export async function getReferenceAnalysesByProject(projectId: string): Promise<SavedReferenceAnalysisRecord[]> {
  const db = await database();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM reference_analyses WHERE project_id = ? ORDER BY created_at DESC",
    projectId
  );
  return rows.map((row) => ({
    id: String(row.id),
    projectId: row.project_id ? String(row.project_id) : undefined,
    imageUri: String(row.image_uri),
    createdAt: Number(row.created_at),
    analysis: JSON.parse(String(row.analysis_json || "{}")),
    userNotes: row.user_notes ? String(row.user_notes) : undefined,
  }));
}

export async function deleteReferenceAnalysis(id: string): Promise<void> {
  const db = await database();
  await db.runAsync("DELETE FROM reference_analyses WHERE id = ?", id);
}

// =========================================================================
// PHASE 7D: DRAWING COMPARISON & FEEDBACK PERSISTENCE
// =========================================================================

export async function saveDrawingComparison(record: SavedDrawingComparisonRecord): Promise<void> {
  const db = await database();
  await db.runAsync(
    `INSERT INTO drawing_comparisons (id, project_id, reference_uri, drawing_uri, alignment_json,
      comparison_mode, feedback_json, user_notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
      project_id=excluded.project_id, reference_uri=excluded.reference_uri, drawing_uri=excluded.drawing_uri,
      alignment_json=excluded.alignment_json, comparison_mode=excluded.comparison_mode,
      feedback_json=excluded.feedback_json, user_notes=excluded.user_notes, created_at=excluded.created_at`,
    record.id,
    record.projectId ?? null,
    record.referenceUri,
    record.drawingUri,
    JSON.stringify(record.alignment),
    record.comparisonMode,
    JSON.stringify(record.feedback),
    record.userNotes ?? null,
    record.createdAt
  );
}

export async function getDrawingComparisons(limit: number = 30): Promise<SavedDrawingComparisonRecord[]> {
  const db = await database();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM drawing_comparisons ORDER BY created_at DESC LIMIT ?",
    limit
  );
  return rows.map((row) => ({
    id: String(row.id),
    projectId: row.project_id ? String(row.project_id) : undefined,
    referenceUri: String(row.reference_uri),
    drawingUri: String(row.drawing_uri),
    alignment: JSON.parse(String(row.alignment_json || "{}")),
    comparisonMode: row.comparison_mode as any,
    feedback: JSON.parse(String(row.feedback_json || "{}")),
    userNotes: row.user_notes ? String(row.user_notes) : undefined,
    createdAt: Number(row.created_at),
  }));
}

export async function getDrawingComparisonsByProject(projectId: string): Promise<SavedDrawingComparisonRecord[]> {
  const db = await database();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM drawing_comparisons WHERE project_id = ? ORDER BY created_at DESC",
    projectId
  );
  return rows.map((row) => ({
    id: String(row.id),
    projectId: row.project_id ? String(row.project_id) : undefined,
    referenceUri: String(row.reference_uri),
    drawingUri: String(row.drawing_uri),
    alignment: JSON.parse(String(row.alignment_json || "{}")),
    comparisonMode: row.comparison_mode as any,
    feedback: JSON.parse(String(row.feedback_json || "{}")),
    userNotes: row.user_notes ? String(row.user_notes) : undefined,
    createdAt: Number(row.created_at),
  }));
}

export async function deleteDrawingComparison(id: string): Promise<void> {
  const db = await database();
  await db.runAsync("DELETE FROM drawing_comparisons WHERE id = ?", id);
}



