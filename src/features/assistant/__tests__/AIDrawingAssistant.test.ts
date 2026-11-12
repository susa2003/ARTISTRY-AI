/**
 * ARTISTRY AI — Sub-Phase 7C: AI Drawing Assistant & Reference Analysis Test Suite
 * Tests analysis request validation, explicit consent enforcement,
 * offline fallback handling, structured analysis quality, drawing sequence generator,
 * contextual coach Q&A, and SQLite analysis persistence.
 */

import { AIDrawingAssistantEngine } from "../AIDrawingAssistantEngine";
import {
  getPrivacyDisclosure,
  getRemoteAIConsent,
  setRemoteAIConsent,
} from "../ConsentManager";
import { generateDrawingSequence } from "../DrawingSequenceGenerator";
import type {
  CompositionAnalysis,
  ConstructionAnalysis,
  LightingAnalysis,
  SavedReferenceAnalysisRecord,
} from "../types";
import {
  deleteReferenceAnalysis,
  getLessonProgress,
  getPracticeSessions,
  getReferenceAnalyses,
  getReferenceAnalysesByProject,
  saveReferenceAnalysis,
} from "../../../storage/database";

describe("Phase 7C: AI Drawing Assistant & Reference Analysis", () => {
  describe("1. Analysis Request Validation", () => {
    it("should throw an error if imageUri is empty or whitespace", async () => {
      await expect(AIDrawingAssistantEngine.analyzeReference("")).rejects.toThrow(
        "Invalid reference image: URI must be a non-empty string."
      );
      await expect(AIDrawingAssistantEngine.analyzeReference("   ")).rejects.toThrow(
        "Invalid reference image: URI must be a non-empty string."
      );
    });

    it("should successfully process a valid reference image URI", async () => {
      const result = await AIDrawingAssistantEngine.analyzeReference(
        "file:///test/portrait_reference.jpg",
        { width: 800, height: 1100, categoryHint: "portrait" }
      );

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^ref-an-/);
      expect(result.imageUri).toBe("file:///test/portrait_reference.jpg");
      expect(result.composition).toBeDefined();
      expect(result.construction).toBeDefined();
      expect(result.lighting).toBeDefined();
      expect(result.recommendedMethods.length).toBeGreaterThanOrEqual(2);
      expect(result.drawingSequence.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("2. Explicit Consent Enforcement & Privacy", () => {
    it("should provide transparent privacy disclosures and offline guarantees", () => {
      const disclosure = getPrivacyDisclosure();
      expect(disclosure.title).toBeDefined();
      expect(disclosure.localGuarantee).toContain("Offline / Local Mode");
      expect(disclosure.localGuarantee).toContain("NEVER leave your device");
      expect(disclosure.cloudNotice).toContain("Remote Cloud Processing");
    });

    it("should manage user consent persistence cleanly", async () => {
      await setRemoteAIConsent(false);
      expect(await getRemoteAIConsent()).toBe(false);

      await setRemoteAIConsent(true);
      expect(await getRemoteAIConsent()).toBe(true);

      // Reset to false for default safe privacy
      await setRemoteAIConsent(false);
      expect(await getRemoteAIConsent()).toBe(false);
    });

    it("should enforce local-only fallback when consent is false even if allowCloud is requested", async () => {
      await setRemoteAIConsent(false);
      const result = await AIDrawingAssistantEngine.analyzeReference(
        "file:///test/still_life.jpg",
        { allowCloud: true, width: 1000, height: 1000 }
      );

      expect(result.isLocalFallback).toBe(true);
    });
  });

  describe("3. Structured Reference Analysis Quality", () => {
    it("should generate thorough composition analysis with placement and shapes", async () => {
      const result = await AIDrawingAssistantEngine.analyzeReference(
        "file:///test/ref.jpg",
        { width: 600, height: 900, categoryHint: "portrait" }
      );

      const comp = result.composition;
      expect(comp.category).toBe("portrait");
      expect(comp.mainSubject.length).toBeGreaterThan(5);
      expect(comp.subjectPlacement.length).toBeGreaterThan(5);
      expect(comp.majorShapes.length).toBeGreaterThanOrEqual(2);
      expect(comp.overallComposition.length).toBeGreaterThan(10);
      expect(comp.aspectRatioEstimate).toBeCloseTo(600 / 900, 2);
    });

    it("should generate construction analysis with calibration disclaimer", async () => {
      const result = await AIDrawingAssistantEngine.analyzeReference(
        "file:///test/ref.jpg",
        { width: 800, height: 1000, categoryHint: "portrait" }
      );

      const constr = result.construction;
      expect(constr.basicGeometricConstruction.length).toBeGreaterThanOrEqual(2);
      expect(constr.proportionRelationships.length).toBeGreaterThanOrEqual(2);
      expect(constr.mainAxesAndAlignment.length).toBeGreaterThanOrEqual(2);
      expect(constr.approximateLandmarks.length).toBeGreaterThanOrEqual(2);
      expect(constr.calibrationNote).toContain("Approximate visual estimates");
    });

    it("should generate directional lighting analysis and 5-step tonal scale", async () => {
      const result = await AIDrawingAssistantEngine.analyzeReference(
        "file:///test/ref.jpg",
        { width: 800, height: 800, categoryHint: "still_life" }
      );

      const light = result.lighting;
      expect(light.lightSourceDirection.length).toBeGreaterThan(5);
      expect(light.highlightRegions.length).toBeGreaterThanOrEqual(1);
      expect(light.coreShadows.length).toBeGreaterThanOrEqual(1);
      expect(light.castShadows.length).toBeGreaterThanOrEqual(1);
      expect(light.recommendedTonalSteps).toBe(5);
    });

    it("should recommend existing overlay tools aligned with traditional drawing methods", async () => {
      const portraitResult = await AIDrawingAssistantEngine.analyzeReference(
        "file:///test/portrait.jpg",
        { categoryHint: "portrait" }
      );
      const portraitMethodTypes = portraitResult.recommendedMethods.map((m) => m.method);
      expect(portraitMethodTypes).toContain("loomis");
      expect(portraitMethodTypes).toContain("shading");
      expect(portraitMethodTypes).toContain("grid");

      const stillLifeResult = await AIDrawingAssistantEngine.analyzeReference(
        "file:///test/still_life.jpg",
        { categoryHint: "still_life" }
      );
      const stillLifeMethodTypes = stillLifeResult.recommendedMethods.map((m) => m.method);
      expect(stillLifeMethodTypes).toContain("perspective");
      expect(stillLifeMethodTypes).toContain("grid");
      expect(stillLifeMethodTypes).toContain("shading");
    });
  });

  describe("4. Drawing Sequence Generator", () => {
    it("should generate practical paper-centric steps for portraits", () => {
      const comp: CompositionAnalysis = {
        mainSubject: "Portrait",
        category: "portrait",
        subjectPlacement: "Center",
        majorShapes: ["Sphere", "Wedge"],
        overallComposition: "Pyramidal",
        aspectRatioEstimate: 0.75,
      };
      const constr: ConstructionAnalysis = {
        basicGeometricConstruction: ["Cranium sphere", "Jaw wedge"],
        proportionRelationships: ["Brow at 1/2 height"],
        mainAxesAndAlignment: ["Vertical centerline ~5°"],
        approximateLandmarks: ["Glabella", "Mandible"],
        calibrationNote: "Approximate",
      };
      const light: LightingAnalysis = {
        lightSourceDirection: "Top-left 45°",
        highlightRegions: ["Brow"],
        midtones: ["Cheek"],
        coreShadows: ["Terminator"],
        castShadows: ["Neck shadow"],
        recommendedTonalSteps: 5,
      };

      const sequence = generateDrawingSequence("portrait", comp, constr, light, [
        "loomis",
        "shading",
        "grid",
      ]);

      expect(sequence).toHaveLength(8);
      sequence.forEach((step, idx) => {
        expect(step.stepNumber).toBe(idx + 1);
        expect(step.title.length).toBeGreaterThan(5);
        expect(step.action.length).toBeGreaterThan(15);
        expect(step.physicalPaperGuidance.length).toBeGreaterThan(15);
        expect(["2H", "H", "HB", "2B", "4B", "6B"]).toContain(step.recommendedPencilGrade);
      });

      // Verify progression of graphite grades from construction (2H) to darks (4B)
      expect(sequence[0]?.recommendedPencilGrade).toBe("2H");
      expect(sequence[sequence.length - 1]?.recommendedPencilGrade).toBe("4B");
    });

    it("should generate practical paper-centric steps for figures", () => {
      const comp: CompositionAnalysis = {
        mainSubject: "Standing Figure",
        category: "figure",
        subjectPlacement: "Center",
        majorShapes: ["Torso", "Limbs"],
        overallComposition: "Contrapposto",
        aspectRatioEstimate: 0.5,
      };
      const constr: ConstructionAnalysis = {
        basicGeometricConstruction: ["Torso bean", "Cylinders"],
        proportionRelationships: ["8 heads height"],
        mainAxesAndAlignment: ["Spine line of action"],
        approximateLandmarks: ["Pit of neck", "Pelvis"],
        calibrationNote: "Approximate",
      };
      const light: LightingAnalysis = {
        lightSourceDirection: "Frontal top-down",
        highlightRegions: ["Chest"],
        midtones: ["Abs"],
        coreShadows: ["Flank"],
        castShadows: ["Ground"],
        recommendedTonalSteps: 5,
      };

      const sequence = generateDrawingSequence("figure", comp, constr, light, [
        "anatomy",
        "bargue",
        "shading",
      ]);

      expect(sequence).toHaveLength(6);
      expect(sequence[0]?.title).toContain("Line of Action");
      expect(sequence[1]?.title).toContain("8-Head");
    });
  });

  describe("5. Contextual AI Drawing Coach Q&A", () => {
    it("should answer question about how to start the drawing", async () => {
      const result = await AIDrawingAssistantEngine.analyzeReference(
        "file:///test/portrait.jpg",
        { categoryHint: "portrait" }
      );

      const qa = AIDrawingAssistantEngine.askDrawingCoach(result, "How should I start this drawing?");
      expect(qa.question).toContain("How should I start");
      expect(qa.answer).toContain("2H pencil");
      expect(qa.suggestedOverlay).toBeDefined();
    });

    it("should answer question about placing the centerline", async () => {
      const result = await AIDrawingAssistantEngine.analyzeReference(
        "file:///test/portrait.jpg",
        { categoryHint: "portrait" }
      );

      const qa = AIDrawingAssistantEngine.askDrawingCoach(result, "Where should I place the centerline?");
      expect(qa.answer).toContain("centerline");
      expect(qa.suggestedOverlay).toBe("loomis");
    });

    it("should answer question about light source and shading", async () => {
      const result = await AIDrawingAssistantEngine.analyzeReference(
        "file:///test/still_life.jpg",
        { categoryHint: "still_life" }
      );

      const qa = AIDrawingAssistantEngine.askDrawingCoach(result, "Where is the light source?");
      expect(qa.answer).toContain(result.lighting.lightSourceDirection);
      expect(qa.suggestedOverlay).toBe("shading");
    });

    it("should recommend optimal physical grid spacing for paper", async () => {
      const result = await AIDrawingAssistantEngine.analyzeReference(
        "file:///test/ref.jpg"
      );

      const qa = AIDrawingAssistantEngine.askDrawingCoach(result, "Which grid spacing should I choose?");
      expect(qa.answer).toContain("20 mm");
      expect(qa.suggestedOverlay).toBe("grid");
    });
  });

  describe("6. SQLite Persistence & Saved Analysis History", () => {
    it("should save, query, and delete reference analyses", async () => {
      const result = await AIDrawingAssistantEngine.analyzeReference(
        "file:///test/saved_study.jpg",
        { categoryHint: "portrait" }
      );

      const now = Date.now();
      const record: SavedReferenceAnalysisRecord = {
        id: "saved-an-01",
        projectId: "proj-workstation-001",
        imageUri: result.imageUri,
        createdAt: now,
        analysis: result,
        userNotes: "Focus on cranial ball roundness and 5-step shading.",
      };

      await saveReferenceAnalysis(record);

      const all = await getReferenceAnalyses(10);
      expect(all.length).toBeGreaterThan(0);
      const found = all.find((a) => a.id === "saved-an-01");
      expect(found).toBeDefined();
      expect(found?.userNotes).toBe("Focus on cranial ball roundness and 5-step shading.");
      expect(found?.analysis.composition.mainSubject).toBe(result.composition.mainSubject);

      const byProject = await getReferenceAnalysesByProject("proj-workstation-001");
      expect(byProject.length).toBeGreaterThan(0);
      expect(byProject.some((a) => a.id === "saved-an-01")).toBe(true);

      // Clean up
      await deleteReferenceAnalysis("saved-an-01");
      const afterDelete = await getReferenceAnalyses(10);
      expect(afterDelete.find((a) => a.id === "saved-an-01")).toBeUndefined();
    });
  });

  describe("7. Non-Destructive Continuity with Previous Phases", () => {
    it("should ensure lesson progress and practice sessions are untouched", async () => {
      const lessonProgress = await getLessonProgress();
      expect(lessonProgress).toBeDefined();

      const practiceSessions = await getPracticeSessions(5);
      expect(Array.isArray(practiceSessions)).toBe(true);
    });
  });
});
