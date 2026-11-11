import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReferenceCanvas } from "../../features/workstation/ReferenceCanvas";
import { LayerDrawer } from "../../features/workstation/LayerDrawer";
import { ImageAdjustmentPanel } from "../../features/workstation/ImageAdjustmentPanel";
import { CropRotateModal } from "../../features/workstation/CropRotateModal";
import { chooseImageFromDocuments, choosePhotoFromSystemPicker } from "../../features/images/pickImage";
import { useAppStore } from "../../state/appStore";
import * as database from "../../storage/database";
import type {
  ImageAdjustmentSettings,
  ImageCropSettings,
  OverlayType,
  PaperSize,
  UnifiedOverlay,
} from "../../domain/overlayTypes";
import {
  DEFAULT_IMAGE_ADJUSTMENTS,
  DEFAULT_PAPER_SETTINGS,
  STANDARD_PAPER_SIZES,
} from "../../domain/overlayTypes";
import { colors } from "../../theme";

export default function ReferenceStudioScreen() {
  const { id: routeId } = useLocalSearchParams<{ id: string }>();
  const currentProject = useAppStore((state) => state.currentProject);
  const openProject = useAppStore((state) => state.openProject);
  const saveCurrentProject = useAppStore((state) => state.saveCurrentProject);
  const reference = useAppStore((state) => state.reference);
  const setReference = useAppStore((state) => state.setReference);

  const toggleOverlayVisibility = useAppStore((state) => state.toggleOverlayVisibility);
  const setOverlayOpacity = useAppStore((state) => state.setOverlayOpacity);
  const toggleOverlayLock = useAppStore((state) => state.toggleOverlayLock);
  const addOverlay = useAppStore((state) => state.addOverlay);
  const removeOverlay = useAppStore((state) => state.removeOverlay);
  const setPaperSettings = useAppStore((state) => state.setPaperSettings);
  const setImageAdjustments = useAppStore((state) => state.setImageAdjustments);
  const resetImageAdjustments = useAppStore((state) => state.resetImageAdjustments);
  const resetIndividualAdjustment = useAppStore((state) => state.resetIndividualAdjustment);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [layerDrawerOpen, setLayerDrawerOpen] = useState(false);
  const [adjustmentPanelOpen, setAdjustmentPanelOpen] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [paperPickerOpen, setPaperPickerOpen] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<string>("layers");

  // Load project from SQLite on mount
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!routeId) return;
      try {
        setLoading(true);
        setLoadError(null);
        await openProject(routeId);
      } catch (err) {
        if (mounted) {
          setLoadError(err instanceof Error ? err.message : "Project could not be loaded.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [routeId, openProject]);

  const activeProject = currentProject;
  const activeReferenceUri = activeProject?.referenceUri ?? reference?.uri ?? null;
  const refWidth = reference?.width ?? activeProject?.width ?? 1200;
  const refHeight = reference?.height ?? activeProject?.height ?? 1600;
  const overlays: UnifiedOverlay[] = activeProject?.overlays ?? [];
  const paper = activeProject?.paperSettings ?? DEFAULT_PAPER_SETTINGS;

  const handleSave = async () => {
    try {
      await saveCurrentProject();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      Alert.alert("Save Failed", "Could not save project to local database.");
    }
  };

  const handleImportNewReference = async () => {
    try {
      const selected = await choosePhotoFromSystemPicker();
      if (selected && activeProject) {
        const updated = {
          ...activeProject,
          referenceUri: selected.uri,
          width: selected.width,
          height: selected.height,
          updatedAt: Date.now(),
        };
        await database.saveProject(updated);
        await openProject(activeProject.id);
      }
    } catch (err) {
      Alert.alert("Import Error", err instanceof Error ? err.message : "Could not open image.");
    }
  };

  const handleAdjustmentsChange = (newAdjustments: ImageAdjustmentSettings) => {
    setImageAdjustments(newAdjustments);
    if (activeProject) {
      const updated = {
        ...activeProject,
        imageAdjustments: newAdjustments,
        updatedAt: Date.now(),
      };
      void database.saveProject(updated);
    }
  };

  const handleApplyCropAndRotate = (newCrop: ImageCropSettings, newRotation: 0 | 90 | 180 | 270) => {
    const currentAdjustments = activeProject?.imageAdjustments ?? DEFAULT_IMAGE_ADJUSTMENTS;
    const updatedAdjustments: ImageAdjustmentSettings = {
      ...currentAdjustments,
      crop: newCrop,
      rotation: newRotation,
    };
    setImageAdjustments(updatedAdjustments);
    if (activeProject) {
      const updated = {
        ...activeProject,
        imageAdjustments: updatedAdjustments,
        updatedAt: Date.now(),
      };
      void database.saveProject(updated);
    }
  };

  const handleResetAdjustments = () => {
    resetImageAdjustments();
    if (activeProject) {
      const currentCrop = activeProject.imageAdjustments?.crop ?? DEFAULT_IMAGE_ADJUSTMENTS.crop;
      const currentRotation = activeProject.imageAdjustments?.rotation ?? 0;
      const reset = {
        ...DEFAULT_IMAGE_ADJUSTMENTS,
        crop: currentCrop,
        rotation: currentRotation,
      };
      void database.saveProject({
        ...activeProject,
        imageAdjustments: reset,
        updatedAt: Date.now(),
      });
    }
  };

  const handleResetIndividual = (key: keyof ImageAdjustmentSettings) => {
    resetIndividualAdjustment(key);
    if (activeProject) {
      const existing = activeProject.imageAdjustments ?? DEFAULT_IMAGE_ADJUSTMENTS;
      const updated = {
        ...existing,
        [key]: DEFAULT_IMAGE_ADJUSTMENTS[key],
      };
      void database.saveProject({
        ...activeProject,
        imageAdjustments: updated,
        updatedAt: Date.now(),
      });
    }
  };

  const handleAddDefaultOverlay = (type: OverlayType) => {
    const id = `overlay-${Date.now().toString(36)}`;
    let newOverlay: UnifiedOverlay;

    switch (type) {
      case "grid":
        newOverlay = {
          id,
          type: "grid",
          name: "Smart Grid",
          visible: true,
          opacity: 0.75,
          locked: false,
          zIndex: overlays.length + 1,
          mode: "standard",
          cellMode: "square",
          divisions: 4,
          color: "#28594B",
          strokeWidth: 1.5,
          showLabels: true,
          showDiagonals: false,
          showSubdivisions: false,
        };
        break;
      case "loomis":
        newOverlay = {
          id,
          type: "loomis",
          name: "Loomis 3D Head",
          visible: true,
          opacity: 0.85,
          locked: false,
          zIndex: overlays.length + 1,
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
        break;
      case "perspective":
        newOverlay = {
          id,
          type: "perspective",
          name: "2-Point Perspective",
          visible: true,
          opacity: 0.7,
          locked: false,
          zIndex: overlays.length + 1,
          mode: "2-point",
          horizonY: 0.5,
          vp1X: 0.1,
          vp2X: 0.9,
          vp3Y: -0.3,
          rayCount: 10,
          showVerticals: true,
          color: "#596A94",
          strokeWidth: 1.5,
        };
        break;
      case "anatomy":
        newOverlay = {
          id,
          type: "anatomy",
          name: "8-Head Proportions",
          visible: true,
          opacity: 0.8,
          locked: false,
          zIndex: overlays.length + 1,
          mode: "proportions",
          gender: "neutral",
          heightRatio: 0.85,
          centerX: 0.5,
          centerY: 0.08,
          showMuscles: false,
          color: "#28594B",
          strokeWidth: 1.5,
        };
        break;
      case "shading":
        newOverlay = {
          id,
          type: "shading",
          name: "5-Value Tonal Scale",
          visible: true,
          opacity: 0.65,
          locked: false,
          zIndex: overlays.length + 1,
          lightAngle: 45,
          lightElevation: 45,
          valueSteps: 5,
          showTerminator: true,
          showLightRay: true,
          contrast: 1.15,
          showGraphiteGuide: true,
        };
        break;
      case "plumb":
        newOverlay = {
          id,
          type: "plumb",
          name: "Plumb Alignment",
          visible: true,
          opacity: 0.75,
          locked: false,
          zIndex: overlays.length + 1,
          verticalLines: [0.5],
          horizontalLines: [0.5],
          color: "#D5A844",
          strokeWidth: 1.5,
        };
        break;
      default:
        newOverlay = {
          id,
          type,
          name: `${type.toUpperCase()} Guide`,
          visible: true,
          opacity: 0.8,
          locked: false,
          zIndex: overlays.length + 1,
          mode: "natural",
          threshold: 128,
          edgeBoost: true,
          invert: false,
        } as any;
    }

    addOverlay(newOverlay);
  };

  const handleSelectPaperSize = (size: PaperSize) => {
    if (size === "CUSTOM") return;
    const dims = STANDARD_PAPER_SIZES[size];
    setPaperSettings({
      ...paper,
      size,
      widthMm: dims.widthMm,
      heightMm: dims.heightMm,
    });
    setPaperPickerOpen(false);
  };

  const handleBottomTabPress = (tab: string) => {
    setActiveBottomTab(tab);
    if (tab === "layers") {
      setLayerDrawerOpen(true);
      return;
    }

    // Direct mapping to add or activate traditional overlays
    const overlayTypeMap: Record<string, OverlayType> = {
      grid: "grid",
      construction: "loomis",
      tracing: "tracing",
      anatomy: "anatomy",
      perspective: "perspective",
      shading: "shading",
      measure: "plumb",
    };

    const targetType = overlayTypeMap[tab];
    if (targetType) {
      const existing = overlays.find((o) => o.type === targetType);
      if (existing) {
        // Toggle on or open layer drawer
        setLayerDrawerOpen(true);
      } else {
        handleAddDefaultOverlay(targetType);
        setLayerDrawerOpen(true);
      }
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <StatusBar style="light" />
        <Text style={styles.loadingTitle}>Opening Reference Studio…</Text>
        <Text style={styles.loadingSubtitle}>Loading workspace from local database</Text>
      </SafeAreaView>
    );
  }

  // Not Found / Error Screen
  if (loadError || !activeProject) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <StatusBar style="light" />
        <Text style={styles.errorTitle}>Project Not Found</Text>
        <Text style={styles.errorSubtitle}>
          {loadError ?? "This drawing workspace could not be located in local storage."}
        </Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Return to Home</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />

      {/* TOP TOOLBAR */}
      <View style={styles.topToolbar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.toolbarBtn, pressed && styles.btnPressed]}
          accessibilityLabel="Back"
        >
          <Text style={styles.toolbarBtnIcon}>‹</Text>
        </Pressable>

        <View style={styles.titleContainer}>
          <Text numberOfLines={1} style={styles.projectTitle}>
            {activeProject.name}
          </Text>
          <View style={styles.refInfoPill}>
            <Text style={styles.refInfoText}>
              {refWidth} × {refHeight} px · {paper.size}
            </Text>
          </View>
        </View>

        {/* Action icons */}
        <View style={styles.topActions}>
          <Pressable
            onPress={() => setAdjustmentPanelOpen(true)}
            style={({ pressed }) => [styles.toolbarBtn, pressed && styles.btnPressed]}
            accessibilityLabel="Adjust Reference Image & Whiteout Lightbox"
          >
            <Text style={styles.toolbarIconBtnText}>🎛️</Text>
          </Pressable>

          <Pressable
            onPress={() => setCropModalOpen(true)}
            style={({ pressed }) => [styles.toolbarBtn, pressed && styles.btnPressed]}
            accessibilityLabel="Crop & Rotate Reference Image"
          >
            <Text style={styles.toolbarIconBtnText}>✂️</Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              saveSuccess && styles.saveBtnSuccess,
              pressed && styles.btnPressed,
            ]}
            accessibilityLabel="Save Project"
          >
            <Text style={[styles.saveBtnText, saveSuccess && styles.saveBtnTextSuccess]}>
              {saveSuccess ? "✓ Saved" : "Save"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMoreMenuOpen(true)}
            style={({ pressed }) => [styles.toolbarBtn, pressed && styles.btnPressed]}
            accessibilityLabel="More Options"
          >
            <Text style={styles.moreIcon}>⋮</Text>
          </Pressable>
        </View>
      </View>

      {/* WORKSPACE HUD / INFO STRIP */}
      <View style={styles.hudStrip}>
        <View style={styles.hudBadge}>
          <Text style={styles.hudBadgeDot}>●</Text>
          <Text style={styles.hudBadgeText}>REFERENCE WORKSPACE</Text>
        </View>

        <Pressable
          onPress={() => setPaperPickerOpen(true)}
          style={styles.paperBadge}
        >
          <Text style={styles.paperBadgeText}>
            📄 {paper.size} ({paper.widthMm}×{paper.heightMm}mm)
          </Text>
        </Pressable>

        <View style={styles.offlineBadge}>
          <Text style={styles.offlineBadgeText}>🔒 Offline</Text>
        </View>
      </View>

      {/* CENTRAL WORKSPACE CANVAS */}
      <View style={styles.canvasContainer}>
        <ReferenceCanvas
          referenceUri={activeReferenceUri}
          referenceWidth={refWidth}
          referenceHeight={refHeight}
          adjustments={activeProject.imageAdjustments}
          onImportPress={handleImportNewReference}
        />
      </View>

      {/* BOTTOM TOOL NAVIGATION */}
      <View style={styles.bottomNav}>
        {[
          { key: "grid", label: "Grid", icon: "⌗" },
          { key: "construction", label: "Loomis", icon: "⨁" },
          { key: "tracing", label: "Tracing", icon: "◻" },
          { key: "anatomy", label: "Anatomy", icon: "♟" },
          { key: "perspective", label: "3D Rays", icon: "◬" },
          { key: "shading", label: "Shading", icon: "◑" },
          { key: "measure", label: "Plumb", icon: "┼" },
          { key: "layers", label: `Layers (${overlays.length})`, icon: "◫" },
        ].map((tab) => {
          const isActive = activeBottomTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => handleBottomTabPress(tab.key)}
              style={[styles.bottomTab, isActive && styles.bottomTabActive]}
            >
              <Text style={[styles.bottomTabIcon, isActive && styles.bottomTabIconActive]}>
                {tab.icon}
              </Text>
              <Text numberOfLines={1} style={[styles.bottomTabLabel, isActive && styles.bottomTabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* LAYER DRAWER */}
      <LayerDrawer
        visible={layerDrawerOpen}
        onClose={() => setLayerDrawerOpen(false)}
        overlays={overlays}
        onToggleVisibility={toggleOverlayVisibility}
        onOpacityChange={setOverlayOpacity}
        onToggleLock={toggleOverlayLock}
        onAddOverlay={handleAddDefaultOverlay}
        onRemoveOverlay={removeOverlay}
      />

      {/* MORE OPTIONS MODAL */}
      <Modal
        visible={moreMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMoreMenuOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setMoreMenuOpen(false)}>
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Workspace Options</Text>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMoreMenuOpen(false);
                setAdjustmentPanelOpen(true);
              }}
            >
              <Text style={styles.menuItemIcon}>🎛️</Text>
              <Text style={styles.menuItemText}>Image Adjustments & Whiteout</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMoreMenuOpen(false);
                setCropModalOpen(true);
              }}
            >
              <Text style={styles.menuItemIcon}>✂️</Text>
              <Text style={styles.menuItemText}>Crop & Orientation</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMoreMenuOpen(false);
                void handleImportNewReference();
              }}
            >
              <Text style={styles.menuItemIcon}>🖼️</Text>
              <Text style={styles.menuItemText}>Change Reference Image</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMoreMenuOpen(false);
                setPaperPickerOpen(true);
              }}
            >
              <Text style={styles.menuItemIcon}>📄</Text>
              <Text style={styles.menuItemText}>Configure Paper Format</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMoreMenuOpen(false);
                setLayerDrawerOpen(true);
              }}
            >
              <Text style={styles.menuItemIcon}>◫</Text>
              <Text style={styles.menuItemText}>Manage Active Overlays</Text>
            </Pressable>

            <Pressable
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={() => {
                setMoreMenuOpen(false);
                router.back();
              }}
            >
              <Text style={styles.menuItemIcon}>🚪</Text>
              <Text style={styles.menuItemDangerText}>Exit Workspace</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* PAPER PICKER MODAL */}
      <Modal
        visible={paperPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPaperPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.dismissArea} onPress={() => setPaperPickerOpen(false)} />
          <View style={styles.sheetContainer}>
            <Text style={styles.sheetTitle}>Select Target Paper Format</Text>
            <Text style={styles.sheetSubtitle}>
              Calibrates grids and reference overlays for accurate physical drawing.
            </Text>

            <View style={styles.paperList}>
              {(["A4", "A3", "A5", "US_LETTER"] as const).map((size) => {
                const dims = STANDARD_PAPER_SIZES[size];
                const isSelected = paper.size === size;
                return (
                  <Pressable
                    key={size}
                    onPress={() => handleSelectPaperSize(size)}
                    style={[styles.paperOption, isSelected && styles.paperOptionSelected]}
                  >
                    <View>
                      <Text style={[styles.paperOptionTitle, isSelected && styles.paperOptionTitleSelected]}>
                        {size === "US_LETTER" ? "US Letter" : `ISO ${size}`}
                      </Text>
                      <Text style={styles.paperOptionDims}>
                        {dims.widthMm} × {dims.heightMm} mm · 300 DPI target
                      </Text>
                    </View>
                    {isSelected ? <Text style={styles.checkIcon}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
      {/* IMAGE ADJUSTMENT PANEL */}
      <ImageAdjustmentPanel
        visible={adjustmentPanelOpen}
        onClose={() => setAdjustmentPanelOpen(false)}
        adjustments={activeProject.imageAdjustments ?? DEFAULT_IMAGE_ADJUSTMENTS}
        onChange={handleAdjustmentsChange}
        onResetIndividual={handleResetIndividual}
        onResetAll={handleResetAdjustments}
      />

      {/* CROP & ROTATE MODAL */}
      <CropRotateModal
        visible={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        refWidth={refWidth}
        refHeight={refHeight}
        currentCrop={activeProject.imageAdjustments?.crop ?? DEFAULT_IMAGE_ADJUSTMENTS.crop}
        currentRotation={activeProject.imageAdjustments?.rotation ?? 0}
        onApply={handleApplyCropAndRotate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#101311",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#101311",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingTitle: {
    color: "#F4F2EC",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  loadingSubtitle: {
    color: "#88928A",
    fontSize: 13,
  },
  errorTitle: {
    color: "#F4F2EC",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  errorSubtitle: {
    color: "#A74335",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 320,
  },
  backButton: {
    backgroundColor: "#28594B",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  topToolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#141815",
    borderBottomWidth: 1,
    borderBottomColor: "#222A25",
    gap: 8,
  },
  toolbarBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#1C231E",
    justifyContent: "center",
    alignItems: "center",
  },
  toolbarBtnIcon: {
    color: "#E2DFD6",
    fontSize: 26,
    lineHeight: 28,
  },
  toolbarIconBtnText: {
    fontSize: 16,
  },
  moreIcon: {
    color: "#E2DFD6",
    fontSize: 20,
    fontWeight: "700",
  },
  btnPressed: {
    opacity: 0.75,
  },
  titleContainer: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F4F1E8",
  },
  refInfoPill: {
    marginTop: 2,
  },
  refInfoText: {
    fontSize: 11,
    color: "#849086",
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  saveBtn: {
    backgroundColor: "#28594B",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnSuccess: {
    backgroundColor: "#3A685B",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  saveBtnTextSuccess: {
    color: "#B2E5D4",
  },
  hudStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#161B18",
    borderBottomWidth: 1,
    borderBottomColor: "#222B24",
  },
  hudBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  hudBadgeDot: {
    color: "#4E9B7B",
    fontSize: 8,
  },
  hudBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#95A398",
    letterSpacing: 0.5,
  },
  paperBadge: {
    backgroundColor: "#202722",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2B362E",
  },
  paperBadgeText: {
    fontSize: 10,
    color: "#D0CCC2",
    fontWeight: "600",
  },
  offlineBadge: {
    backgroundColor: "#1E2420",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  offlineBadgeText: {
    fontSize: 10,
    color: "#748277",
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: "#101311",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#141815",
    borderTopWidth: 1,
    borderTopColor: "#222A25",
    paddingVertical: 6,
    paddingHorizontal: 4,
    justifyContent: "space-around",
  },
  bottomTab: {
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
    minWidth: 42,
  },
  bottomTabActive: {
    backgroundColor: "#1E2621",
  },
  bottomTabIcon: {
    fontSize: 16,
    color: "#7E8C82",
    marginBottom: 2,
  },
  bottomTabIconActive: {
    color: "#CB7857",
  },
  bottomTabLabel: {
    fontSize: 9,
    color: "#7E8C82",
    fontWeight: "500",
  },
  bottomTabLabelActive: {
    color: "#F4F1E8",
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 13, 11, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  menuCard: {
    backgroundColor: "#1A201C",
    borderRadius: 18,
    padding: 16,
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: "#2B352E",
    gap: 8,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F4F1E8",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#202823",
    gap: 12,
  },
  menuItemIcon: {
    fontSize: 18,
  },
  menuItemText: {
    fontSize: 14,
    color: "#E2DFD6",
    fontWeight: "500",
  },
  menuItemDanger: {
    backgroundColor: "#261D1C",
  },
  menuItemDangerText: {
    fontSize: 14,
    color: "#E57373",
    fontWeight: "600",
  },
  dismissArea: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: "#181E1A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#2B362E",
    padding: 20,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F4F1E8",
  },
  sheetSubtitle: {
    fontSize: 12,
    color: "#849086",
    lineHeight: 17,
  },
  paperList: {
    gap: 8,
    marginTop: 6,
  },
  paperOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#202823",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A342D",
  },
  paperOptionSelected: {
    borderColor: "#28594B",
    backgroundColor: "#23332A",
  },
  paperOptionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EAE7DF",
  },
  paperOptionTitleSelected: {
    color: "#52B788",
  },
  paperOptionDims: {
    fontSize: 11,
    color: "#7E8C81",
    marginTop: 2,
  },
  checkIcon: {
    fontSize: 16,
    color: "#52B788",
    fontWeight: "700",
  },
});
