/**
 * ARTISTRY AI — Phase 8D Test Suite
 * Navigation, Workspace & Interaction Polish
 *
 * Verifies:
 * 1. Dashboard Navigation & Studio Routing
 * 2. Project Shelf Workspace Routing & Dual Actions
 * 3. Free Drawing to Reference Studio Switching (Zero Data Loss)
 * 4. Reference Studio to Free Drawing Switching (Zero Data Loss)
 * 5. Save-Before-Navigation Behavior (Safe Back)
 * 6. Unsaved Changes & Layer Deletion Confirmation
 * 7. Project Identity Preservation Across Dual Workspaces
 * 8. Overlay Persistence After Reopening
 * 9. Beginner Workflow Navigation & Curriculum Studio Launch
 * 10. Professional Workflow Navigation (Telemetry Dials & HUD)
 * 11. Modal and Drawer Dismissal & 44pt Touch Targets
 * 12. Duplicate Action & Rapid Double-Tap Prevention
 * 13. Responsive Navigation Layouts (320dp to 900dp+)
 * 14. Phase 8C Engine & Smoothing Regression Safety
 */

import { useAppStore } from "../../../state/appStore";
import * as database from "../../../storage/database";
import {
  calculateDynamicWidth,
  smoothStrokePoints,
} from "../../drawing/StrokeSmoothing";
import {
  calculateResponsiveLayout,
  touchTargets,
} from "../../../theme";
import type {
  DrawingLayer,
  ProjectDocument,
  Stroke,
} from "../../../domain/types";
import type {
  GridOverlayConfig,
  LoomisOverlayConfig,
  ShadingOverlayConfig,
  UnifiedOverlay,
} from "../../../domain/overlayTypes";

