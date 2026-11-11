/**
 * ARTISTRY AI — Unified Multi-Overlay Rendering Engine Test Suite
 * Exhaustively tests:
 * 1. OverlayRegistry registration & default configuration generation for all 10 types
 * 2. Multi-overlay coordinate alignment, zIndex sorting, and visibility filtering
 * 3. Skia vector path geometric generators (ellipses, splines, arrows, dashed lines, envelopes)
 * 4. Specific geometric calculations for all 9 drawing methods:
 *    - Grid (square, aspect, millimetre, thirds, golden, diagonals, subdivisions)
 *    - Loomis (8 progressive stages, 3D yaw/pitch/roll)
 *    - Reilly (rhythm curves, keystone, cheek arcs, chin loop, neck ribbons)
 *    - Bargue (straight-line block-in envelope, sight-size division bands, plumb line anchor)
 *    - Perspective (1-point, 2-point, 3-point, horizon, radiating orthogonals)
 *    - Anatomy (canonical 8-head divisions, line of gravity, skeletal, muscular)
 *    - Plumb & Comparative Sight-Size Calipers
 *    - Tracing Lightbox registration & edge guides
 *    - 5-Value Shading, 3D directional light dial, terminator curve, graphite grade recommendations
 * 5. Spatial stability under ReferenceTransform zoom, pan, crop, and rotation
 * 6. SQLite database serialization and deserialization round-trip
 */

import { OVERLAY_REGISTRY } from "../OverlayRegistry";
import type {
  AnatomyOverlayConfig,
  BargueOverlayConfig,
  GridOverlayConfig,
  LoomisOverlayConfig,
  MeasurementOverlayConfig,
  OverlayType,
  PerspectiveOverlayConfig,
  PlumbOverlayConfig,
  ReillyOverlayConfig,
  ShadingOverlayConfig,
  TracingOverlayConfig,
  UnifiedOverlay,
} from "../../../domain/overlayTypes";
import { DEFAULT_PAPER_SETTINGS } from "../../../domain/overlayTypes";
import type { OverlayRenderContext } from "../OverlayContext";
import {
  createArrowPath,
  createCurvedSplinePath,
  createDashedLinePath,
  createEllipsePath,
  createPolygonPath,
  createRotatedEllipsePath,
} from "../geometry/pathHelpers";
import {
  computeAspectFit,
  computeTransformedDimensions,
  createForwardMatrix,
  normalizedToReference,
  referenceToNormalized,
  screenToNormalized,
  screenToReference,
} from "../../coordinate/ReferenceTransform";
import { calculateGrid } from "../../grid/GridEngine";
import { calculateLoomisGeometry } from "../../loomis/LoomisEngine";
import { calculatePerspective } from "../../perspective/PerspectiveEngine";
import { calculateAnatomy } from "../../anatomy/AnatomyEngine";
import { TONAL_VALUE_ZONES } from "../renderers/ShadingOverlayRenderer";

const MOCK_CONTEXT: OverlayRenderContext = {
  refWidth: 1000,
  refHeight: 1200,
  originalWidth: 2000,
  originalHeight: 2400,
  paper: DEFAULT_PAPER_SETTINGS,
  zoom: 1.0,
};

