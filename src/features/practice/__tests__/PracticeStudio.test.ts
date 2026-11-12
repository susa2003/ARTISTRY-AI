/**
 * ARTISTRY AI — Phase 7B: Practice Studio Test Suite
 * Tests exercise catalog integrity, category & difficulty filtering,
 * deterministic daily selection, wall-clock timer calculations,
 * background recovery, SQLite session persistence, and streak updates.
 */

import {
  PRACTICE_CATEGORIES,
  PRACTICE_EXERCISES,
  filterExercises,
  getAllExercises,
  getCategoryMetadata,
  getDailyExercise,
  getExerciseById,
  getExercisesByCategory,
  getExercisesByDifficulty,
} from "../practiceCatalog";
import type { PracticeCategory, PracticeDifficulty, PracticeSessionRecord } from "../types";
import {
  createPracticeTimer,
  finishPracticeTimer,
  formatTimerSeconds,
  getElapsedMs,
  getElapsedSeconds,
  getRemainingSeconds,
  getTimerProgress,
  isTimerCompleted,
  pausePracticeTimer,
  resetPracticeTimer,
  startPracticeTimer,
} from "../PracticeTimer";
import {
  getLessonProgress,
  getPracticeSessionStats,
  getPracticeSessions,
  getPracticeSessionsByExercise,
  getStreakData,
  recordLessonProgress,
  recordPracticeCompletion,
  savePracticeSession,
} from "../../../storage/database";

