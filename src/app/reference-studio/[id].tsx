import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
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
import { BeginnerCoachStrip } from "../../features/modes/BeginnerCoachStrip";
import { ProfessionalControlPanel } from "../../features/modes/ProfessionalControlPanel";
import { ModeSelectorModal } from "../../features/modes/ModeSelectorModal";
import { PaperGridCalculatorModal } from "../../features/paper/PaperGridCalculatorModal";
import type { PaperGridCalculation } from "../../features/paper/types";
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
import { OVERLAY_REGISTRY } from "../../features/overlays/OverlayRegistry";
import { colors } from "../../theme";
import { useResponsiveLayout } from "../../components/AppUI";

export default function ReferenceStudioScreen() {
  const layout = useResponsiveLayout();
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
  const updateOverlay = useAppStore((state) => state.updateOverlay);
  const removeOverlay = useAppStore((state) => state.removeOverlay);
  const experienceMode = useAppStore((state) => state.experienceMode);
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
  const [proControlPanelOpen, setProControlPanelOpen] = useState(false);
  const [modeModalOpen, setModeModalOpen] = useState(false);
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
  const [isNavigating, setIsNavigating] = useState(false);

  const handleSave = async () => {
    try {
      await saveCurrentProject();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      Alert.alert("Save Failed", "Could not save project to local database.");
    }
  };

  const handleSafeBack = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    try {
      await saveCurrentProject();
    } catch {
      // Proceed even on background save error
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/projects");
    }
  };

  const handleSwitchToFreeDrawing = async () => {
    if (!activeProject || isNavigating) return;
    setIsNavigating(true);
    try {
      setMoreMenuOpen(false);
      await saveCurrentProject();
      router.push(`/studio/${activeProject.id}`);
    } catch {
      Alert.alert("Navigation Error", "Could not switch to Free Drawing Studio.");
      setIsNavigating(false);
    }
  };

  const handleSwitchToPaperStudio = async () => {
    if (!activeProject || isNavigating) return;
    setIsNavigating(true);
    try {
      setMoreMenuOpen(false);
      await saveCurrentProject();
      router.push(`/paper-studio/${activeProject.id}`);
    } catch {
      setIsNavigating(false);
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
    const id = `overlay-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const descriptor = OVERLAY_REGISTRY[type];
    const newOverlay = descriptor
      ? descriptor.createDefault(id, overlays.length + 1)
      : ({
          id,
          type,
          name: `${type.toUpperCase()} Guide`,
          visible: true,
          opacity: 0.8,
          locked: false,
          zIndex: overlays.length + 1,
        } as any);

    addOverlay(newOverlay);
  };

  const handleUpdateOverlay = (updatedOverlay: UnifiedOverlay) => {
    updateOverlay(updatedOverlay);
    if (activeProject) {
      const exists = overlays.some((o) => o.id === updatedOverlay.id);
      const nextOverlays = exists
        ? overlays.map((o) => (o.id === updatedOverlay.id ? updatedOverlay : o))
        : [...overlays, updatedOverlay];
      const updated = {
        ...activeProject,
        overlays: nextOverlays,
        updatedAt: Date.now(),
      };
      void database.saveProject(updated);
    }
  };

  const handleApplyPaperGrid = (calc: PaperGridCalculation) => {
    // 1. Update Paper Settings in Store
    const updatedPaper = {
      size: calc.paperSize,
      orientation: calc.orientation,
      widthMm: calc.paperWidthMm,
      heightMm: calc.paperHeightMm,
      marginMm: calc.marginXMm,
      targetDpi: calc.targetDpi,
    };
    setPaperSettings(updatedPaper);

    // 2. Find existing Grid overlay or create new calibrated grid overlay
    const existingGrid = overlays.find((o) => o.type === "grid");
    const gridId = existingGrid?.id ?? `overlay-grid-${Date.now().toString(36)}`;

    const updatedGridOverlay = {
      ...(existingGrid ?? {
        id: gridId,
        type: "grid" as const,
        name: "Paper Calibrated Grid",
        zIndex: overlays.length + 1,
        color: "#28594B",
        strokeWidth: 1.5,
        showDiagonals: false,
        showSubdivisions: false,
      }),
      visible: true,
      opacity: existingGrid?.opacity ?? 0.8,
      locked: existingGrid?.locked ?? false,
      mode: "standard" as const,
      cellMode: "millimetre" as const,
      cellSpacingMm: calc.spacingXMm,
      cellSpacingMmX: calc.spacingXMm,
      cellSpacingMmY: calc.spacingYMm,
      divisions: calc.columns,
      gridColumns: calc.columns,
      gridRows: calc.rows,
      paperMarginXMm: calc.marginXMm,
      paperMarginYMm: calc.marginYMm,
      showLabels: true,
    };

    if (existingGrid) {
      updateOverlay(updatedGridOverlay);
    } else {
      addOverlay(updatedGridOverlay);
    }

    // 3. Persist to SQLite
    if (activeProject) {
      const nextOverlays = existingGrid
        ? overlays.map((o) => (o.id === gridId ? updatedGridOverlay : o))
        : [...overlays, updatedGridOverlay];

      const updated = {
        ...activeProject,
        paperSettings: updatedPaper,
        overlays: nextOverlays,
        updatedAt: Date.now(),
      };
      void database.saveProject(updated);
    }
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
    if (tab === "grid") {
      setPaperPickerOpen(true);
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
          onPress={() => void handleSafeBack()}
          disabled={isNavigating}
          style={({ pressed }) => [styles.toolbarBtn, isNavigating && styles.btnDisabled, pressed && styles.btnPressed]}
          accessibilityLabel="Back to Projects"
        >
          <Text style={styles.toolbarBtnIcon}>‹</Text>
        </Pressable>

        <View style={styles.titleContainer}>
          <Text numberOfLines={1} style={styles.projectTitle}>
            {activeProject.name}
          </Text>
          <View style={styles.refInfoPill}>
            <Text style={styles.refInfoText}>
              {isNavigating
                ? "💾 Saving & Navigating…"
                : layout.isSmallPhone
                ? paper.size
                : `${refWidth} × ${refHeight} px · ${paper.size}`}
            </Text>
          </View>
        </View>

        {/* Action icons */}
        <View style={styles.topActions}>
          {experienceMode === "professional" ? (
            <Pressable
              onPress={() => setProControlPanelOpen(true)}
              style={({ pressed }) => [styles.proDialsBtn, pressed && styles.btnPressed]}
              accessibilityLabel="Open Pro Telemetry & Dials"
            >
              <Text style={styles.proDialsBtnText}>⚡ Dials</Text>
            </Pressable>
          ) : null}

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
          onPress={() => setModeModalOpen(true)}
          style={[styles.modeHudBadge, experienceMode === "professional" && styles.modeHudBadgePro]}
          accessibilityLabel="Switch Experience Mode"
        >
          <Text style={[styles.modeHudBadgeText, experienceMode === "professional" && styles.modeHudBadgeTextPro]}>
            {experienceMode === "beginner" ? "🌱 Beginner" : "⚡ Pro"}
          </Text>
        </Pressable>

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

      {/* BEGINNER COACH STRIP (Beginner Mode Only) */}
      {experienceMode === "beginner" ? (
        <BeginnerCoachStrip
          activeOverlays={overlays}
          onAddOverlay={handleAddDefaultOverlay}
          onOpenAdjustments={() => setAdjustmentPanelOpen(true)}
          onOpenHelp={(topic) => Alert.alert("Drawing Coach", topic)}
        />
      ) : null}

      {/* CENTRAL WORKSPACE CANVAS */}
      <View style={styles.canvasContainer}>
        <ReferenceCanvas
          referenceUri={activeReferenceUri}
          referenceWidth={refWidth}
          referenceHeight={refHeight}
          adjustments={activeProject.imageAdjustments}
          overlays={overlays}
          paper={paper}
          onImportPress={handleImportNewReference}
        />
      </View>

      {/* BOTTOM TOOL NAVIGATION */}
      <View style={styles.bottomNav}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.bottomNavScroll,
            !layout.isSmallPhone && { justifyContent: "space-around", flex: 1 },
          ]}
        >
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
        </ScrollView>
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
              <Text style={styles.menuItemIcon}>📐</Text>
              <Text style={styles.menuItemText}>Smart Paper & Grid Calculator</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => void handleSwitchToPaperStudio()}
              disabled={isNavigating}
              accessibilityLabel="Paper & Print Studio"
            >
              <Text style={styles.menuItemIcon}>📄</Text>
              <Text style={styles.menuItemText}>Paper & Print Studio (Fullscreen)</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => void handleSwitchToFreeDrawing()}
              disabled={isNavigating}
              accessibilityLabel="Switch to Free Drawing Studio"
            >
              <Text style={styles.menuItemIcon}>🎨</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemText}>Switch to Free Drawing Studio</Text>
                <Text style={styles.menuItemSub}>Draw digitally with Skia brushes and multi-layer canvas</Text>
              </View>
              <Text style={styles.menuItemArrow}>›</Text>
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
              style={styles.menuItem}
              onPress={() => {
                setMoreMenuOpen(false);
                router.push("/assistant/index" as any);
              }}
            >
              <Text style={styles.menuItemIcon}>🤖</Text>
              <Text style={styles.menuItemText}>AI Drawing Assistant & Guidance</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMoreMenuOpen(false);
                router.push("/comparison/index" as any);
              }}
            >
              <Text style={styles.menuItemIcon}>⚖️</Text>
              <Text style={styles.menuItemText}>Drawing Comparison & Feedback</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMoreMenuOpen(false);
                router.push("/learning/index" as any);
              }}
            >
              <Text style={styles.menuItemIcon}>🎓</Text>
              <Text style={styles.menuItemText}>Learning Studio & Lessons</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMoreMenuOpen(false);
                router.push("/practice/index" as any);
              }}
            >
              <Text style={styles.menuItemIcon}>⏱️</Text>
              <Text style={styles.menuItemText}>Practice Studio & Daily Challenges</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMoreMenuOpen(false);
                setModeModalOpen(true);
              }}
            >
              <Text style={styles.menuItemIcon}>
                {experienceMode === "beginner" ? "⚡" : "🌱"}
              </Text>
              <Text style={styles.menuItemText}>
                {experienceMode === "beginner" ? "Switch to Professional Mode" : "Switch to Beginner Mode"}
              </Text>
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

      {/* SMART PAPER-BASED GRID SPACING CALCULATOR */}
      <PaperGridCalculatorModal
        visible={paperPickerOpen}
        onClose={() => setPaperPickerOpen(false)}
        initialPaperSize={paper.size}
        initialOrientation={paper.orientation}
        initialCustomWidthMm={paper.widthMm}
        initialCustomHeightMm={paper.heightMm}
        initialSpacingMm={
          (overlays.find((o) => o.type === "grid") as any)?.cellSpacingMmX ??
          (overlays.find((o) => o.type === "grid") as any)?.cellSpacingMm ??
          20
        }
        onApplyGrid={handleApplyPaperGrid}
      />
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

      {/* PROFESSIONAL TELEMETRY & PARAMETRIC DIALS */}
      <ProfessionalControlPanel
        visible={proControlPanelOpen}
        onClose={() => setProControlPanelOpen(false)}
        overlays={overlays}
        onUpdateOverlay={handleUpdateOverlay}
      />

      {/* MODE SELECTOR MODAL */}
      <ModeSelectorModal
        visible={modeModalOpen}
        onClose={() => setModeModalOpen(false)}
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
  btnDisabled: {
    opacity: 0.45,
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
  proDialsBtn: {
    backgroundColor: "#2B2117",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A3724",
  },
  proDialsBtnText: {
    color: "#E2934D",
    fontSize: 11,
    fontWeight: "700",
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
  modeHudBadge: {
    backgroundColor: "#1C2A21",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2B4433",
  },
  modeHudBadgePro: {
    backgroundColor: "#2B2117",
    borderColor: "#4A3724",
  },
  modeHudBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#77D9A4",
  },
  modeHudBadgeTextPro: {
    color: "#E2934D",
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
    backgroundColor: "#141815",
    borderTopWidth: 1,
    borderTopColor: "#222A25",
    paddingVertical: 6,
  },
  bottomNavScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
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
  menuItemSub: {
    fontSize: 11,
    color: "#849086",
    marginTop: 2,
  },
  menuItemArrow: {
    color: "#6CD498",
    fontSize: 18,
    fontWeight: "700",
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