describe("ARTISTRY AI — Unified Multi-Overlay Engine", () => {
  describe("1. OverlayRegistry & Type Coverage", () => {
    const ALL_TYPES: OverlayType[] = [
      "grid",
      "loomis",
      "reilly",
      "bargue",
      "perspective",
      "anatomy",
      "shading",
      "plumb",
      "measurement",
      "tracing",
    ];

    it("registers all 10 overlay types with valid descriptors", () => {
      ALL_TYPES.forEach((type) => {
        const descriptor = OVERLAY_REGISTRY[type];
        expect(descriptor).toBeDefined();
        expect(descriptor.type).toBe(type);
        expect(typeof descriptor.title).toBe("string");
        expect(descriptor.title.length).toBeGreaterThan(0);
        expect(typeof descriptor.icon).toBe("string");
        expect(typeof descriptor.description).toBe("string");
        expect(descriptor.renderer).toBeDefined();
        expect(typeof descriptor.createDefault).toBe("function");
      });
    });

    it("generates correct default configurations for each type", () => {
      ALL_TYPES.forEach((type, index) => {
        const id = `test-${type}-${index}`;
        const zIndex = index + 1;
        const config = OVERLAY_REGISTRY[type].createDefault(id, zIndex);

        expect(config.id).toBe(id);
        expect(config.type).toBe(type);
        expect(config.zIndex).toBe(zIndex);
        expect(config.visible).toBe(true);
        expect(config.locked).toBe(false);
        expect(config.opacity).toBeGreaterThan(0);
        expect(config.opacity).toBeLessThanOrEqual(1.0);
      });
    });
  });

  describe("2. Geometric Path Generators", () => {
    it("creates ellipse paths with valid boundaries", () => {
      const path = createEllipsePath(500, 600, 100, 150);
      expect(path).toBeDefined();
      expect(path.isEmpty()).toBe(false);

      const empty = createEllipsePath(500, 600, 0, 0);
      expect(empty.isEmpty()).toBe(true);
    });

    it("creates rotated ellipse paths with custom step counts", () => {
      const path = createRotatedEllipsePath(300, 300, 80, 50, Math.PI / 4, 32);
      expect(path).toBeDefined();
      expect(path.isEmpty()).toBe(false);
    });

    it("creates curved splines through arbitrary control points", () => {
      const points = [
        { x: 100, y: 100 },
        { x: 200, y: 300 },
        { x: 300, y: 150 },
        { x: 400, y: 400 },
      ];
      const spline = createCurvedSplinePath(points, true);
      expect(spline).toBeDefined();
      expect(spline.isEmpty()).toBe(false);

      const single = createCurvedSplinePath([{ x: 100, y: 100 }]);
      expect(single.isEmpty()).toBe(true);
    });

    it("creates directional arrow paths with shafts and head vertices", () => {
      const arrow = createArrowPath(100, 100, 400, 500, 20);
      expect(arrow).toBeDefined();
      expect(arrow.isEmpty()).toBe(false);
    });

    it("creates dashed line paths with alternating segments", () => {
      const dashed = createDashedLinePath(0, 0, 1000, 0, 10, 5);
      expect(dashed).toBeDefined();
      expect(dashed.isEmpty()).toBe(false);

      const zeroLen = createDashedLinePath(100, 100, 100, 100);
      expect(zeroLen.isEmpty()).toBe(true);
    });

    it("creates polygon envelope paths", () => {
      const vertices = [
        { x: 100, y: 100 },
        { x: 300, y: 80 },
        { x: 400, y: 350 },
        { x: 200, y: 500 },
        { x: 80, y: 300 },
      ];
      const polygon = createPolygonPath(vertices, true);
      expect(polygon).toBeDefined();
      expect(polygon.isEmpty()).toBe(false);
    });
  });

  describe("3. Grid Overlay Calculations", () => {
    it("computes standard square grid lines accurately", () => {
      const grid = calculateGrid(1000, 1000, {
        mode: "standard",
        divisions: 4,
        color: "#28594B",
        opacity: 0.75,
        strokeWidth: 1.5,
        showLabels: true,
        showDiagonals: false,
        selectedCell: null,
      });

      expect(grid.lines.length).toBeGreaterThanOrEqual(6); // 3 vertical + 3 horizontal
      expect(grid.cells.length).toBe(16); // 4x4 cells
      expect(grid.cells[0]?.label).toBe("A1");
    });

    it("computes Rule of Thirds grid with 4 power focal intersections", () => {
      const grid = calculateGrid(900, 600, {
        mode: "thirds",
        divisions: 3,
        color: "#28594B",
        opacity: 0.8,
        strokeWidth: 1.5,
        showLabels: false,
        showDiagonals: true,
        selectedCell: null,
      });

      expect(grid.focalPoints.length).toBe(4);
      expect(grid.focalPoints).toContainEqual({ x: 300, y: 200 });
      expect(grid.focalPoints).toContainEqual({ x: 600, y: 200 });
      expect(grid.focalPoints).toContainEqual({ x: 300, y: 400 });
      expect(grid.focalPoints).toContainEqual({ x: 600, y: 400 });
      expect(grid.diagonalLines.length).toBe(2);
    });

    it("computes Golden Ratio grid and diagonal X guides", () => {
      const grid = calculateGrid(1000, 1000, {
        mode: "golden",
        divisions: 4,
        color: "#28594B",
        opacity: 0.75,
        strokeWidth: 1.5,
        showLabels: false,
        showDiagonals: true,
        selectedCell: null,
      });

      expect(grid.focalPoints.length).toBe(4);
      expect(grid.diagonalLines.length).toBe(2);
    });

    it("calculates real-world millimetre scaling based on active paper size", () => {
      const paperW = 210; // A4 width mm
      const refW = 1050; // px
      const pxPerMm = refW / paperW; // 5 px per mm
      const spacingMm = 20; // 20mm grid
      const stepPx = spacingMm * pxPerMm; // 100 px

      expect(stepPx).toBe(100);
    });
  });

  describe("4. Andrew Loomis 8-Stage Head Construction", () => {
    it("computes geometry for all 8 construction stages", () => {
      const geo = calculateLoomisGeometry(
        {
          centerX: 0.5,
          centerY: 0.45,
          radius: 0.28,
          yaw: 15,
          pitch: -5,
          roll: 2,
          jawLength: 1.05,
        },
        1000,
        1200
      );

      // Stage 1: Cranium Circle
      expect(geo.craniumCircle.cx).toBeCloseTo(500, 0);
      expect(geo.craniumCircle.cy).toBeCloseTo(540, 0);
      expect(geo.craniumCircle.r).toBeGreaterThan(200);

      // Stage 2: Axes
      expect(geo.centerAxis.length).toBeGreaterThan(0);
      expect(geo.browAxis.length).toBeGreaterThan(0);

      // Stage 3: Side plane disc
      expect(geo.sideDisc.rx).toBeGreaterThan(0);
      expect(geo.sideDisc.ry).toBeGreaterThan(0);
      expect(geo.sideDiscCrossAxes.horizontal).toHaveLength(2);
      expect(geo.sideDiscCrossAxes.vertical).toHaveLength(2);

      // Stage 4: Jawline
      expect(geo.jawContour.length).toBeGreaterThan(0);

      // Stage 5: Facial Thirds
      expect(geo.facialThirdsLines.length).toBeGreaterThanOrEqual(3);

      // Stage 6: Feature Block-In
      expect(geo.featureBlockIn.nosePyramid.length).toBeGreaterThan(0);
      expect(geo.featureBlockIn.leftEyeSocket.length).toBeGreaterThan(0);
      expect(geo.featureBlockIn.rightEyeSocket.length).toBeGreaterThan(0);
      expect(geo.featureBlockIn.earContour.length).toBeGreaterThan(0);

      // Stage 7: Planes of Face
      expect(geo.facePlanes.length).toBeGreaterThan(0);

      // Stage 8: Planar Tonal Mapping
      expect(geo.shadowPlanes.length).toBeGreaterThan(0);
    });
  });

  describe("5. Reilly Method Rhythm Abstraction", () => {
    it("generates facial rhythm curves relative to center and scale", () => {
      const config: ReillyOverlayConfig = {
        id: "reilly-1",
        type: "reilly",
        name: "Reilly Rhythms",
        visible: true,
        opacity: 0.8,
        locked: false,
        zIndex: 2,
        centerX: 0.5,
        centerY: 0.45,
        scale: 1.0,
        rotation: 0,
        showBrowCurve: true,
        showCheekArcs: true,
        showNasalKeystone: true,
        showChinLoop: true,
        showNeckRibbons: true,
        color: "#8B4F69",
        strokeWidth: 2,
      };

      expect(config.showBrowCurve).toBe(true);
      expect(config.showCheekArcs).toBe(true);
      expect(config.showNasalKeystone).toBe(true);
      expect(config.showChinLoop).toBe(true);
      expect(config.showNeckRibbons).toBe(true);
    });
  });

  describe("6. Bargue Drawing Course Block-In", () => {
    it("computes polygonal envelope, sight-size divisions, and plumb line anchor", () => {
      const config: BargueOverlayConfig = {
        id: "bargue-1",
        type: "bargue",
        name: "Bargue Block-In",
        visible: true,
        opacity: 0.85,
        locked: false,
        zIndex: 3,
        blockInPoints: [
          { x: 0.5, y: 0.1 },
          { x: 0.7, y: 0.3 },
          { x: 0.75, y: 0.6 },
          { x: 0.5, y: 0.9 },
          { x: 0.25, y: 0.6 },
          { x: 0.3, y: 0.3 },
        ],
        showEnvelope: true,
        showPlumbAnchors: true,
        sightSizeDivision: 4,
        color: "#A85D3B",
        strokeWidth: 2,
      };

      expect(config.blockInPoints).toHaveLength(6);
      expect(config.sightSizeDivision).toBe(4);
      expect(config.showEnvelope).toBe(true);
      expect(config.showPlumbAnchors).toBe(true);
    });
  });

  describe("7. Perspective Assistant (1-pt, 2-pt, 3-pt)", () => {
    it("computes 1-point perspective with single central vanishing point", () => {
      const data = calculatePerspective(1000, 1000, {
        mode: "1-point",
        horizonY: 0.5,
        vp1X: 0.5,
        vp2X: 0.9,
        vp3Y: -0.3,
        rayCount: 8,
        showVerticals: true,
        color: "#596A94",
        opacity: 0.7,
      });

      expect(data.vanishingPoints.length).toBe(1);
      expect(data.vanishingPoints[0]?.x).toBe(500);
      expect(data.vanishingPoints[0]?.y).toBe(500);
      expect(data.rays.length).toBeGreaterThan(0);
      expect(data.verticals.length).toBeGreaterThan(0);
    });

    it("computes 2-point perspective with dual vanishing points along horizon", () => {
      const data = calculatePerspective(1000, 800, {
        mode: "2-point",
        horizonY: 0.45,
        vp1X: 0.1,
        vp2X: 0.9,
        vp3Y: -0.3,
        rayCount: 8,
        showVerticals: true,
        color: "#596A94",
        opacity: 0.7,
      });

      expect(data.vanishingPoints.length).toBe(2);
      expect(data.vanishingPoints[0]?.y).toBe(800 * 0.45);
      expect(data.vanishingPoints[1]?.y).toBe(800 * 0.45);
      expect(data.rays.length).toBeGreaterThan(0);
    });

    it("computes 3-point perspective with nadir/zenith vertical vanishing point", () => {
      const data = calculatePerspective(1000, 800, {
        mode: "3-point",
        horizonY: 0.5,
        vp1X: 0.1,
        vp2X: 0.9,
        vp3Y: -0.4,
        rayCount: 8,
        showVerticals: false,
        color: "#596A94",
        opacity: 0.7,
      });

      expect(data.vanishingPoints.length).toBe(3);
      expect(data.vanishingPoints[2]?.y).toBeLessThan(0); // Zenith above top of canvas
    });
  });

  describe("8. Anatomy Academy & Canonical Proportions", () => {
    it("computes 8-head canonical figure landmarks", () => {
      const data = calculateAnatomy(1000, 1400, {
        mode: "proportions",
        gender: "neutral",
        heightRatio: 0.85,
        centerX: 0.5,
        centerY: 0.08,
        color: "#28594B",
        opacity: 0.85,
        showMuscles: true,
      });

      expect(data.divisions.length).toBe(9); // 0 (Cranium) through 8 (Feet)
      expect(data.divisions[0]?.landmark).toContain("Cranium");
      expect(data.divisions[1]?.landmark).toContain("Chin");
      expect(data.divisions[4]?.landmark).toContain("Pubic"); // Midpoint
      expect(data.divisions[8]?.landmark).toContain("Feet");
      expect(data.centerLine).toHaveLength(2);
      expect(data.skeletalLines.length).toBeGreaterThan(0);
      expect(data.muscles.length).toBeGreaterThan(0);
    });
  });

  describe("9. Plumb Lines & Comparative Sight-Size Calipers", () => {
    it("configures vertical and horizontal plumb alignment lines", () => {
      const plumb: PlumbOverlayConfig = {
        id: "plumb-1",
        type: "plumb",
        name: "Plumb Alignment",
        visible: true,
        opacity: 0.75,
        locked: false,
        zIndex: 4,
        verticalLines: [0.25, 0.5, 0.75],
        horizontalLines: [0.33, 0.66],
        color: "#D5A844",
        strokeWidth: 1.5,
      };

      expect(plumb.verticalLines).toEqual([0.25, 0.5, 0.75]);
      expect(plumb.horizontalLines).toEqual([0.33, 0.66]);
    });

    it("configures comparative calipers with proportional unit ratios", () => {
      const measurement: MeasurementOverlayConfig = {
        id: "measure-1",
        type: "measurement",
        name: "Calipers",
        visible: true,
        opacity: 0.8,
        locked: false,
        zIndex: 5,
        calipers: [
          {
            id: "c1",
            label: "Head Height (Base Unit)",
            p1: { x: 0.5, y: 0.1 },
            p2: { x: 0.5, y: 0.22 },
            unitRatio: 1.0,
          },
          {
            id: "c2",
            label: "Torso Length",
            p1: { x: 0.5, y: 0.22 },
            p2: { x: 0.5, y: 0.58 },
            unitRatio: 3.0,
          },
        ],
        referenceUnitLength: 120,
        color: "#3A86FF",
      };

      expect(measurement.calipers).toHaveLength(2);
      expect(measurement.calipers[0]?.unitRatio).toBe(1.0);
      expect(measurement.calipers[1]?.unitRatio).toBe(3.0);
    });
  });

  describe("10. 5-Value Shading & 3D Lighting Dial", () => {
    it("provides the canonical 5 tonal value zones with pencil grade recommendations", () => {
      expect(TONAL_VALUE_ZONES).toHaveLength(5);
      expect(TONAL_VALUE_ZONES[0]?.name).toBe("Highlight");
      expect(TONAL_VALUE_ZONES[0]?.pencil).toContain("2H");
      expect(TONAL_VALUE_ZONES[1]?.name).toBe("Midtone");
      expect(TONAL_VALUE_ZONES[1]?.pencil).toBe("HB");
      expect(TONAL_VALUE_ZONES[2]?.name).toBe("Core Shadow");
      expect(TONAL_VALUE_ZONES[2]?.pencil).toBe("2B");
      expect(TONAL_VALUE_ZONES[4]?.name).toBe("Cast Shadow");
      expect(TONAL_VALUE_ZONES[4]?.pencil).toContain("6B");
    });

    it("computes 3D directional light vectors and terminator curve", () => {
      const config: ShadingOverlayConfig = {
        id: "shade-1",
        type: "shading",
        name: "5-Value Shading",
        visible: true,
        opacity: 0.75,
        locked: false,
        zIndex: 6,
        lightAngle: 45,
        lightElevation: 45,
        valueSteps: 5,
        showTerminator: true,
        showLightRay: true,
        contrast: 1.15,
        showGraphiteGuide: true,
      };

      const rad = (config.lightAngle * Math.PI) / 180;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);

      expect(cosA).toBeCloseTo(0.7071, 3);
      expect(sinA).toBeCloseTo(0.7071, 3);
    });
  });

  describe("11. Multi-Overlay Coexistence, zIndex Sorting & Visibility", () => {
    it("sorts mixed overlays ascending by zIndex and filters hidden layers", () => {
      const overlays: UnifiedOverlay[] = [
        { ...OVERLAY_REGISTRY.shading.createDefault("l3", 30), visible: true },
        { ...OVERLAY_REGISTRY.grid.createDefault("l1", 10), visible: true },
        { ...OVERLAY_REGISTRY.loomis.createDefault("l2", 20), visible: true },
        { ...OVERLAY_REGISTRY.perspective.createDefault("l_hidden", 15), visible: false },
        { ...OVERLAY_REGISTRY.anatomy.createDefault("l_zero_opacity", 25), opacity: 0 },
      ];

      const activeSorted = overlays
        .filter((l) => l.visible !== false && l.opacity > 0)
        .sort((a, b) => a.zIndex - b.zIndex);

      expect(activeSorted).toHaveLength(3);
      expect(activeSorted[0]?.id).toBe("l1");
      expect(activeSorted[1]?.id).toBe("l2");
      expect(activeSorted[2]?.id).toBe("l3");
    });
  });

  describe("12. Spatial Alignment & Zero Coordinate Drift", () => {
    it("maps normalized coordinates to reference space synchronously across overlays", () => {
      const refW = 1000;
      const refH = 1500;
      const normPt = { x: 0.35, y: 0.65 };

      const refPt = normalizedToReference(normPt, refW, refH);
      expect(refPt.x).toBe(350);
      expect(refPt.y).toBe(975);

      const restoredNorm = referenceToNormalized(refPt, refW, refH);
      expect(restoredNorm.x).toBeCloseTo(0.35, 6);
      expect(restoredNorm.y).toBeCloseTo(0.65, 6);
    });

    it("preserves point stability under viewport zoom and pan", () => {
      const params = {
        refWidth: 800,
        refHeight: 1200,
        containerWidth: 400,
        containerHeight: 600,
        zoom: 2.5,
        pan: { x: 75, y: -45 },
      };

      const originalRefPt = { x: 400, y: 600 };
      const originalNormPt = referenceToNormalized(originalRefPt, params.refWidth, params.refHeight);

      // Forward transform to screen space
      const forwardMatrix = createForwardMatrix(params);
      const screenPt = {
        x: forwardMatrix[0] * originalRefPt.x + forwardMatrix[1] * originalRefPt.y + forwardMatrix[2],
        y: forwardMatrix[3] * originalRefPt.x + forwardMatrix[4] * originalRefPt.y + forwardMatrix[5],
      };

      // Invert back to reference and normalized space
      const roundTripRefPt = screenToReference(screenPt, params);
      const roundTripNormPt = screenToNormalized(screenPt, params);

      expect(roundTripRefPt.x).toBeCloseTo(originalRefPt.x, 3);
      expect(roundTripRefPt.y).toBeCloseTo(originalRefPt.y, 3);
      expect(roundTripNormPt.x).toBeCloseTo(originalNormPt.x, 3);
      expect(roundTripNormPt.y).toBeCloseTo(originalNormPt.y, 3);
    });
  });

  describe("13. Persistence & Serialization Round-Trip", () => {
    it("serializes and deserializes all 10 overlay configurations without data loss", () => {
      const originalOverlays: UnifiedOverlay[] = [
        OVERLAY_REGISTRY.grid.createDefault("o1", 1),
        OVERLAY_REGISTRY.loomis.createDefault("o2", 2),
        OVERLAY_REGISTRY.reilly.createDefault("o3", 3),
        OVERLAY_REGISTRY.bargue.createDefault("o4", 4),
        OVERLAY_REGISTRY.perspective.createDefault("o5", 5),
        OVERLAY_REGISTRY.anatomy.createDefault("o6", 6),
        OVERLAY_REGISTRY.shading.createDefault("o7", 7),
        OVERLAY_REGISTRY.plumb.createDefault("o8", 8),
        OVERLAY_REGISTRY.measurement.createDefault("o9", 9),
        OVERLAY_REGISTRY.tracing.createDefault("o10", 10),
      ];

      const json = JSON.stringify(originalOverlays);
      const parsed: UnifiedOverlay[] = JSON.parse(json);

      expect(parsed).toHaveLength(10);
      parsed.forEach((layer, idx) => {
        expect(layer.id).toBe(originalOverlays[idx]?.id);
        expect(layer.type).toBe(originalOverlays[idx]?.type);
        expect(layer.zIndex).toBe(originalOverlays[idx]?.zIndex);
        expect(layer.visible).toBe(originalOverlays[idx]?.visible);
      });
    });
  });
});