describe("Phase 7B: Practice Studio", () => {
  describe("1. Exercise Catalog Integrity", () => {
    it("should provide exercises across all 8 mandatory skill categories", () => {
      const requiredCategories: PracticeCategory[] = [
        "basic_shapes",
        "proportion",
        "gesture",
        "facial_construction",
        "anatomy",
        "perspective",
        "light_shadow",
        "contour",
      ];

      expect(PRACTICE_CATEGORIES).toHaveLength(8);
      const catIds = PRACTICE_CATEGORIES.map((c) => c.id);
      requiredCategories.forEach((cat) => {
        expect(catIds).toContain(cat);
      });
    });

    it("should provide exactly 24 rich traditional exercises (3 per category)", () => {
      const all = getAllExercises();
      expect(all).toHaveLength(24);

      PRACTICE_CATEGORIES.forEach((cat) => {
        const catExercises = getExercisesByCategory(cat.id);
        expect(catExercises).toHaveLength(3);
      });
    });

    it("should ensure each category covers beginner, intermediate, and advanced tiers", () => {
      PRACTICE_CATEGORIES.forEach((cat) => {
        const catExercises = getExercisesByCategory(cat.id);
        const difficulties = catExercises.map((e) => e.difficulty);
        expect(difficulties).toContain("beginner");
        expect(difficulties).toContain("intermediate");
        expect(difficulties).toContain("advanced");
      });
    });

    it("should ensure all exercises have complete physical drawing instructions and metadata", () => {
      const all = getAllExercises();
      all.forEach((exercise) => {
        expect(exercise.id).toMatch(/^ex-[a-z]+-\d{2}$/);
        expect(exercise.title.trim().length).toBeGreaterThan(5);
        expect(exercise.objective.trim().length).toBeGreaterThan(15);
        expect(exercise.estimatedDurationMinutes).toBeGreaterThanOrEqual(5);

        // Physical paper setup & materials
        expect(exercise.requiredMaterials.length).toBeGreaterThanOrEqual(2);
        expect(exercise.physicalPaperGuidance.trim().length).toBeGreaterThan(20);

        // Step-by-step instructions
        expect(exercise.instructions.length).toBeGreaterThanOrEqual(3);
        exercise.instructions.forEach((step) => {
          expect(step.trim().length).toBeGreaterThan(15);
        });

        // Completion criteria & checklists
        expect(exercise.completionCriteria.trim().length).toBeGreaterThan(15);
        expect(exercise.selfAssessmentChecklist.length).toBeGreaterThanOrEqual(3);

        // Overlay recommendation
        if (exercise.recommendedOverlay) {
          expect([
            "grid",
            "loomis",
            "perspective",
            "contour",
            "shading",
            "proportions",
          ]).toContain(exercise.recommendedOverlay);
        }
      });
    });

    it("should return valid category metadata for each category", () => {
      PRACTICE_CATEGORIES.forEach((cat) => {
        const meta = getCategoryMetadata(cat.id);
        expect(meta).toBeDefined();
        expect(meta?.title).toBe(cat.title);
        expect(meta?.icon.length).toBeGreaterThan(0);
        expect(meta?.description.length).toBeGreaterThan(10);
      });
    });
  });

  describe("2. Catalog Filtering & Daily Exercise Selection", () => {
    it("should find exercise by unique ID", () => {
      const ex = getExerciseById("ex-shapes-01");
      expect(ex).toBeDefined();
      expect(ex?.title).toBe("Confident Freehand Spheres & Ellipses");
      expect(ex?.category).toBe("basic_shapes");
    });

    it("should return undefined for invalid exercise ID", () => {
      expect(getExerciseById("non-existent-id")).toBeUndefined();
    });

    it("should filter by difficulty cleanly", () => {
      const beginners = getExercisesByDifficulty("beginner");
      expect(beginners).toHaveLength(8);
      beginners.forEach((b) => expect(b.difficulty).toBe("beginner"));

      const advanced = getExercisesByDifficulty("advanced");
      expect(advanced).toHaveLength(8);
      advanced.forEach((a) => expect(a.difficulty).toBe("advanced"));
    });

    it("should support multi-criteria filtering by category and difficulty", () => {
      const shapesBeginner = filterExercises("basic_shapes", "beginner");
      expect(shapesBeginner).toHaveLength(1);
      expect(shapesBeginner[0]?.id).toBe("ex-shapes-01");

      const allAdvanced = filterExercises("all", "advanced");
      expect(allAdvanced).toHaveLength(8);

      const contourAll = filterExercises("contour", "all");
      expect(contourAll).toHaveLength(3);
    });

    it("should deterministically recommend daily practice based on calendar date", () => {
      const day1 = getDailyExercise("2026-11-11");
      const day1Repeat = getDailyExercise("2026-11-11");
      expect(day1.id).toBe(day1Repeat.id);

      const day2 = getDailyExercise("2026-11-12");
      expect(day2).toBeDefined();
      expect(day2.id).toBeDefined();
    });
  });

  describe("3. Wall-Clock Practice Timer Engine", () => {
    it("should create initial timer with target duration", () => {
      const timer = createPracticeTimer(15);
      expect(timer.targetDurationMinutes).toBe(15);
      expect(timer.accumulatedMs).toBe(0);
      expect(timer.startEpochMs).toBeNull();
      expect(timer.isRunning).toBe(false);
      expect(timer.isFinished).toBe(false);
    });

    it("should start and track elapsed seconds via epoch timestamp", () => {
      const t0 = 1000000;
      let timer = createPracticeTimer(10);
      timer = startPracticeTimer(timer, t0);
      expect(timer.isRunning).toBe(true);
      expect(timer.startEpochMs).toBe(t0);

      // Advance by 30 seconds
      const t1 = t0 + 30000;
      expect(getElapsedSeconds(timer, t1)).toBe(30);
      expect(getRemainingSeconds(timer, t1)).toBe(10 * 60 - 30);
      expect(getTimerProgress(timer, t1)).toBeCloseTo(30 / 600, 2);
    });

    it("should pause and bank accumulated milliseconds cleanly", () => {
      const t0 = 1000000;
      let timer = createPracticeTimer(10);
      timer = startPracticeTimer(timer, t0);

      // Run 45 seconds, then pause
      const tPause = t0 + 45000;
      timer = pausePracticeTimer(timer, tPause);
      expect(timer.isRunning).toBe(false);
      expect(timer.startEpochMs).toBeNull();
      expect(timer.accumulatedMs).toBe(45000);
      expect(getElapsedSeconds(timer, tPause + 10000)).toBe(45); // Clock stopped while paused
    });

    it("should resume and accumulate multiple active segments", () => {
      const t0 = 1000000;
      let timer = createPracticeTimer(10);
      timer = startPracticeTimer(timer, t0);

      // First run: 30 seconds
      timer = pausePracticeTimer(timer, t0 + 30000);

      // Paused for 5 minutes (user took a break or looked away)
      const tResume = t0 + 330000;
      timer = startPracticeTimer(timer, tResume);

      // Second run: 25 seconds
      const tNow = tResume + 25000;
      expect(getElapsedSeconds(timer, tNow)).toBe(55);
    });

    it("should safely withstand app backgrounding and sleep without losing elapsed time", () => {
      const t0 = 1000000;
      let timer = createPracticeTimer(15);
      timer = startPracticeTimer(timer, t0);

      // Simulate app was put in background for 8 minutes (480,000 ms) and reopened
      const tReopen = t0 + 480000;
      expect(getElapsedSeconds(timer, tReopen)).toBe(480);
      expect(getRemainingSeconds(timer, tReopen)).toBe(15 * 60 - 480);
      expect(isTimerCompleted(timer, tReopen)).toBe(false);

      // Simulate reaching target duration after 15 minutes (900,000 ms)
      const tComplete = t0 + 900000;
      expect(isTimerCompleted(timer, tComplete)).toBe(true);
      expect(getRemainingSeconds(timer, tComplete)).toBe(0);
      expect(getTimerProgress(timer, tComplete)).toBe(1.0);
    });

    it("should finish and freeze timer", () => {
      const t0 = 1000000;
      let timer = createPracticeTimer(5);
      timer = startPracticeTimer(timer, t0);
      const tFinish = t0 + 310000; // 5 min 10 sec
      timer = finishPracticeTimer(timer, tFinish);

      expect(timer.isRunning).toBe(false);
      expect(timer.isFinished).toBe(true);
      expect(getElapsedSeconds(timer, tFinish + 999999)).toBe(310);
    });

    it("should reset timer back to initial state", () => {
      let timer = createPracticeTimer(10);
      timer = startPracticeTimer(timer, 100000);
      timer = pausePracticeTimer(timer, 150000);
      expect(timer.accumulatedMs).toBe(50000);

      timer = resetPracticeTimer(timer, 20);
      expect(timer.targetDurationMinutes).toBe(20);
      expect(timer.accumulatedMs).toBe(0);
      expect(timer.isRunning).toBe(false);
    });

    it("should format seconds into MM:SS and HH:MM:SS strings", () => {
      expect(formatTimerSeconds(0)).toBe("00:00");
      expect(formatTimerSeconds(45)).toBe("00:45");
      expect(formatTimerSeconds(125)).toBe("02:05");
      expect(formatTimerSeconds(3600)).toBe("01:00:00");
      expect(formatTimerSeconds(3665)).toBe("01:01:05");
    });
  });

  describe("4. SQLite Persistence & Practice History", () => {
    it("should save and retrieve practice session records", async () => {
      const now = Date.now();
      const sessionRecord: PracticeSessionRecord = {
        id: "sess-test-01",
        exerciseId: "ex-shapes-01",
        category: "basic_shapes",
        difficulty: "beginner",
        targetDurationMinutes: 10,
        elapsedDurationSeconds: 615,
        status: "completed",
        notes: "Shoulder movement felt natural; kept ellipses symmetrical.",
        selfAssessmentResults: {
          "Did I draw from the shoulder rather than the wrist?": true,
          "Are the outer contours smooth without hesitant breaks?": true,
        },
        startedAt: now - 620000,
        completedAt: now,
        createdAt: now,
      };

      await savePracticeSession(sessionRecord);

      const allSessions = await getPracticeSessions(10);
      expect(allSessions.length).toBeGreaterThan(0);
      const found = allSessions.find((s) => s.id === "sess-test-01");
      expect(found).toBeDefined();
      expect(found?.exerciseId).toBe("ex-shapes-01");
      expect(found?.elapsedDurationSeconds).toBe(615);
      expect(found?.status).toBe("completed");
      expect(found?.notes).toBe("Shoulder movement felt natural; kept ellipses symmetrical.");
      expect(found?.selfAssessmentResults).toEqual({
        "Did I draw from the shoulder rather than the wrist?": true,
        "Are the outer contours smooth without hesitant breaks?": true,
      });
    });

    it("should query sessions by exercise ID", async () => {
      const now = Date.now();
      const sess2: PracticeSessionRecord = {
        id: "sess-test-02",
        exerciseId: "ex-prop-01",
        category: "proportion",
        difficulty: "beginner",
        targetDurationMinutes: 15,
        elapsedDurationSeconds: 900,
        status: "completed",
        startedAt: now - 900000,
        completedAt: now,
        createdAt: now,
      };

      await savePracticeSession(sess2);

      const propSessions = await getPracticeSessionsByExercise("ex-prop-01");
      expect(propSessions.length).toBeGreaterThan(0);
      expect(propSessions.every((s) => s.exerciseId === "ex-prop-01")).toBe(true);
    });

    it("should compute accurate practice session statistics", async () => {
      const stats = await getPracticeSessionStats();
      expect(stats.totalSessions).toBeGreaterThan(0);
      expect(stats.completedCount).toBeGreaterThan(0);
      expect(stats.totalPracticeTimeMinutes).toBeGreaterThan(0);
    });

    it("should record practice completion and update streak safely", async () => {
      const now = Date.now();
      const sessStreak: PracticeSessionRecord = {
        id: "sess-test-streak",
        exerciseId: "ex-gest-01",
        category: "gesture",
        difficulty: "beginner",
        targetDurationMinutes: 10,
        elapsedDurationSeconds: 600,
        status: "completed",
        startedAt: now - 600000,
        completedAt: now,
        createdAt: now,
      };

      const result = await recordPracticeCompletion(sessStreak);
      expect(result.streak).toBeGreaterThanOrEqual(1);

      const streakData = await getStreakData();
      expect(streakData.currentStreak).toBe(result.streak);
    });
  });

  describe("5. Preservation of Existing 7A Functionality", () => {
    it("should preserve lesson progress and active lesson persistence", async () => {
      await recordLessonProgress("l1-01", true);
      const progress = await getLessonProgress();
      expect(progress["l1-01"]?.completed).toBe(true);
    });
  });
});
