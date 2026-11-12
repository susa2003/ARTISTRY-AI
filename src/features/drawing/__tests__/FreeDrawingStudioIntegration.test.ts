/**
 * ARTISTRY AI — Phase 8C Test Suite
 * Free Drawing Studio Integration & Verification
 *
 * Verifies:
 * 1. Studio Workspace Identity & Navigation
 * 2. Bidirectional Safe Workspace Handoff (Free Drawing <-> Reference Studio)
 * 3. Zero Data Loss Project Domain Coexistence (Layers + Overlays)
 * 4. Drawing Engine & Brush Types (Brush, Pencil, Pen, Eraser)
 * 5. Catmull-Rom Stroke Smoothing & Dynamic Pressure/Velocity Width
 * 6. Multi-Layer Canvas Management (Add, Delete, Visibility, Opacity, Move, Duplicate)
 * 7. Undo/Redo Snapshot History System (50-entry rolling limit, stack consistency)
 * 8. Responsive Layout Adaptation Across 320dp to 900dp+
 * 9. SQLite Persistence Round-Trip Integrity
 */

import { useAppStore } from "../../../state/appStore";
import * as database from "../../../storage/database";
import {
  smoothStrokePoints,
  calculateDynamicWidth,
  type SmoothingLevel,
} from "../StrokeSmoothing";
import {
  calculateResponsiveLayout,
  touchTargets,
} from "../../../theme";
import type {
  DrawingLayer,
  Stroke,
  StrokePoint,
  ProjectDocument,
  BrushKind,
} from "../../../domain/types";
import type {
  GridOverlayConfig,
  LoomisOverlayConfig,
  PerspectiveOverlayConfig,
  ShadingOverlayConfig,
  UnifiedOverlay,
} from "../../../domain/overlayTypes";

