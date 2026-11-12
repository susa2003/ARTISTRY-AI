/**
 * ARTISTRY AI — Phase 5 Test Suite
 * Comprehensive automated tests for Beginner & Professional Experience Modes:
 * 1. Mode switching and persistence
 * 2. 7-Level traditional curriculum integrity (40 lessons, steps, criteria)
 * 3. Step progress and active lesson persistence in SQLite
 * 4. Lesson navigation helpers (getLessonById, getNextLesson, getPreviousLesson)
 * 5. Project preservation across mode changes
 * 6. Beginner coach tips and overlay actions
 * 7. Professional telemetry parameter updates (Loomis, Perspective, Shading, Grid)
 */

import {
  DRAWING_CURRICULUM,
  getAllLessons,
  getLessonById,
  getNextLesson,
  getPreviousLesson,
} from "../curriculumData";
import { useAppStore } from "../../../state/appStore";
import * as database from "../../../storage/database";
import type {
  GridOverlayConfig,
  LoomisOverlayConfig,
  PerspectiveOverlayConfig,
  ShadingOverlayConfig,
} from "../../../domain/overlayTypes";

describe("Phase 5: Beginner & Professional Experience Modes", () => {
  beforeEach(async () => {
    // Reset store state
    useAppStore.setState({
      experienceMode: "beginner",
      lessonProgress: {},
      activeLessonId: null,
      currentProject: {
        id: "proj-mode-test-01",
        name: "Test Portrait Study",
        width: 1200,
        height: 1600,
        layers: [
          {
            id: "layer-1",
            name: "Initial Contour",
            visible: true,
            opacity: 1.0,
            strokes: [],
          },
        ],
        activeLayerId: "layer-1",
        referenceUri: "file:///test/portrait.jpg",
        paperSettings: {
          size: "A4",
          orientation: "portrait",
          widthMm: 210,
          heightMm: 297,
          marginMm: 5.0,
          targetDpi: 300,
        },
        overlays: [],
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      },
    });
  });

  describe("1. Mode Switching & Project Preservation", () => {
    it("should start with default beginner mode", () => {
      expect(useAppStore.getState().experienceMode).toBe("beginner");
    });

    it("should switch mode to professional and preserve projects and layers", async () => {
      const initialProject = useAppStore.getState().currentProject;
      expect(initialProject).not.toBeNull();

      // Switch to professional
      await useAppStore.getState().setExperienceMode("professional");
      expect(useAppStore.getState().experienceMode).toBe("professional");

      // Verify project is intact
      const afterSwitch = useAppStore.getState().currentProject;
      expect(afterSwitch?.id).toBe(initialProject?.id);
      expect(afterSwitch?.layers.length).toBe(initialProject?.layers.length);
      expect(afterSwitch?.referenceUri).toBe(initialProject?.referenceUri);
    });

    it("should switch back from professional to beginner without data loss", async () => {
      await useAppStore.getState().setExperienceMode("professional");
      expect(useAppStore.getState().experienceMode).toBe("professional");

      await useAppStore.getState().setExperienceMode("beginner");
      expect(useAppStore.getState().experienceMode).toBe("beginner");

      const project = useAppStore.getState().currentProject;
      expect(project?.name).toBe("Test Portrait Study");
    });
  });

  describe("2. Structured Traditional Curriculum (7 Levels, 40 Lessons)", () => {
    it("should contain exactly 7 curriculum levels", () => {
      expect(DRAWING_CURRICULUM).toHaveLength(7);
      const levelNumbers = DRAWING_CURRICULUM.map((lvl) => lvl.level);
      expect(levelNumbers).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it("should contain 40 comprehensive lessons across all levels", () => {
      const allLessons = getAllLessons();
      expect(allLessons).toHaveLength(40);
    });

    it("should verify Level 1 has 6 fundamental lessons", () => {
      const lvl1 = DRAWING_CURRICULUM.find((l) => l.level === 1);
      expect(lvl1).toBeDefined();
      expect(lvl1?.title).toBe("Level 1 – Drawing Fundamentals");
      expect(lvl1?.lessons).toHaveLength(6);
    });

    it("should verify Level 2 has 6 shape & form lessons", () => {
      const lvl2 = DRAWING_CURRICULUM.find((l) => l.level === 2);
      expect(lvl2).toBeDefined();
      expect(lvl2?.title).toBe("Level 2 – Shapes and Forms");
      expect(lvl2?.lessons).toHaveLength(6);
    });

    it("should verify Level 3 has 7 proportion & observation lessons", () => {
      const lvl3 = DRAWING_CURRICULUM.find((l) => l.level === 3);
      expect(lvl3).toBeDefined();
      expect(lvl3?.title).toBe("Level 3 – Proportion and Observation");
      expect(lvl3?.lessons).toHaveLength(7);
    });

    it("should verify Level 4 has 7 grid & reference lessons", () => {
      const lvl4 = DRAWING_CURRICULUM.find((l) => l.level === 4);
      expect(lvl4).toBeDefined();
      expect(lvl4?.title).toBe("Level 4 – Grid and Reference Drawing");
      expect(lvl4?.lessons).toHaveLength(7);
    });

    it("should verify Level 5 has 6 Loomis face construction lessons", () => {
      const lvl5 = DRAWING_CURRICULUM.find((l) => l.level === 5);
      expect(lvl5).toBeDefined();
      expect(lvl5?.title).toBe("Level 5 – Face Drawing");
      expect(lvl5?.lessons).toHaveLength(6);
    });

    it("should verify Level 6 has 5 shading fundamentals lessons", () => {
      const lvl6 = DRAWING_CURRICULUM.find((l) => l.level === 6);
      expect(lvl6).toBeDefined();
      expect(lvl6?.title).toBe("Level 6 – Shading Fundamentals");
      expect(lvl6?.lessons).toHaveLength(5);
    });

    it("should verify Level 7 has 3 complete drawing practice lessons", () => {
      const lvl7 = DRAWING_CURRICULUM.find((l) => l.level === 7);
      expect(lvl7).toBeDefined();
      expect(lvl7?.title).toBe("Level 7 – Complete Drawing Practice");
      expect(lvl7?.lessons).toHaveLength(3);
    });

    it("should ensure every lesson has valid metadata, completion criteria, and steps", () => {
      const all = getAllLessons();
      all.forEach((lesson) => {
        expect(lesson.id).toMatch(/^l\d-\d{2}$/);
        expect(lesson.title.trim().length).toBeGreaterThan(5);
        expect(lesson.objective.trim().length).toBeGreaterThan(15);
        expect(lesson.estimatedMinutes).toBeGreaterThanOrEqual(10);
        expect(lesson.completionCriteria.trim().length).toBeGreaterThan(5);
        expect(lesson.practiceActivity.trim().length).toBeGreaterThan(5);
        expect(lesson.steps.length).toBeGreaterThanOrEqual(3);

        lesson.steps.forEach((step, idx) => {
          expect(step.stepNumber).toBe(idx + 1);
          expect(step.title.trim().length).toBeGreaterThan(3);
          expect(step.instruction.trim().length).toBeGreaterThan(15);
          if (step.tip) {
            expect(step.tip.trim().length).toBeGreaterThan(5);
          }
        });
      });
    });

    it("should ensure every lesson includes physical materials, paper guidance, common mistakes, and self-assessment checklist (Sub-Phase 7A)", () => {
      const all = getAllLessons();
      all.forEach((lesson) => {
        expect(lesson.requiredMaterials).toBeDefined();
        expect(lesson.requiredMaterials!.length).toBeGreaterThanOrEqual(3);
        expect(lesson.physicalPaperGuidance).toBeDefined();
        expect(lesson.physicalPaperGuidance!.trim().length).toBeGreaterThan(20);
        expect(lesson.commonMistakes).toBeDefined();
        expect(lesson.commonMistakes!.length).toBeGreaterThanOrEqual(2);
        lesson.commonMistakes!.forEach((m) => {
          expect(m.mistake.trim().length).toBeGreaterThan(5);
          expect(m.prevention.trim().length).toBeGreaterThan(5);
        });
        expect(lesson.selfAssessmentChecklist).toBeDefined();
        expect(lesson.selfAssessmentChecklist!.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe("3. Lesson Navigation Helpers", () => {
    it("should fetch lesson by ID correctly", () => {
      const lesson = getLessonById("l1-01");
      expect(lesson).toBeDefined();
      expect(lesson?.title).toBe("Understanding Drawing Materials");
      expect(lesson?.level).toBe(1);
      expect(lesson?.lessonNumber).toBe(1);
    });

    it("should return undefined for invalid lesson ID", () => {
      const lesson = getLessonById("lesson-non-existent");
      expect(lesson).toBeUndefined();
    });

    it("should find the next lesson in sequence", () => {
      const next = getNextLesson("l1-01");
      expect(next).toBeDefined();
      expect(next?.id).toBe("l1-02");
      expect(next?.title).toBe("Holding a Pencil for Traditional Drawing");
    });

    it("should find the next lesson across level boundaries", () => {
      // Level 1 lesson 6 is the last lesson of Level 1
      const next = getNextLesson("l1-06");
      expect(next).toBeDefined();
      expect(next?.id).toBe("l2-01");
      expect(next?.level).toBe(2);
    });

    it("should return undefined when requesting next lesson from the final capstone", () => {
      const lastLessonId = "l7-03";
      const next = getNextLesson(lastLessonId);
      expect(next).toBeUndefined();
    });

    it("should find the previous lesson in sequence", () => {
      const prev = getPreviousLesson("l1-02");
      expect(prev).toBeDefined();
      expect(prev?.id).toBe("l1-01");
    });

    it("should find the previous lesson across level boundaries", () => {
      const prev = getPreviousLesson("l2-01");
      expect(prev).toBeDefined();
      expect(prev?.id).toBe("l1-06");
      expect(prev?.level).toBe(1);
    });

    it("should return undefined when requesting previous lesson from the first lesson", () => {
      const prev = getPreviousLesson("l1-01");
      expect(prev).toBeUndefined();
    });
  });

  describe("4. Learning Progress & Active Lesson Persistence", () => {
    it("should track and persist active lesson ID", async () => {
      expect(useAppStore.getState().activeLessonId).toBeNull();

      await useAppStore.getState().setActiveLessonId("l3-02");
      expect(useAppStore.getState().activeLessonId).toBe("l3-02");

      const persisted = await database.getActiveLessonId();
      expect(persisted).toBe("l3-02");
    });

    it("should track and persist step progress for a lesson", async () => {
      // Default step is 1
      const initialStep = await database.getLessonStepProgress("l1-03");
      expect(initialStep).toBe(1);

      await database.saveLessonStepProgress("l1-03", 2);
      const updatedStep = await database.getLessonStepProgress("l1-03");
      expect(updatedStep).toBe(2);
    });

    it("should mark a lesson as completed explicitly", async () => {
      expect(useAppStore.getState().lessonProgress["l1-01"]).toBeFalsy();

      await useAppStore.getState().setLessonCompleted("l1-01", true);
      expect(useAppStore.getState().lessonProgress["l1-01"]).toBe(true);

      const dbLessons = await database.getLessonProgress();
      expect(dbLessons["l1-01"]?.completed).toBe(true);
    });

    it("should unmark a lesson completion if needed", async () => {
      await useAppStore.getState().setLessonCompleted("l1-01", true);
      expect(useAppStore.getState().lessonProgress["l1-01"]).toBe(true);

      await useAppStore.getState().setLessonCompleted("l1-01", false);
      expect(useAppStore.getState().lessonProgress["l1-01"]).toBe(false);
    });
  });

  describe("5. Professional Telemetry & Overlay Parametric Updates", () => {
    it("should update Loomis yaw, pitch, and stages via updateOverlay", () => {
      const initialLoomis: LoomisOverlayConfig = {
        id: "loomis-pro-01",
        type: "loomis",
        name: "Loomis 3D Head",
        visible: true,
        opacity: 0.85,
        locked: false,
        zIndex: 1,
        stage: 2,
        yaw: 0,
        pitch: 0,
        roll: 0,
        jawLength: 1.0,
        showConstructionPlanes: true,
        color: "#E2934D",
        strokeWidth: 1.5,
        centerX: 0.5,
        centerY: 0.5,
        radius: 0.25,
      };

      useAppStore.getState().addOverlay(initialLoomis);
      const overlays = useAppStore.getState().currentProject?.overlays ?? [];
      expect(overlays).toHaveLength(1);
      expect((overlays[0] as LoomisOverlayConfig).stage).toBe(2);

      // Fine-tune parameters in Pro mode
      const updatedLoomis: LoomisOverlayConfig = {
        ...initialLoomis,
        stage: 5,
        yaw: 25,
        pitch: -15,
        jawLength: 1.2,
      };

      useAppStore.getState().updateOverlay(updatedLoomis);
      const current = useAppStore.getState().currentProject?.overlays ?? [];
      const modified = current.find((o) => o.id === "loomis-pro-01") as LoomisOverlayConfig;
      expect(modified.stage).toBe(5);
      expect(modified.yaw).toBe(25);
      expect(modified.pitch).toBe(-15);
      expect(modified.jawLength).toBe(1.2);
    });

    it("should update Perspective vanishing points and rays via updateOverlay", () => {
      const initialPerspective: PerspectiveOverlayConfig = {
        id: "persp-pro-01",
        type: "perspective",
        name: "2-Point Perspective",
        visible: true,
        opacity: 0.8,
        locked: false,
        zIndex: 2,
        mode: "2-point",
        horizonY: 0.5,
        vp1X: 0.1,
        vp2X: 0.9,
        vp3Y: 0.1,
        rayCount: 8,
        showVerticals: true,
        color: "#6CD498",
        strokeWidth: 1.5,
      };

      useAppStore.getState().addOverlay(initialPerspective);

      const updatedPerspective: PerspectiveOverlayConfig = {
        ...initialPerspective,
        mode: "3-point",
        horizonY: 0.45,
        vp3Y: 0.05,
        rayCount: 16,
      };

      useAppStore.getState().updateOverlay(updatedPerspective);
      const current = useAppStore.getState().currentProject?.overlays ?? [];
      const modified = current.find((o) => o.id === "persp-pro-01") as PerspectiveOverlayConfig;
      expect(modified.mode).toBe("3-point");
      expect(modified.horizonY).toBe(0.45);
      expect(modified.rayCount).toBe(16);
      expect(modified.vp3Y).toBe(0.05);
    });

    it("should update Shading light angle, elevation, and value steps via updateOverlay", () => {
      const initialShading: ShadingOverlayConfig = {
        id: "shading-pro-01",
        type: "shading",
        name: "5-Value Shading",
        visible: true,
        opacity: 0.9,
        locked: false,
        zIndex: 3,
        valueSteps: 5,
        lightAngle: 45,
        lightElevation: 45,
        showTerminator: true,
        showLightRay: true,
        contrast: 1.2,
        showGraphiteGuide: true,
      };

      useAppStore.getState().addOverlay(initialShading);

      const updatedShading: ShadingOverlayConfig = {
        ...initialShading,
        valueSteps: 3,
        lightAngle: 135,
        lightElevation: 60,
        showLightRay: false,
      };

      useAppStore.getState().updateOverlay(updatedShading);
      const current = useAppStore.getState().currentProject?.overlays ?? [];
      const modified = current.find((o) => o.id === "shading-pro-01") as ShadingOverlayConfig;
      expect(modified.valueSteps).toBe(3);
      expect(modified.lightAngle).toBe(135);
      expect(modified.lightElevation).toBe(60);
      expect(modified.showLightRay).toBe(false);
    });

    it("should update Grid mode and physical spacing via updateOverlay", () => {
      const initialGrid: GridOverlayConfig = {
        id: "grid-pro-01",
        type: "grid",
        name: "Standard Grid",
        visible: true,
        opacity: 0.7,
        locked: false,
        zIndex: 1,
        mode: "standard",
        cellMode: "square",
        divisions: 4,
        color: "#A74335",
        strokeWidth: 1.0,
        showLabels: true,
        showDiagonals: false,
        showSubdivisions: false,
      };

      useAppStore.getState().addOverlay(initialGrid);

      const updatedGrid: GridOverlayConfig = {
        ...initialGrid,
        mode: "golden",
        divisions: 6,
        showDiagonals: true,
      };

      useAppStore.getState().updateOverlay(updatedGrid);
      const current = useAppStore.getState().currentProject?.overlays ?? [];
      const modified = current.find((o) => o.id === "grid-pro-01") as GridOverlayConfig;
      expect(modified.mode).toBe("golden");
      expect(modified.divisions).toBe(6);
      expect(modified.showDiagonals).toBe(true);
    });
  });
});
