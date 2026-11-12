/**
 * ARTISTRY AI — Sub-Phase 7D: Drawing Comparison & Feedback Test Suite
 * Tests image alignment mathematics, transform calculations, visual discrepancy analysis,
 * confidence handling, traditional drawing suggestions, and SQLite comparison persistence.
 */

import { ComparisonTransform } from "../ComparisonTransform";
import { DrawingFeedbackEngine } from "../DrawingFeedbackEngine";
import { DEFAULT_ALIGNMENT_SETTINGS, SavedDrawingComparisonRecord } from "../types";
import {
  deleteDrawingComparison,
  getDrawingComparisons,
  getDrawingComparisonsByProject,
  getLessonProgress,
  getPracticeSessions,
  getReferenceAnalyses,
  saveDrawingComparison,
} from "../../../storage/database";

describe("Phase 7D: Drawing Comparison & Feedback", () => {
  describe("1. Alignment Calculations & Transforms", () => {
    it("should sanitize alignment parameters within safe bounds", () => {
      const sanitized = ComparisonTransform.sanitizeAlignment({
        scale: 10.0, // should clamp to 5.0
        rotationDeg: 250, // should clamp to 180
        translateX: 3000, // should clamp to 2000
        translateY: -3000, // should clamp to -2000
      });

      expect(sanitized.scale).toBe(5.0);
      expect(sanitized.rotationDeg).toBe(180);
      expect(sanitized.translateX).toBe(2000);
      expect(sanitized.translateY).toBe(-2000);
      expect(sanitized.preserveAspectRatio).toBe(true);
    });

    it("should reset alignment to initial defaults", () => {
      const reset = ComparisonTransform.resetAlignment();
      expect(reset).toEqual(DEFAULT_ALIGNMENT_SETTINGS);
      expect(reset.scale).toBe(1.0);
      expect(reset.translateX).toBe(0);
      expect(reset.translateY).toBe(0);
      expect(reset.rotationDeg).toBe(0);
      expect(reset.flipHorizontal).toBe(false);
    });

    it("should adjust zoom scale factor correctly", () => {
      let align = DEFAULT_ALIGNMENT_SETTINGS;
      align = ComparisonTransform.applyZoom(align, 1.2);
      expect(align.scale).toBeCloseTo(1.2, 2);

      align = ComparisonTransform.applyZoom(align, 0.5);
      expect(align.scale).toBeCloseTo(0.6, 2);
    });

    it("should apply pan translation in viewport space", () => {
      let align = DEFAULT_ALIGNMENT_SETTINGS;
      align = ComparisonTransform.applyPan(align, 25, -40);
      expect(align.translateX).toBe(25);
      expect(align.translateY).toBe(-40);

      align = ComparisonTransform.applyPan(align, -10, 20);
      expect(align.translateX).toBe(15);
      expect(align.translateY).toBe(-20);
    });

    it("should rotate with angle wraparound within [-180, 180]", () => {
      let align = DEFAULT_ALIGNMENT_SETTINGS;
      align = ComparisonTransform.applyRotation(align, 45);
      expect(align.rotationDeg).toBe(45);

      align = ComparisonTransform.applyRotation(align, 150);
      expect(align.rotationDeg).toBe(-165); // 195 - 360 = -165
    });

    it("should generate valid React Native transform array", () => {
      const transforms = ComparisonTransform.getTransformStyles({
        scale: 1.5,
        translateX: 10,
        translateY: 20,
        rotationDeg: 15,
        flipHorizontal: true,
        preserveAspectRatio: true,
      });

      expect(transforms).toEqual([
        { translateX: 10 },
        { translateY: 20 },
        { rotate: "15deg" },
        { scaleX: -1.5 },
        { scaleY: 1.5 },
      ]);
    });

    it("should transform point coordinates accurately", () => {
      const center = { x: 100, y: 100 };
      const pt = { x: 120, y: 100 }; // 20 units right of center

      // 90 degree clockwise rotation around center
      const rotated = ComparisonTransform.transformPoint(
        pt,
        { ...DEFAULT_ALIGNMENT_SETTINGS, rotationDeg: 90 },
        center
      );

      expect(rotated.x).toBeCloseTo(100, 1);
      expect(rotated.y).toBeCloseTo(120, 1);
    });

    it("should calculate auto-fit scale preserving aspect ratio", () => {
      const scale = ComparisonTransform.calculateFitScale(1000, 2000, 400, 400);
      expect(scale).toBeCloseTo(400 / 2000, 2); // 0.2
    });
  });

  describe("2. Drawing Feedback Engine & Difference Analysis", () => {
    it("should throw an error if image URIs are missing", () => {
      expect(() => DrawingFeedbackEngine.analyzeComparison("", "file:///draw.jpg")).toThrow(
        "Both referenceUri and drawingUri are required"
      );
      expect(() => DrawingFeedbackEngine.analyzeComparison("file:///ref.jpg", "")).toThrow(
        "Both referenceUri and drawingUri are required"
      );
    });

    it("should generate structured feedback covering all 6 mandatory categories", () => {
      const result = DrawingFeedbackEngine.analyzeComparison(
        "file:///ref.jpg",
        "file:///draw.jpg",
        {
          referenceDimensions: { width: 800, height: 1000 },
          drawingDimensions: { width: 700, height: 1000 },
          alignment: {
            scale: 1.0,
            translateX: 15,
            translateY: -20,
            rotationDeg: 5,
            flipHorizontal: false,
            preserveAspectRatio: true,
          },
        }
      );

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^comp-fb-/);
      expect(result.overallMatchScore).toBeGreaterThanOrEqual(0);
      expect(result.overallMatchScore).toBeLessThanOrEqual(100);

      const categories = result.items.map((i) => i.category);
      expect(categories).toContain("proportion");
      expect(categories).toContain("placement");
      expect(categories).toContain("angle");
      expect(categories).toContain("contour");
      expect(categories).toContain("spacing");
      expect(categories).toContain("tonal");
    });

    it("should flag proportion variance when aspect ratios differ significantly", () => {
      const result = DrawingFeedbackEngine.analyzeComparison(
        "file:///ref.jpg",
        "file:///draw.jpg",
        {
          referenceDimensions: { width: 1000, height: 1000 }, // aspect 1.0
          drawingDimensions: { width: 800, height: 1000 },    // aspect 0.8 (-20%)
        }
      );

      const propItem = result.items.find((i) => i.category === "proportion");
      expect(propItem).toBeDefined();
      expect(propItem?.detectedDifference).toContain("narrower");
      expect(propItem?.severity).toBe("significant");
      expect(propItem?.suggestedCorrection).toContain("2H pencil");
    });

    it("should detect angular tilt deviations", () => {
      const result = DrawingFeedbackEngine.analyzeComparison(
        "file:///ref.jpg",
        "file:///draw.jpg",
        {
          alignment: {
            ...DEFAULT_ALIGNMENT_SETTINGS,
            rotationDeg: 7,
          },
        }
      );

      const angleItem = result.items.find((i) => i.category === "angle");
      expect(angleItem).toBeDefined();
      expect(angleItem?.detectedDifference).toContain("7°");
      expect(angleItem?.suggestedCorrection).toContain("sighting pencil");
    });

    it("should include transparent limitations notice communicating camera and paper variables", () => {
      const result = DrawingFeedbackEngine.analyzeComparison(
        "file:///ref.jpg",
        "file:///draw.jpg"
      );

      expect(result.limitationsNotice).toContain("camera angle");
      expect(result.limitationsNotice).toContain("paper slant");
      expect(result.limitationsNotice).toContain("sighting dividers");
      expect(result.isLocalProcessing).toBe(true);
    });
  });

  describe("3. SQLite Persistence & Saved Comparisons", () => {
    it("should save, retrieve, and delete comparison records", async () => {
      const feedback = DrawingFeedbackEngine.analyzeComparison(
        "file:///ref_saved.jpg",
        "file:///draw_saved.jpg"
      );

      const now = Date.now();
      const record: SavedDrawingComparisonRecord = {
        id: "comp-test-001",
        projectId: "proj-comparison-test",
        referenceUri: "file:///ref_saved.jpg",
        drawingUri: "file:///draw_saved.jpg",
        alignment: { ...DEFAULT_ALIGNMENT_SETTINGS, scale: 1.15, rotationDeg: -4 },
        comparisonMode: "split_view",
        feedback,
        userNotes: "Corrected eye placement with kneaded eraser.",
        createdAt: now,
      };

      await saveDrawingComparison(record);

      const all = await getDrawingComparisons(10);
      expect(all.length).toBeGreaterThan(0);
      const found = all.find((c) => c.id === "comp-test-001");
      expect(found).toBeDefined();
      expect(found?.comparisonMode).toBe("split_view");
      expect(found?.alignment.scale).toBe(1.15);
      expect(found?.userNotes).toBe("Corrected eye placement with kneaded eraser.");

      const byProj = await getDrawingComparisonsByProject("proj-comparison-test");
      expect(byProj.length).toBeGreaterThan(0);
      expect(byProj.some((c) => c.id === "comp-test-001")).toBe(true);

      // Clean up
      await deleteDrawingComparison("comp-test-001");
      const afterDel = await getDrawingComparisons(10);
      expect(afterDel.find((c) => c.id === "comp-test-001")).toBeUndefined();
    });
  });

  describe("4. Non-Destructive Continuity with Previous Sub-Phases", () => {
    it("should ensure lesson progress, practice sessions, and reference analyses are preserved", async () => {
      const lessonProgress = await getLessonProgress();
      expect(lessonProgress).toBeDefined();

      const practiceSessions = await getPracticeSessions(5);
      expect(Array.isArray(practiceSessions)).toBe(true);

      const refAnalyses = await getReferenceAnalyses(5);
      expect(Array.isArray(refAnalyses)).toBe(true);
    });
  });
});