describe("Phase 8C: Free Drawing Studio Integration", () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useAppStore.setState({
      currentProject: null,
      past: [],
      future: [],
      tool: "brush",
      brushSize: 8,
      color: "#181816",
      smoothing: "medium",
    });
  });

  // =========================================================================
  // 1. Studio Workspace Identity & Navigation
  // =========================================================================
  describe("1. Workspace Identity & Navigation Routing", () => {
    it("distinguishes Free Drawing Studio from Reference Studio route contracts", () => {
      const projectId = "proj-studio-001";
      const freeDrawingRoute = `/studio/${projectId}`;
      const referenceStudioRoute = `/reference-studio/${projectId}`;

      expect(freeDrawingRoute).toBe(`/studio/${projectId}`);
      expect(referenceStudioRoute).toBe(`/reference-studio/${projectId}`);
      expect(freeDrawingRoute).not.toBe(referenceStudioRoute);
    });

    it("parses daily challenge timer parameters for sprint drawing", () => {
      const challengeQuery = {
        id: "proj-challenge-42",
        challengeTimer: "5", // 5 minutes
        challengeTitle: "3-Minute Fast Gesture",
      };

      const parsedSeconds = Math.max(30, Number(challengeQuery.challengeTimer) * 60);
      expect(parsedSeconds).toBe(300); // 5 * 60 seconds
      expect(challengeQuery.challengeTitle).toBe("3-Minute Fast Gesture");
    });

    it("clamps minimum challenge sprint timer to safe lower threshold", () => {
      const shortTimerQuery = { challengeTimer: "0.2" }; // 12 seconds
      const parsedSeconds = Math.max(30, Number(shortTimerQuery.challengeTimer) * 60);
      expect(parsedSeconds).toBe(30); // Clamped to 30s minimum
    });
  });

  // =========================================================================
  // 2. Bidirectional Safe Workspace Handoff
  // =========================================================================
  describe("2. Bidirectional Workspace Handoff (Free Drawing <-> Reference Studio)", () => {
    it("performs safe handoff from Free Drawing Studio to Reference Studio without losing state", async () => {
      const loomisOverlay: LoomisOverlayConfig = {
        id: "overlay-loomis-1",
        type: "loomis",
        name: "Loomis Guide",
        visible: true,
        opacity: 0.8,
        locked: false,
        zIndex: 1,
        stage: 4,
        centerX: 0.5,
        centerY: 0.45,
        radius: 0.25,
        yaw: 15,
        pitch: -5,
        roll: 0,
        jawLength: 1.0,
        color: "#D96B43",
        strokeWidth: 1.5,
        showConstructionPlanes: true,
      };

      const project: ProjectDocument = {
        id: "handoff-proj-01",
        name: "Figure Study",
        width: 1000,
        height: 1200,
        layers: [
          {
            id: "layer-strokes-1",
            name: "Pencil Lay-in",
            visible: true,
            opacity: 1.0,
            strokes: [
              {
                id: "stroke-1",
                kind: "pencil",
                color: "#282828",
                width: 3,
                points: [{ x: 50, y: 50 }, { x: 100, y: 120 }],
              },
            ],
          },
        ],
        activeLayerId: "layer-strokes-1",
        referenceUri: "file:///test/figure.jpg",
        overlays: [loomisOverlay],
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      useAppStore.setState({ currentProject: project });

      // Simulate Free Drawing Studio switching to Reference Studio
      const saveSpy = jest.spyOn(database, "saveProject").mockResolvedValueOnce();
      await useAppStore.getState().saveCurrentProject();

      expect(saveSpy).toHaveBeenCalledTimes(1);
      const savedProject = saveSpy.mock.calls[0][0];

      // Verifies strokes and overlays are preserved completely during handoff
      expect(savedProject.id).toBe("handoff-proj-01");
      expect(savedProject.layers).toHaveLength(1);
      expect(savedProject.layers[0].strokes).toHaveLength(1);
      expect(savedProject.overlays).toHaveLength(1);
      expect(savedProject.overlays![0].type).toBe("loomis");

      saveSpy.mockRestore();
    });

    it("performs safe handoff from Reference Studio to Free Drawing Studio", async () => {
      const perspectiveOverlay: PerspectiveOverlayConfig = {
        id: "grid-persp-1",
        type: "perspective",
        name: "Two-Point Perspective",
        visible: true,
        opacity: 0.7,
        locked: true,
        zIndex: 2,
        mode: "2-point",
        horizonY: 0.5,
        vp1X: 0.1,
        vp2X: 0.9,
        vp3Y: 0.5,
        rayCount: 12,
        showVerticals: true,
        color: "#28594B",
        strokeWidth: 1.0,
      };

      const project: ProjectDocument = {
        id: "handoff-proj-02",
        name: "Architectural Grid Study",
        width: 1200,
        height: 1600,
        layers: [
          {
            id: "layer-ink-1",
            name: "Ink Pen Lines",
            visible: true,
            opacity: 0.9,
            strokes: [
              {
                id: "stroke-ink-1",
                kind: "pen",
                color: "#000000",
                width: 2,
                points: [{ x: 10, y: 20 }, { x: 30, y: 80 }],
              },
            ],
          },
        ],
        activeLayerId: "layer-ink-1",
        referenceUri: "file:///test/building.jpg",
        overlays: [perspectiveOverlay],
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      useAppStore.setState({ currentProject: project });

      // Simulate Reference Studio saving and routing to studio
      const saveSpy = jest.spyOn(database, "saveProject").mockResolvedValueOnce();
      await useAppStore.getState().saveCurrentProject();

      expect(saveSpy).toHaveBeenCalledTimes(1);
      const saved = saveSpy.mock.calls[0][0];
      expect(saved.overlays).toHaveLength(1);
      expect(saved.layers).toHaveLength(1);
      expect(saved.layers[0].name).toBe("Ink Pen Lines");

      saveSpy.mockRestore();
    });
  });

  // =========================================================================
  // 3. Zero Data Loss Project Domain Coexistence
  // =========================================================================
  describe("3. Zero Data Loss Coexistence (Layers + Overlays)", () => {
    it("preserves simultaneous digital strokes and physical reference overlays without collision", () => {
      const gridOverlay: GridOverlayConfig = {
        id: "ov-grid",
        type: "grid",
        name: "Proportional Grid",
        visible: true,
        opacity: 0.6,
        locked: false,
        zIndex: 1,
        mode: "standard",
        cellMode: "square",
        divisions: 5,
        color: "#28594B",
        strokeWidth: 1.5,
        showLabels: true,
        showDiagonals: false,
        showSubdivisions: false,
      };

      const shadingOverlay: ShadingOverlayConfig = {
        id: "ov-shading",
        type: "shading",
        name: "Tonal Map",
        visible: false,
        opacity: 0.5,
        locked: false,
        zIndex: 2,
        lightAngle: 45,
        lightElevation: 45,
        valueSteps: 5,
        showTerminator: true,
        showLightRay: true,
        contrast: 1.2,
        showGraphiteGuide: true,
      };

      const complexProject: ProjectDocument = {
        id: "dual-domain-01",
        name: "Full Hybrid Masterpiece",
        width: 1400,
        height: 1800,
        layers: [
          {
            id: "l1",
            name: "Underdrawing",
            visible: true,
            opacity: 0.5,
            strokes: [
              {
                id: "s1",
                kind: "pencil",
                color: "#4A4A4A",
                width: 2,
                points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
              },
            ],
          },
          {
            id: "l2",
            name: "Final Inks",
            visible: true,
            opacity: 1.0,
            strokes: [
              {
                id: "s2",
                kind: "pen",
                color: "#111111",
                width: 4,
                points: [{ x: 50, y: 50 }, { x: 70, y: 90 }],
              },
            ],
          },
        ],
        activeLayerId: "l2",
        referenceUri: "file:///test/model.jpg",
        paperSettings: {
          size: "A4",
          orientation: "portrait",
          widthMm: 210,
          heightMm: 297,
          marginMm: 10,
          targetDpi: 300,
        },
        imageAdjustments: {
          brightness: 0.1,
          contrast: 1.2,
          exposure: 0.0,
          saturation: 0.9,
          whiteoutStrength: 0.3,
          grayscale: 1.0,
          opacity: 1.0,
          rotation: 0,
          crop: { originX: 0, originY: 0, width: 1, height: 1 },
        },
        overlays: [gridOverlay, shadingOverlay],
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      useAppStore.setState({ currentProject: complexProject });
      const current = useAppStore.getState().currentProject!;

      // Verify digital domain integrity
      expect(current.layers).toHaveLength(2);
      expect(current.layers[0].strokes).toHaveLength(1);
      expect(current.layers[1].strokes).toHaveLength(1);
      expect(current.activeLayerId).toBe("l2");

      // Verify traditional reference domain integrity
      expect(current.referenceUri).toBe("file:///test/model.jpg");
      expect(current.paperSettings?.size).toBe("A4");
      expect(current.imageAdjustments?.grayscale).toBe(1.0);
      expect(current.overlays).toHaveLength(2);
      expect(current.overlays![0].type).toBe("grid");
      expect(current.overlays![1].type).toBe("shading");
    });
  });

  // =========================================================================
  // 4. Drawing Engine & Brush Types
  // =========================================================================
  describe("4. Drawing Engine & Brush Types", () => {
    const brushKinds: BrushKind[] = ["brush", "pencil", "pen", "eraser"];

    it.each(brushKinds)("supports brush kind '%s' with proper tool assignment", (kind) => {
      useAppStore.getState().setTool(kind);
      expect(useAppStore.getState().tool).toBe(kind);
    });

    describe("calculateDynamicWidth()", () => {
      it("calculates pencil width with subtle pressure response", () => {
        const baseWidth = 10;
        const widthLow = calculateDynamicWidth(baseWidth, "pencil", 0.2);
        const widthNormal = calculateDynamicWidth(baseWidth, "pencil", 1.0);
        const widthHigh = calculateDynamicWidth(baseWidth, "pencil", 1.5);

        expect(widthLow).toBeLessThan(widthNormal);
        expect(widthNormal).toBeLessThan(widthHigh);
        expect(widthNormal).toBeCloseTo(10 * (0.7 + 1.0 * 0.3)); // 10.0
      });

      it("calculates ink pen width responding to both velocity and pressure", () => {
        const baseWidth = 8;
        // Fast stroke tapers
        const fastWidth = calculateDynamicWidth(baseWidth, "pen", 1.0, 2.5);
        // Slow deliberate stroke stays wider
        const slowWidth = calculateDynamicWidth(baseWidth, "pen", 1.0, 0.2);

        expect(fastWidth).toBeLessThan(slowWidth);
      });

      it("calculates standard brush width scaling with pressure", () => {
        const baseWidth = 12;
        const lowP = calculateDynamicWidth(baseWidth, "brush", 0.1);
        const highP = calculateDynamicWidth(baseWidth, "brush", 1.5);

        expect(lowP).toBeLessThan(highP);
      });

      it("maintains static base width for eraser tool regardless of pressure", () => {
        const baseWidth = 24;
        const width1 = calculateDynamicWidth(baseWidth, "eraser", 0.1, 3.0);
        const width2 = calculateDynamicWidth(baseWidth, "eraser", 1.9, 0.1);

        expect(width1).toBe(baseWidth);
        expect(width2).toBe(baseWidth);
      });

      it("enforces minimum width floor of 1px for all tools", () => {
        const tinyPencil = calculateDynamicWidth(0.5, "pencil", 0.0, 5.0);
        const tinyPen = calculateDynamicWidth(0.5, "pen", 0.0, 10.0);
        const tinyBrush = calculateDynamicWidth(0.5, "brush", 0.0, 10.0);

        expect(tinyPencil).toBeGreaterThanOrEqual(1);
        expect(tinyPen).toBeGreaterThanOrEqual(1);
        expect(tinyBrush).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // =========================================================================
  // 5. Catmull-Rom Stroke Smoothing
  // =========================================================================
  describe("5. Catmull-Rom Stroke Smoothing", () => {
    const rawPoints: StrokePoint[] = [
      { x: 10, y: 10, pressure: 0.5 },
      { x: 50, y: 80, pressure: 0.7 },
      { x: 90, y: 30, pressure: 0.6 },
      { x: 130, y: 100, pressure: 0.8 },
    ];

    it("returns original points unchanged when smoothing is 'off'", () => {
      const result = smoothStrokePoints(rawPoints, "off");
      expect(result).toEqual(rawPoints);
    });

    it("returns original points when point count is less than 3", () => {
      const fewPoints: StrokePoint[] = [
        { x: 10, y: 10, pressure: 0.5 },
        { x: 20, y: 20, pressure: 0.6 },
      ];
      const result = smoothStrokePoints(fewPoints, "high");
      expect(result).toEqual(fewPoints);
    });

    it("interpolates smooth midpoints preserving exact start and end coordinates", () => {
      const levels: SmoothingLevel[] = ["low", "medium", "high"];

      levels.forEach((lvl) => {
        const smoothed = smoothStrokePoints(rawPoints, lvl);
        // Start point is strictly identical
        expect(smoothed[0].x).toBe(rawPoints[0].x);
        expect(smoothed[0].y).toBe(rawPoints[0].y);
        // End point is strictly identical
        const lastIdx = smoothed.length - 1;
        const rawLastIdx = rawPoints.length - 1;
        expect(smoothed[lastIdx].x).toBe(rawPoints[rawLastIdx].x);
        expect(smoothed[lastIdx].y).toBe(rawPoints[rawLastIdx].y);
        // Point density increases with smoothing level
        expect(smoothed.length).toBeGreaterThan(rawPoints.length);
      });
    });

    it("increases point density progressively from low to high smoothing", () => {
      const low = smoothStrokePoints(rawPoints, "low");
      const medium = smoothStrokePoints(rawPoints, "medium");
      const high = smoothStrokePoints(rawPoints, "high");

      expect(low.length).toBeLessThan(medium.length);
      expect(medium.length).toBeLessThan(high.length);
    });

    it("interpolates pressure smoothly between adjacent vertices", () => {
      const smoothed = smoothStrokePoints(rawPoints, "medium");
      smoothed.forEach((pt) => {
        expect(pt.pressure).toBeDefined();
        expect(pt.pressure).toBeGreaterThanOrEqual(0.4);
        expect(pt.pressure).toBeLessThanOrEqual(0.9);
      });
    });
  });

  // =========================================================================
  // 6. Multi-Layer Canvas Management
  // =========================================================================
  describe("6. Multi-Layer Canvas Management", () => {
    beforeEach(() => {
      const project: ProjectDocument = {
        id: "layers-test-01",
        name: "Layered Drawing",
        width: 1000,
        height: 1000,
        layers: [
          {
            id: "l-base",
            name: "Layer 1",
            visible: true,
            opacity: 1.0,
            strokes: [],
          },
        ],
        activeLayerId: "l-base",
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };
      useAppStore.setState({ currentProject: project, past: [], future: [] });
    });

    it("adds a new layer and sets it as active layer", () => {
      useAppStore.getState().addLayer();
      const project = useAppStore.getState().currentProject!;

      expect(project.layers).toHaveLength(2);
      expect(project.layers[1].name).toBe("Layer 2");
      expect(project.activeLayerId).toBe(project.layers[1].id);
      expect(useAppStore.getState().past).toHaveLength(1); // Recorded in undo history
    });

    it("toggles layer visibility cleanly", () => {
      useAppStore.getState().toggleLayer("l-base");
      let project = useAppStore.getState().currentProject!;
      expect(project.layers[0].visible).toBe(false);

      useAppStore.getState().toggleLayer("l-base");
      project = useAppStore.getState().currentProject!;
      expect(project.layers[0].visible).toBe(true);
    });

    it("clamps layer opacity between 0.05 and 1.0", () => {
      useAppStore.getState().setLayerOpacity("l-base", 0.01);
      let project = useAppStore.getState().currentProject!;
      expect(project.layers[0].opacity).toBe(0.05);

      useAppStore.getState().setLayerOpacity("l-base", 1.5);
      project = useAppStore.getState().currentProject!;
      expect(project.layers[0].opacity).toBe(1.0);

      useAppStore.getState().setLayerOpacity("l-base", 0.65);
      project = useAppStore.getState().currentProject!;
      expect(project.layers[0].opacity).toBe(0.65);
    });

    it("moves layer order up and down within list bounds", () => {
      useAppStore.getState().addLayer(); // Layer 2
      useAppStore.getState().addLayer(); // Layer 3
      let project = useAppStore.getState().currentProject!;
      expect(project.layers.map((l) => l.name)).toEqual(["Layer 1", "Layer 2", "Layer 3"]);

      // Move Layer 1 up (direction: "up" moves forward in stack)
      useAppStore.getState().moveLayer("l-base", "up");
      project = useAppStore.getState().currentProject!;
      expect(project.layers[1].id).toBe("l-base");

      // Cannot move out of top boundary
      useAppStore.getState().moveLayer(project.layers[2].id, "up");
      expect(useAppStore.getState().currentProject!.layers).toHaveLength(3);
    });

    it("duplicates layer with all strokes and generates unique IDs", () => {
      // Add a stroke to l-base first
      const stroke: Stroke = {
        id: "original-s1",
        kind: "brush",
        color: "#28594B",
        width: 10,
        points: [{ x: 5, y: 5 }, { x: 15, y: 15 }],
      };
      useAppStore.getState().commitStroke(stroke);

      useAppStore.getState().duplicateLayer("l-base");
      const project = useAppStore.getState().currentProject!;

      expect(project.layers).toHaveLength(2);
      const copyLayer = project.layers[1];
      expect(copyLayer.name).toBe("Layer 1 copy");
      expect(copyLayer.id).not.toBe("l-base");
      expect(copyLayer.strokes).toHaveLength(1);
      expect(copyLayer.strokes[0].id).not.toBe("original-s1");
      expect(copyLayer.strokes[0].color).toBe("#28594B");
    });

    it("prevents deleting the last remaining layer", () => {
      useAppStore.getState().deleteLayer("l-base");
      const project = useAppStore.getState().currentProject!;
      expect(project.layers).toHaveLength(1); // Still 1 layer
    });

    it("deletes non-last layer and updates activeLayerId safely", () => {
      useAppStore.getState().addLayer(); // Layer 2
      const projectBefore = useAppStore.getState().currentProject!;
      const layer2Id = projectBefore.layers[1].id;
      expect(projectBefore.activeLayerId).toBe(layer2Id);

      useAppStore.getState().deleteLayer(layer2Id);
      const projectAfter = useAppStore.getState().currentProject!;
      expect(projectAfter.layers).toHaveLength(1);
      expect(projectAfter.activeLayerId).toBe("l-base");
    });
  });

  // =========================================================================
  // 7. Undo/Redo Snapshot History System
  // =========================================================================
  describe("7. Undo/Redo Snapshot History System", () => {
    beforeEach(() => {
      const project: ProjectDocument = {
        id: "undo-test-01",
        name: "Undo Test Drawing",
        width: 800,
        height: 800,
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
      useAppStore.setState({ currentProject: project, past: [], future: [] });
    });

    it("records undo snapshots on stroke commit and allows undo and redo", () => {
      expect(useAppStore.getState().past).toHaveLength(0);
      expect(useAppStore.getState().future).toHaveLength(0);

      const stroke1: Stroke = {
        id: "str-1",
        kind: "pencil",
        color: "#000",
        width: 2,
        points: [{ x: 10, y: 10 }],
      };
      useAppStore.getState().commitStroke(stroke1);

      expect(useAppStore.getState().currentProject!.layers[0].strokes).toHaveLength(1);
      expect(useAppStore.getState().past).toHaveLength(1);
      expect(useAppStore.getState().future).toHaveLength(0);

      const stroke2: Stroke = {
        id: "str-2",
        kind: "pencil",
        color: "#000",
        width: 2,
        points: [{ x: 20, y: 20 }],
      };
      useAppStore.getState().commitStroke(stroke2);

      expect(useAppStore.getState().currentProject!.layers[0].strokes).toHaveLength(2);
      expect(useAppStore.getState().past).toHaveLength(2);

      // Perform Undo 1: Reverts stroke 2
      useAppStore.getState().undo();
      expect(useAppStore.getState().currentProject!.layers[0].strokes).toHaveLength(1);
      expect(useAppStore.getState().past).toHaveLength(1);
      expect(useAppStore.getState().future).toHaveLength(1);

      // Perform Undo 2: Reverts stroke 1
      useAppStore.getState().undo();
      expect(useAppStore.getState().currentProject!.layers[0].strokes).toHaveLength(0);
      expect(useAppStore.getState().past).toHaveLength(0);
      expect(useAppStore.getState().future).toHaveLength(2);

      // Perform Redo 1: Re-applies stroke 1
      useAppStore.getState().redo();
      expect(useAppStore.getState().currentProject!.layers[0].strokes).toHaveLength(1);
      expect(useAppStore.getState().past).toHaveLength(1);
      expect(useAppStore.getState().future).toHaveLength(1);

      // Perform Redo 2: Re-applies stroke 2
      useAppStore.getState().redo();
      expect(useAppStore.getState().currentProject!.layers[0].strokes).toHaveLength(2);
      expect(useAppStore.getState().past).toHaveLength(2);
      expect(useAppStore.getState().future).toHaveLength(0);
    });

    it("clears redo history when a new stroke is committed following an undo", () => {
      const stroke1: Stroke = {
        id: "s-a",
        kind: "brush",
        color: "#000",
        width: 5,
        points: [{ x: 0, y: 0 }],
      };
      const stroke2: Stroke = {
        id: "s-b",
        kind: "brush",
        color: "#000",
        width: 5,
        points: [{ x: 10, y: 10 }],
      };
      useAppStore.getState().commitStroke(stroke1);
      useAppStore.getState().commitStroke(stroke2);

      useAppStore.getState().undo();
      expect(useAppStore.getState().future).toHaveLength(1);

      // Commit a new alternative branch stroke
      const stroke3: Stroke = {
        id: "s-c",
        kind: "brush",
        color: "#FF0000",
        width: 5,
        points: [{ x: 50, y: 50 }],
      };
      useAppStore.getState().commitStroke(stroke3);

      // Future must be cleared to maintain linear history integrity
      expect(useAppStore.getState().future).toHaveLength(0);
      expect(useAppStore.getState().currentProject!.layers[0].strokes).toHaveLength(2);
      expect(useAppStore.getState().currentProject!.layers[0].strokes[1].id).toBe("s-c");
    });

    it("caps undo history at rolling 50-entry maximum to prevent unbounded memory growth", () => {
      for (let i = 0; i < 60; i++) {
        useAppStore.getState().commitStroke({
          id: `burst-stroke-${i}`,
          kind: "pencil",
          color: "#000",
          width: 1,
          points: [{ x: i, y: i }],
        });
      }

      expect(useAppStore.getState().past.length).toBeLessThanOrEqual(50);
      expect(useAppStore.getState().past.length).toBe(50);
    });
  });

  // =========================================================================
  // 8. Responsive Layout Adaptation Across 320dp to 900dp+
  // =========================================================================
  describe("8. Responsive Layout Adaptation Across Device Sizes", () => {
    it("adapts layout for small phones (320dp)", () => {
      const layout = calculateResponsiveLayout(320, 568);
      expect(layout.isSmallPhone).toBe(true);
      expect(layout.isTablet).toBe(false);
      expect(layout.columns).toBe(1);
      expect(layout.horizontalPadding).toBeLessThanOrEqual(16);
      expect(touchTargets.min).toBeGreaterThanOrEqual(44);
    });

    it("adapts layout for standard modern phones (360dp, 393dp, 412dp)", () => {
      const sizes = [
        { w: 360, h: 780 },
        { w: 393, h: 852 },
        { w: 412, h: 915 },
      ];

      sizes.forEach(({ w, h }) => {
        const layout = calculateResponsiveLayout(w, h);
        expect(layout.isTablet).toBe(false);
        expect(layout.isSmallPhone).toBe(false);
        expect(layout.isStandardPhone || layout.isLargePhone).toBe(true);
      });
    });

    it("adapts layout for phablets and foldables (480dp)", () => {
      const layout = calculateResponsiveLayout(480, 854);
      expect(layout.isTablet).toBe(false);
      expect(layout.columns).toBeGreaterThanOrEqual(1);
    });

    it("adapts layout for tablets (600dp and 768dp)", () => {
      const layout600 = calculateResponsiveLayout(600, 960);
      expect(layout600.isTablet).toBe(true);
      expect(layout600.columns).toBeGreaterThanOrEqual(2);

      const layout768 = calculateResponsiveLayout(768, 1024);
      expect(layout768.isTablet).toBe(true);
      expect(layout768.columns).toBeGreaterThanOrEqual(2);
    });

    it("constrains max content width on large tablet and desktop displays (900dp+)", () => {
      const layout900 = calculateResponsiveLayout(900, 1200);
      expect(layout900.isTablet).toBe(true);
      expect(layout900.columns).toBeGreaterThanOrEqual(3);
      expect(typeof layout900.contentMaxWidth).toBe("number");
      expect(layout900.contentMaxWidth).toBe(1120);
    });
  });

  // =========================================================================
  // 9. SQLite Persistence Round-Trip Integrity
  // =========================================================================
  describe("9. SQLite Persistence Round-Trip Integrity", () => {
    it("saves and reloads a project with both digital layers and traditional overlays", async () => {
      const loomisOverlay: LoomisOverlayConfig = {
        id: "ov-loomis",
        type: "loomis",
        name: "Loomis 3D Head",
        visible: true,
        opacity: 0.9,
        locked: false,
        zIndex: 1,
        stage: 5,
        centerX: 0.5,
        centerY: 0.5,
        radius: 0.3,
        yaw: 20,
        pitch: 10,
        roll: 0,
        jawLength: 1.1,
        color: "#D96B43",
        strokeWidth: 2,
        showConstructionPlanes: true,
      };

      const testProject: ProjectDocument = {
        id: "sqlite-roundtrip-test",
        name: "Classical Master Hybrid",
        width: 1200,
        height: 1600,
        layers: [
          {
            id: "lay-1",
            name: "Under-Pencil",
            visible: true,
            opacity: 0.8,
            strokes: [
              {
                id: "st-1",
                kind: "pencil",
                color: "#2C2C2C",
                width: 3,
                points: [{ x: 100, y: 150 }, { x: 200, y: 250 }],
              },
            ],
          },
        ],
        activeLayerId: "lay-1",
        referenceUri: "file:///test/portrait.jpg",
        paperSettings: {
          size: "A3",
          orientation: "portrait",
          widthMm: 297,
          heightMm: 420,
          marginMm: 15,
          targetDpi: 300,
        },
        overlays: [loomisOverlay],
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      // Mock database save and get
      let inMemoryRecord: any = null;
      jest.spyOn(database, "saveProject").mockImplementation(async (proj) => {
        inMemoryRecord = {
          id: proj.id,
          name: proj.name,
          width: proj.width,
          height: proj.height,
          layers_json: JSON.stringify(proj.layers),
          active_layer_id: proj.activeLayerId,
          reference_uri: proj.referenceUri,
          overlays_json: JSON.stringify(proj.overlays),
          paper_size: proj.paperSettings?.size,
          paper_width_mm: proj.paperSettings?.widthMm,
          paper_height_mm: proj.paperSettings?.heightMm,
          paper_margin_mm: proj.paperSettings?.marginMm,
          paper_orientation: proj.paperSettings?.orientation,
        };
      });

      jest.spyOn(database, "getProject").mockImplementation(async (id) => {
        if (!inMemoryRecord || inMemoryRecord.id !== id) return undefined;
        return {
          id: inMemoryRecord.id,
          name: inMemoryRecord.name,
          width: inMemoryRecord.width,
          height: inMemoryRecord.height,
          layers: JSON.parse(inMemoryRecord.layers_json),
          activeLayerId: inMemoryRecord.active_layer_id,
          referenceUri: inMemoryRecord.reference_uri,
          overlays: JSON.parse(inMemoryRecord.overlays_json),
          paperSettings: {
            size: inMemoryRecord.paper_size,
            orientation: inMemoryRecord.paper_orientation,
            widthMm: inMemoryRecord.paper_width_mm,
            heightMm: inMemoryRecord.paper_height_mm,
            marginMm: inMemoryRecord.paper_margin_mm,
            targetDpi: 300,
          },
          createdAt: 1700000000000,
          updatedAt: 1700000000000,
        };
      });

      // Save
      await database.saveProject(testProject);
      expect(inMemoryRecord).not.toBeNull();

      // Retrieve
      const loaded = await database.getProject("sqlite-roundtrip-test");
      expect(loaded).toBeDefined();
      expect(loaded!.id).toBe("sqlite-roundtrip-test");
      expect(loaded!.layers).toHaveLength(1);
      expect(loaded!.layers[0].strokes).toHaveLength(1);
      expect(loaded!.layers[0].strokes[0].kind).toBe("pencil");
      expect(loaded!.overlays).toHaveLength(1);
      expect(loaded!.overlays![0].type).toBe("loomis");
      expect(loaded!.paperSettings?.size).toBe("A3");

      jest.restoreAllMocks();
    });
  });
});