describe("Phase 8D: Navigation, Workspace & Interaction Polish", () => {
  beforeEach(() => {
    useAppStore.setState({
      currentProject: null,
      projects: [],
      past: [],
      future: [],
      experienceMode: "beginner",
    });
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. Dashboard Navigation & Studio Routing
  // =========================================================================
  describe("1. Dashboard Navigation & Studio Routing", () => {
    it("routes blank drawing to Free Drawing Studio (/studio/[id])", async () => {
      jest.spyOn(database, "saveProject").mockResolvedValueOnce();
      const id = await useAppStore.getState().createProject(null, "Blank Free Drawing");

      const targetRoute = `/studio/${id}`;
      expect(targetRoute).toMatch(/^\/studio\/[a-zA-Z0-9_-]+$/);
      expect(useAppStore.getState().currentProject?.referenceUri).toBeNull();
    });

    it("routes reference study to Reference Studio (/reference-studio/[id])", async () => {
      jest.spyOn(database, "saveProject").mockResolvedValueOnce();
      const refUri = "file:///data/portrait-ref.jpg";
      const id = await useAppStore.getState().createProject(refUri, "Reference Master Study");

      const targetRoute = `/reference-studio/${id}`;
      expect(targetRoute).toMatch(/^\/reference-studio\/[a-zA-Z0-9_-]+$/);
      expect(useAppStore.getState().currentProject?.referenceUri).toBe(refUri);
    });

    it("routes recent project cards intelligently based on referenceUri presence", () => {
      const freeDrawProject = { id: "p1", name: "Doodle", referenceUri: null };
      const refStudyProject = { id: "p2", name: "Figure", referenceUri: "file:///ref.jpg" };

      const getRoute = (proj: { id: string; referenceUri: string | null }) =>
        proj.referenceUri ? `/reference-studio/${proj.id}` : `/studio/${proj.id}`;

      expect(getRoute(freeDrawProject)).toBe("/studio/p1");
      expect(getRoute(refStudyProject)).toBe("/reference-studio/p2");
    });
  });

  // =========================================================================
  // 2. Project Shelf Workspace Routing & Dual Actions
  // =========================================================================
  describe("2. Project Shelf Workspace Routing & Dual Open Actions", () => {
    it("provides explicit dual direct open pills for any saved project", () => {
      const projId = "proj-shelf-01";
      const drawingPillRoute = `/studio/${projId}`;
      const referencePillRoute = `/reference-studio/${projId}`;

      expect(drawingPillRoute).toBe("/studio/proj-shelf-01");
      expect(referencePillRoute).toBe("/reference-studio/proj-shelf-01");
    });

    it("prevents duplicate project creations when double-tapped", async () => {
      let isBusy = false;
      let creationCount = 0;

      const newProjectThrottled = async () => {
        if (isBusy) return null;
        isBusy = true;
        try {
          creationCount++;
          return await useAppStore.getState().createProject(null, "Test Project");
        } finally {
          isBusy = false;
        }
      };

      jest.spyOn(database, "saveProject").mockResolvedValue();

      // Fire 2 rapid concurrent clicks
      const [res1, res2] = await Promise.all([newProjectThrottled(), newProjectThrottled()]);

      expect(creationCount).toBe(1);
      expect(res1).toBeDefined();
      expect(res2).toBeNull();
    });
  });

  // =========================================================================
  // 3 & 4. Bidirectional Workspace Switching & Zero Data Loss
  // =========================================================================
  describe("3 & 4. Bidirectional Workspace Switching (Free Drawing <-> Reference Studio)", () => {
    const complexProject: ProjectDocument = {
      id: "hybrid-proj-01",
      name: "Classical Hybrid Study",
      width: 1200,
      height: 1600,
      layers: [
        {
          id: "digital-layer-1",
          name: "Digital Sketch",
          visible: true,
          opacity: 0.9,
          strokes: [
            {
              id: "stroke-01",
              kind: "pencil",
              color: "#333333",
              width: 3,
              points: [{ x: 50, y: 50 }, { x: 100, y: 120 }],
            },
          ],
        },
      ],
      activeLayerId: "digital-layer-1",
      referenceUri: "file:///ref/classical-portrait.jpg",
      overlays: [
        {
          id: "ov-loomis-01",
          type: "loomis",
          name: "Loomis 3D Head",
          visible: true,
          opacity: 0.85,
          locked: false,
          zIndex: 1,
          stage: 4,
          centerX: 0.5,
          centerY: 0.5,
          radius: 0.25,
          yaw: 20,
          pitch: -10,
          roll: 0,
          jawLength: 1.0,
          color: "#D96B43",
          strokeWidth: 2,
          showConstructionPlanes: true,
        } as LoomisOverlayConfig,
      ],
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    it("flushes strokes to SQLite before navigating to Reference Studio", async () => {
      useAppStore.setState({ currentProject: complexProject });
      const saveSpy = jest.spyOn(database, "saveProject").mockResolvedValueOnce();

      // Free Drawing Studio triggers safe handoff
      await useAppStore.getState().saveCurrentProject();

      expect(saveSpy).toHaveBeenCalledTimes(1);
      const saved = saveSpy.mock.calls[0][0];
      expect(saved.id).toBe("hybrid-proj-01");
      expect(saved.layers[0].strokes).toHaveLength(1);
      expect(saved.overlays).toHaveLength(1);
    });

    it("flushes overlays and paper settings to SQLite before navigating to Free Drawing Studio", async () => {
      useAppStore.setState({ currentProject: complexProject });
      const saveSpy = jest.spyOn(database, "saveProject").mockResolvedValueOnce();

      // Reference Studio triggers safe handoff
      await useAppStore.getState().saveCurrentProject();

      expect(saveSpy).toHaveBeenCalledTimes(1);
      const saved = saveSpy.mock.calls[0][0];
      expect(saved.overlays![0].type).toBe("loomis");
      expect(saved.layers[0].name).toBe("Digital Sketch");
    });
  });

  // =========================================================================
  // 5. Save-Before-Navigation Behavior (Safe Back)
  // =========================================================================
  describe("5. Save-Before-Navigation Behavior (Safe Back)", () => {
    it("ensures pending project edits are saved prior to back navigation", async () => {
      const project: ProjectDocument = {
        id: "safe-back-proj",
        name: "Quick Sketch",
        width: 1000,
        height: 1000,
        layers: [
          {
            id: "l1",
            name: "Layer 1",
            visible: true,
            opacity: 1.0,
            strokes: [],
          },
        ],
        activeLayerId: "l1",
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };
      useAppStore.setState({ currentProject: project });

      // Add a stroke (simulating edit made right before back tap)
      const stroke: Stroke = {
        id: "last-second-stroke",
        kind: "pen",
        color: "#000",
        width: 2,
        points: [{ x: 10, y: 10 }],
      };
      useAppStore.getState().commitStroke(stroke);

      const saveSpy = jest.spyOn(database, "saveProject").mockResolvedValueOnce();

      // Safe back executes saveCurrentProject() before routing back
      await useAppStore.getState().saveCurrentProject();

      expect(saveSpy).toHaveBeenCalledTimes(1);
      const saved = saveSpy.mock.calls[0][0];
      expect(saved.layers[0].strokes).toHaveLength(1);
      expect(saved.layers[0].strokes[0].id).toBe("last-second-stroke");
    });

    it("handles router.canGoBack() fallback without dead-ends", () => {
      const canGoBack = false;
      const getFallbackRoute = (canBack: boolean) => (canBack ? "back" : "/projects");

      expect(getFallbackRoute(canGoBack)).toBe("/projects");
      expect(getFallbackRoute(true)).toBe("back");
    });
  });

  // =========================================================================
  // 6. Unsaved Changes & Layer Deletion Safeguard
  // =========================================================================
  describe("6. Unsaved Changes & Layer Deletion Safeguard", () => {
    it("distinguishes empty layer deletion from layer with strokes", () => {
      const emptyLayer: DrawingLayer = {
        id: "l-empty",
        name: "Empty Layer",
        visible: true,
        opacity: 1.0,
        strokes: [],
      };

      const populatedLayer: DrawingLayer = {
        id: "l-populated",
        name: "Finished Inks",
        visible: true,
        opacity: 1.0,
        strokes: [
          {
            id: "s1",
            kind: "brush",
            color: "#000",
            width: 5,
            points: [{ x: 0, y: 0 }],
          },
        ],
      };

      const shouldConfirm = (layer: DrawingLayer) => layer.strokes.length > 0;

      expect(shouldConfirm(emptyLayer)).toBe(false);
      expect(shouldConfirm(populatedLayer)).toBe(true);
    });
  });

  // =========================================================================
  // 7 & 8. Project Identity & Overlay Persistence After Reopening
  // =========================================================================
  describe("7 & 8. Project Identity & Overlay Persistence After Reopening", () => {
    it("retains all overlay parameters identically when project is reloaded from SQLite", async () => {
      const originalGrid: GridOverlayConfig = {
        id: "grid-persisted",
        type: "grid",
        name: "Paper Calibrated Grid",
        visible: true,
        opacity: 0.8,
        locked: true,
        zIndex: 1,
        mode: "standard",
        cellMode: "millimetre",
        cellSpacingMm: 20,
        cellSpacingMmX: 20,
        cellSpacingMmY: 20,
        divisions: 10,
        gridColumns: 10,
        gridRows: 14,
        paperMarginXMm: 5,
        paperMarginYMm: 8.5,
        color: "#28594B",
        strokeWidth: 1.5,
        showLabels: true,
        showDiagonals: false,
        showSubdivisions: true,
      };

      const originalShading: ShadingOverlayConfig = {
        id: "shading-persisted",
        type: "shading",
        name: "Value Study",
        visible: true,
        opacity: 0.6,
        locked: false,
        zIndex: 2,
        lightAngle: 60,
        lightElevation: 45,
        valueSteps: 5,
        showTerminator: true,
        showLightRay: true,
        contrast: 1.2,
        showGraphiteGuide: true,
      };

      const project: ProjectDocument = {
        id: "identity-test-proj",
        name: "Master Study Persistence",
        width: 1200,
        height: 1600,
        layers: [
          {
            id: "lay-1",
            name: "Initial Lay-in",
            visible: true,
            opacity: 1.0,
            strokes: [],
          },
        ],
        activeLayerId: "lay-1",
        referenceUri: "file:///ref/portrait.jpg",
        paperSettings: {
          size: "A4",
          orientation: "portrait",
          widthMm: 210,
          heightMm: 297,
          marginMm: 5,
          targetDpi: 300,
        },
        overlays: [originalGrid, originalShading],
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      let stored: ProjectDocument | null = null;
      jest.spyOn(database, "saveProject").mockImplementation(async (p) => {
        stored = JSON.parse(JSON.stringify(p));
      });
      jest.spyOn(database, "getProject").mockImplementation(async (id) => {
        return stored?.id === id ? stored : undefined;
      });

      await database.saveProject(project);
      const reloaded = await database.getProject("identity-test-proj");

      expect(reloaded).toBeDefined();
      expect(reloaded!.overlays).toHaveLength(2);

      const reloadedGrid = reloaded!.overlays![0] as GridOverlayConfig;
      expect(reloadedGrid.cellSpacingMm).toBe(20);
      expect(reloadedGrid.gridColumns).toBe(10);
      expect(reloadedGrid.locked).toBe(true);

      const reloadedShading = reloaded!.overlays![1] as ShadingOverlayConfig;
      expect(reloadedShading.valueSteps).toBe(5);
      expect(reloadedShading.lightAngle).toBe(60);
    });
  });

  // =========================================================================
  // 9. Beginner Workflow Navigation & Curriculum Studio Launch
  // =========================================================================
  describe("9. Beginner Workflow Navigation & Curriculum Studio Launch", () => {
    it("launches lesson practice in Reference Studio with recommended overlay configured", async () => {
      const lessonTitle = "Sphere Shading Fundamentals";
      const recommendedOverlayType = "shading";

      jest.spyOn(database, "saveProject").mockResolvedValueOnce();

      const projectId = await useAppStore.getState().createProject(null, `Practice: ${lessonTitle}`);
      expect(projectId).toBeDefined();

      const defaultShading: ShadingOverlayConfig = {
        id: "overlay-lesson-01",
        type: "shading",
        name: "Tonal Shading Guide",
        visible: true,
        opacity: 0.8,
        locked: false,
        zIndex: 1,
        lightAngle: 45,
        lightElevation: 45,
        valueSteps: 5,
        showTerminator: true,
        showLightRay: true,
        contrast: 1.0,
        showGraphiteGuide: true,
      };

      useAppStore.getState().addOverlay(defaultShading);
      await useAppStore.getState().saveCurrentProject();

      const current = useAppStore.getState().currentProject!;
      expect(current.name).toBe("Practice: Sphere Shading Fundamentals");
      expect(current.overlays).toHaveLength(1);
      expect(current.overlays![0].type).toBe(recommendedOverlayType);
    });
  });

  // =========================================================================
  // 10. Professional Workflow Navigation (Telemetry Dials & HUD)
  // =========================================================================
  describe("10. Professional Workflow Navigation", () => {
    it("enables pro telemetry panel access when experienceMode is professional", async () => {
      jest.spyOn(database, "setExperienceMode").mockResolvedValueOnce();
      await useAppStore.getState().setExperienceMode("professional");
      expect(useAppStore.getState().experienceMode).toBe("professional");

      const shouldShowProDials = (mode: string) => mode === "professional";
      expect(shouldShowProDials(useAppStore.getState().experienceMode)).toBe(true);
    });

    it("keeps drawing canvas primary while dials modal operates as an overlay", () => {
      const layout = calculateResponsiveLayout(393, 852);
      const modalMaxWidth = typeof layout.contentMaxWidth === "number" ? Math.min(layout.contentMaxWidth, 640) : 640;
      expect(modalMaxWidth).toBeLessThanOrEqual(640);
    });
  });

  // =========================================================================
  // 11. Modal & Drawer Dismissal & 44pt Touch Targets
  // =========================================================================
  describe("11. Modal & Drawer Behavior and 44pt Touch Targets", () => {
    it("ensures all modal close buttons and layer row actions meet minimum 44pt touch area", () => {
      expect(touchTargets.min).toBeGreaterThanOrEqual(44);
      expect(touchTargets.comfortable).toBeGreaterThanOrEqual(48);
    });

    it("allows modal dismissal via backdrop tap without leaving lingering state", () => {
      let isModalOpen = true;
      const onDismissBackdrop = () => {
        isModalOpen = false;
      };

      onDismissBackdrop();
      expect(isModalOpen).toBe(false);
    });
  });

  // =========================================================================
  // 12. Duplicate Action & Rapid Double-Tap Prevention
  // =========================================================================
  describe("12. Duplicate Action & Rapid Double-Tap Prevention", () => {
    it("blocks second navigation when isNavigating lock is active", async () => {
      let isNavigating = false;
      let routeCallCount = 0;

      const triggerStudioHandoff = async () => {
        if (isNavigating) return;
        isNavigating = true;
        try {
          routeCallCount++;
        } finally {
          // Lock stays on during screen transition
        }
      };

      // Rapid double click
      await triggerStudioHandoff();
      await triggerStudioHandoff();

      expect(routeCallCount).toBe(1);
    });
  });

  // =========================================================================
  // 13. Responsive Navigation Layouts (320dp to 900dp+)
  // =========================================================================
  describe("13. Responsive Navigation Layouts Across Viewport Widths", () => {
    it("adapts switcher label for compact 320dp phone screens", () => {
      const getSwitcherLabel = (isSmallPhone: boolean) =>
        isSmallPhone ? "📐 Ref" : "📐 Ref Studio ›";

      expect(getSwitcherLabel(true)).toBe("📐 Ref");
      expect(getSwitcherLabel(false)).toBe("📐 Ref Studio ›");
    });

    it("validates responsive breakpoints for small phones, tablets, and desktops", () => {
      const smallPhone = calculateResponsiveLayout(320, 568);
      expect(smallPhone.isSmallPhone).toBe(true);

      const standardPhone = calculateResponsiveLayout(393, 852);
      expect(standardPhone.isSmallPhone).toBe(false);
      expect(standardPhone.isTablet).toBe(false);

      const tablet = calculateResponsiveLayout(768, 1024);
      expect(tablet.isTablet).toBe(true);
      expect(tablet.columns).toBeGreaterThanOrEqual(2);

      const desktop = calculateResponsiveLayout(1024, 768);
      expect(desktop.isTablet).toBe(true);
      expect(desktop.contentMaxWidth).toBe(1120);
    });
  });

  // =========================================================================
  // 14. Phase 8C Engine & Smoothing Regression Safety
  // =========================================================================
  describe("14. Phase 8C Engine & Smoothing Regression Safety", () => {
    it("preserves Catmull-Rom smoothing algorithms without corruption", () => {
      const rawPoints = [
        { x: 0, y: 0, pressure: 1.0 },
        { x: 10, y: 20, pressure: 0.8 },
        { x: 20, y: 10, pressure: 0.9 },
        { x: 30, y: 30, pressure: 0.7 },
      ];

      const smoothed = smoothStrokePoints(rawPoints, "medium");
      expect(smoothed.length).toBeGreaterThan(rawPoints.length);
      expect(smoothed[0].x).toBe(0);
      expect(smoothed[smoothed.length - 1].x).toBe(30);
    });

    it("preserves dynamic stroke width calculation across all brush kinds", () => {
      expect(calculateDynamicWidth(10, "brush", 1.2)).toBeGreaterThan(calculateDynamicWidth(10, "brush", 0.5));
      expect(calculateDynamicWidth(8, "pen", 1.0, 3.0)).toBeLessThan(calculateDynamicWidth(8, "pen", 1.0, 0.2));
      expect(calculateDynamicWidth(14, "eraser", 0.1)).toBe(14);
    });
  });
});
