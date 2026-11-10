import { useAppStore } from "../../../state/appStore";
import * as database from "../../../storage/database";
import type { GridOverlayConfig, LoomisOverlayConfig, PaperSettings } from "../../../domain/overlayTypes";

describe("Reference Studio & Layer Drawer Foundation (Phase 2)", () => {
  beforeEach(() => {
    useAppStore.setState({
      currentProject: {
        id: "ref-studio-test-01",
        name: "Classical Portrait Master Study",
        width: 1200,
        height: 1600,
        layers: [
          {
            id: "layer-strokes-01",
            name: "Contour Layer",
            visible: true,
            opacity: 1.0,
            strokes: [],
          },
        ],
        activeLayerId: "layer-strokes-01",
        referenceUri: "file:///test/classical-portrait.jpg",
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

  describe("Overlay State Management", () => {
    it("should add a new traditional overlay to current project", () => {
      const initialOverlays = useAppStore.getState().currentProject?.overlays ?? [];
      expect(initialOverlays).toHaveLength(0);

      const gridOverlay: GridOverlayConfig = {
        id: "grid-test-01",
        type: "grid",
        name: "Proportional Grid",
        visible: true,
        opacity: 0.75,
        locked: false,
        zIndex: 1,
        mode: "standard",
        cellMode: "square",
        divisions: 4,
        color: "#28594B",
        strokeWidth: 1.5,
        showLabels: true,
        showDiagonals: false,
        showSubdivisions: false,
      };

      useAppStore.getState().addOverlay(gridOverlay);

      const updated = useAppStore.getState().currentProject?.overlays ?? [];
      expect(updated).toHaveLength(1);
      expect(updated[0]?.id).toBe("grid-test-01");
      expect(updated[0]?.type).toBe("grid");
      expect(updated[0]?.visible).toBe(true);
    });

    it("should toggle overlay visibility correctly", () => {
      const loomisOverlay: LoomisOverlayConfig = {
        id: "loomis-test-01",
        type: "loomis",
        name: "Loomis Cranial Sphere",
        visible: true,
        opacity: 0.85,
        locked: false,
        zIndex: 2,
        stage: 1,
        centerX: 0.5,
        centerY: 0.45,
        radius: 0.28,
        yaw: 0,
        pitch: 0,
        roll: 0,
        jawLength: 1.0,
        color: "#CB7857",
        strokeWidth: 2.0,
        showConstructionPlanes: true,
      };

      useAppStore.getState().addOverlay(loomisOverlay);

      // Toggle off
      useAppStore.getState().toggleOverlayVisibility("loomis-test-01");
      let overlay = useAppStore.getState().currentProject?.overlays?.find((o) => o.id === "loomis-test-01");
      expect(overlay?.visible).toBe(false);

      // Toggle on
      useAppStore.getState().toggleOverlayVisibility("loomis-test-01");
      overlay = useAppStore.getState().currentProject?.overlays?.find((o) => o.id === "loomis-test-01");
      expect(overlay?.visible).toBe(true);
    });

    it("should clamp and update overlay opacity", () => {
      const gridOverlay: GridOverlayConfig = {
        id: "grid-test-02",
        type: "grid",
        name: "Grid",
        visible: true,
        opacity: 0.5,
        locked: false,
        zIndex: 1,
        mode: "standard",
        cellMode: "square",
        divisions: 4,
        color: "#28594B",
        strokeWidth: 1.5,
        showLabels: true,
        showDiagonals: false,
        showSubdivisions: false,
      };

      useAppStore.getState().addOverlay(gridOverlay);

      useAppStore.getState().setOverlayOpacity("grid-test-02", 0.35);
      let overlay = useAppStore.getState().currentProject?.overlays?.find((o) => o.id === "grid-test-02");
      expect(overlay?.opacity).toBe(0.35);

      // Clamping test: negative should clamp to 0
      useAppStore.getState().setOverlayOpacity("grid-test-02", -0.5);
      overlay = useAppStore.getState().currentProject?.overlays?.find((o) => o.id === "grid-test-02");
      expect(overlay?.opacity).toBe(0.0);

      // Clamping test: > 1 should clamp to 1.0
      useAppStore.getState().setOverlayOpacity("grid-test-02", 1.8);
      overlay = useAppStore.getState().currentProject?.overlays?.find((o) => o.id === "grid-test-02");
      expect(overlay?.opacity).toBe(1.0);
    });

    it("should toggle overlay lock status", () => {
      const gridOverlay: GridOverlayConfig = {
        id: "grid-test-03",
        type: "grid",
        name: "Grid",
        visible: true,
        opacity: 0.5,
        locked: false,
        zIndex: 1,
        mode: "standard",
        cellMode: "square",
        divisions: 4,
        color: "#28594B",
        strokeWidth: 1.5,
        showLabels: true,
        showDiagonals: false,
        showSubdivisions: false,
      };

      useAppStore.getState().addOverlay(gridOverlay);

      useAppStore.getState().toggleOverlayLock("grid-test-03");
      let overlay = useAppStore.getState().currentProject?.overlays?.find((o) => o.id === "grid-test-03");
      expect(overlay?.locked).toBe(true);

      useAppStore.getState().toggleOverlayLock("grid-test-03");
      overlay = useAppStore.getState().currentProject?.overlays?.find((o) => o.id === "grid-test-03");
      expect(overlay?.locked).toBe(false);
    });

    it("should remove overlay from project safely", () => {
      const gridOverlay: GridOverlayConfig = {
        id: "grid-test-04",
        type: "grid",
        name: "Grid",
        visible: true,
        opacity: 0.5,
        locked: false,
        zIndex: 1,
        mode: "standard",
        cellMode: "square",
        divisions: 4,
        color: "#28594B",
        strokeWidth: 1.5,
        showLabels: true,
        showDiagonals: false,
        showSubdivisions: false,
      };

      useAppStore.getState().addOverlay(gridOverlay);
      expect(useAppStore.getState().currentProject?.overlays).toHaveLength(1);

      useAppStore.getState().removeOverlay("grid-test-04");
      expect(useAppStore.getState().currentProject?.overlays).toHaveLength(0);
    });
  });

  describe("Paper Settings Management", () => {
    it("should update paper settings to A3 landscape format", () => {
      const newSettings: PaperSettings = {
        size: "A3",
        orientation: "landscape",
        widthMm: 420,
        heightMm: 297,
        marginMm: 5.0,
        targetDpi: 300,
      };

      useAppStore.getState().setPaperSettings(newSettings);
      const paper = useAppStore.getState().currentProject?.paperSettings;

      expect(paper?.size).toBe("A3");
      expect(paper?.orientation).toBe("landscape");
      expect(paper?.widthMm).toBe(420);
      expect(paper?.heightMm).toBe(297);
    });
  });

  describe("Project Persistence Round-Trip", () => {
    it("should save and reload project with overlays and paper settings via SQLite", async () => {
      const project = useAppStore.getState().currentProject;
      expect(project).toBeDefined();
      if (!project) return;

      const gridOverlay: GridOverlayConfig = {
        id: "grid-persisted-01",
        type: "grid",
        name: "A4 Calibrated Grid",
        visible: true,
        opacity: 0.8,
        locked: false,
        zIndex: 1,
        mode: "standard",
        cellMode: "millimetre",
        cellSpacingMm: 20,
        divisions: 4,
        color: "#28594B",
        strokeWidth: 1.5,
        showLabels: true,
        showDiagonals: false,
        showSubdivisions: false,
      };

      useAppStore.getState().addOverlay(gridOverlay);
      await useAppStore.getState().saveCurrentProject();

      // Clear memory state to verify true persistence
      useAppStore.setState({ currentProject: null });

      // Reload via openProject
      await useAppStore.getState().openProject(project.id);
      const reloaded = useAppStore.getState().currentProject;

      expect(reloaded).toBeDefined();
      expect(reloaded?.id).toBe(project.id);
      expect(reloaded?.name).toBe("Classical Portrait Master Study");
      expect(reloaded?.overlays).toHaveLength(1);
      expect(reloaded?.overlays?.[0]?.name).toBe("A4 Calibrated Grid");
      expect(reloaded?.overlays?.[0]?.opacity).toBe(0.8);
      expect(reloaded?.paperSettings?.size).toBe("A4");
    });
  });
});
