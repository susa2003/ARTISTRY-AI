/**
 * ARTISTRY AI — Paper & Print Studio Workspace
 * Dedicated full-screen physical paper layout, margin calibration,
 * smart grid calculation, and ISO 32000-1 print-ready export workstation.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import type { PaperOrientation, PaperSize, UnifiedOverlay } from "../../domain/overlayTypes";
import type {
  ExportDpi,
  ExportTemplateType,
  GridAlignmentMode,
  PaperGridCalculation,
  SpacingUnit,
} from "../../features/paper/types";
import {
  GRID_SPACING_PRESETS,
  STANDARD_PAPER_DEFINITIONS,
  calculatePaperGrid,
  generatePrintableHtml,
  getSmartRecommendations,
  mmToUnit,
  unitToMm,
} from "../../features/paper/paperGridCalculator";
import { buildCalibratedPdf } from "../../features/paper/pdf/PdfDocumentBuilder";
import { PaperGridVisualPreview } from "../../features/paper/PaperGridVisualPreview";
import { useAppStore } from "../../state/appStore";
import { saveProject } from "../../storage/database";

export default function PaperStudioScreen() {
  const { id: routeId } = useLocalSearchParams<{ id: string }>();
  const currentProject = useAppStore((state) => state.currentProject);
  const openProject = useAppStore((state) => state.openProject);

  const setPaperSettings = useAppStore((state) => state.setPaperSettings);
  const addOverlay = useAppStore((state) => state.addOverlay);
  const updateOverlay = useAppStore((state) => state.updateOverlay);

  // Load project on mount if needed
  useEffect(() => {
    if (routeId && (!currentProject || currentProject.id !== routeId)) {
      void openProject(routeId);
    }
  }, [routeId, currentProject, openProject]);

  const activeProject = currentProject;
  const existingPaper = activeProject?.paperSettings;
  const overlays: UnifiedOverlay[] = activeProject?.overlays ?? [];
  const existingGrid = overlays.find((o) => o.type === "grid");

  // State: Paper selection
  const [paperSize, setPaperSize] = useState<PaperSize>(existingPaper?.size ?? "A4");
  const [orientation, setOrientation] = useState<PaperOrientation>(
    existingPaper?.orientation ?? "portrait"
  );
  const [customWidthText, setCustomWidthText] = useState(String(existingPaper?.widthMm ?? 210));
  const [customHeightText, setCustomHeightText] = useState(String(existingPaper?.heightMm ?? 297));

  // State: Margins
  const [marginTopText, setMarginTopText] = useState(
    String(existingPaper?.marginTopMm ?? existingPaper?.marginMm ?? 5)
  );
  const [marginBottomText, setMarginBottomText] = useState(
    String(existingPaper?.marginBottomMm ?? existingPaper?.marginMm ?? 5)
  );
  const [marginLeftText, setMarginLeftText] = useState(
    String(existingPaper?.marginLeftMm ?? existingPaper?.marginMm ?? 5)
  );
  const [marginRightText, setMarginRightText] = useState(
    String(existingPaper?.marginRightMm ?? existingPaper?.marginMm ?? 5)
  );
  const [marginsLinked, setMarginsLinked] = useState(true);
  const [alignmentMode, setAlignmentMode] = useState<GridAlignmentMode>(
    existingPaper?.gridAlignment ?? "centered"
  );
  const [fitInsideMargins, setFitInsideMargins] = useState(false);

  // State: Grid Spacing & Units
  const [unit, setUnit] = useState<SpacingUnit>("mm");
  const [isLinked, setIsLinked] = useState(true);
  const [spacingXText, setSpacingXText] = useState(
    String((existingGrid as any)?.cellSpacingMmX ?? (existingGrid as any)?.cellSpacingMm ?? 20)
  );
  const [spacingYText, setSpacingYText] = useState(
    String((existingGrid as any)?.cellSpacingMmY ?? (existingGrid as any)?.cellSpacingMm ?? 20)
  );

  // State: Export Configuration
  const [exportFormat, setExportFormat] = useState<"pdf" | "html">("pdf");
  const [templateType, setTemplateType] = useState<ExportTemplateType>("grid");
  const [exportDpi, setExportDpi] = useState<ExportDpi>(300);
  const [includeLabels, setIncludeLabels] = useState(true);
  const [includeMargins, setIncludeMargins] = useState(true);
  const [includeRulers, setIncludeRulers] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Parse numeric values safely
  const customWidthMm = Math.max(20, parseFloat(customWidthText) || 210);
  const customHeightMm = Math.max(20, parseFloat(customHeightText) || 297);

  const parsedSpacingX = Math.max(0.1, parseFloat(spacingXText) || 10);
  const parsedSpacingY = isLinked
    ? parsedSpacingX
    : Math.max(0.1, parseFloat(spacingYText) || parsedSpacingX);

  const spacingXMm = unitToMm(parsedSpacingX, unit);
  const spacingYMm = unitToMm(parsedSpacingY, unit);

  const marginTopMm = unitToMm(Math.max(0, parseFloat(marginTopText) || 0), unit);
  const marginBottomMm = unitToMm(Math.max(0, parseFloat(marginBottomText) || 0), unit);
  const marginLeftMm = unitToMm(Math.max(0, parseFloat(marginLeftText) || 0), unit);
  const marginRightMm = unitToMm(Math.max(0, parseFloat(marginRightText) || 0), unit);

  // Authoritative Paper Grid Calculation
  const calculation: PaperGridCalculation = useMemo(() => {
    return calculatePaperGrid({
      paperSize,
      orientation,
      spacingXMm,
      spacingYMm,
      customWidthMm,
      customHeightMm,
      selectedUnit: unit,
      targetDpi: exportDpi,
      marginTopMm,
      marginBottomMm,
      marginLeftMm,
      marginRightMm,
      alignmentMode,
      fitInsideMargins,
    });
  }, [
    paperSize,
    orientation,
    spacingXMm,
    spacingYMm,
    customWidthMm,
    customHeightMm,
    unit,
    exportDpi,
    marginTopMm,
    marginBottomMm,
    marginLeftMm,
    marginRightMm,
    alignmentMode,
    fitInsideMargins,
  ]);

  // Smart Recommendations
  const recommendations = useMemo(() => {
    return getSmartRecommendations(calculation.paperWidthMm, calculation.paperHeightMm);
  }, [calculation.paperWidthMm, calculation.paperHeightMm]);

  // Margin Handlers
  const handleUpdateMargin = (field: "top" | "bottom" | "left" | "right", val: string) => {
    if (marginsLinked) {
      setMarginTopText(val);
      setMarginBottomText(val);
      setMarginLeftText(val);
      setMarginRightText(val);
    } else {
      if (field === "top") setMarginTopText(val);
      if (field === "bottom") setMarginBottomText(val);
      if (field === "left") setMarginLeftText(val);
      if (field === "right") setMarginRightText(val);
    }
  };

  // Unit Change Handler
  const handleChangeUnit = (newUnit: SpacingUnit) => {
    if (newUnit === unit) return;
    const currentMmX = unitToMm(parseFloat(spacingXText) || 10, unit);
    const currentMmY = unitToMm(parseFloat(spacingYText) || 10, unit);
    setUnit(newUnit);
    setSpacingXText(String(mmToUnit(currentMmX, newUnit)));
    setSpacingYText(String(mmToUnit(currentMmY, newUnit)));

    const curTopMm = unitToMm(parseFloat(marginTopText) || 5, unit);
    setMarginTopText(String(mmToUnit(curTopMm, newUnit)));
    setMarginBottomText(String(mmToUnit(curTopMm, newUnit)));
    setMarginLeftText(String(mmToUnit(curTopMm, newUnit)));
    setMarginRightText(String(mmToUnit(curTopMm, newUnit)));
  };

  const handleSelectPreset = (presetMm: number) => {
    const converted = mmToUnit(presetMm, unit);
    setSpacingXText(String(converted));
    setSpacingYText(String(converted));
  };

  // Apply Changes to Project and Return
  const handleApplyToProject = useCallback(async () => {
    if (!activeProject) {
      router.back();
      return;
    }

    const updatedPaperSettings = {
      size: calculation.paperSize,
      orientation: calculation.orientation,
      widthMm: calculation.paperWidthMm,
      heightMm: calculation.paperHeightMm,
      marginMm: calculation.marginXMm,
      marginTopMm: calculation.marginTopMm,
      marginBottomMm: calculation.marginBottomMm,
      marginLeftMm: calculation.marginLeftMm,
      marginRightMm: calculation.marginRightMm,
      targetDpi: calculation.targetDpi,
      gridAlignment: calculation.alignmentMode,
    };

    setPaperSettings(updatedPaperSettings);

    const projectOverlays = activeProject.overlays ?? [];
    const existing = projectOverlays.find((o: UnifiedOverlay) => o.type === "grid");
    const gridId = existing?.id ?? `overlay-grid-${Date.now().toString(36)}`;

    const updatedGridOverlay: UnifiedOverlay = {
      ...(existing ?? {
        id: gridId,
        type: "grid" as const,
        name: "Paper Calibrated Grid",
        zIndex: projectOverlays.length + 1,
        color: "#28594B",
        strokeWidth: 1.5,
        showDiagonals: false,
        showSubdivisions: false,
      }),
      visible: true,
      opacity: existing?.opacity ?? 0.8,
      locked: existing?.locked ?? false,
      mode: "standard" as const,
      cellMode: "millimetre" as const,
      cellSpacingMm: calculation.spacingXMm,
      cellSpacingMmX: calculation.spacingXMm,
      cellSpacingMmY: calculation.spacingYMm,
      divisions: calculation.columns,
      gridColumns: calculation.columns,
      gridRows: calculation.rows,
      paperMarginXMm: calculation.gridOffsetX,
      paperMarginYMm: calculation.gridOffsetY,
      showLabels: true,
    };

    if (existing) {
      updateOverlay(updatedGridOverlay);
    } else {
      addOverlay(updatedGridOverlay);
    }

    const nextOverlays = existing
      ? projectOverlays.map((o: UnifiedOverlay) => (o.id === existing.id ? updatedGridOverlay : o))
      : [...projectOverlays, updatedGridOverlay];

    await saveProject({
      ...activeProject,
      paperSettings: updatedPaperSettings,
      overlays: nextOverlays,
    });

    Alert.alert(
      "Paper Settings Applied",
      `Calibrated ${calculation.paperSize} paper with ${calculation.columns}×${calculation.rows} grid (${calculation.spacingXMm}mm spacing) has been saved to your workspace.`,
      [{ text: "Open Reference Studio", onPress: () => router.replace(`/reference-studio/${activeProject.id}`) }]
    );
  }, [activeProject, calculation, setPaperSettings, updateOverlay, addOverlay]);

  // Export Engine (PDF & HTML)
  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportFormat === "pdf") {
        const result = buildCalibratedPdf({
          calculation,
          settings: {
            templateType,
            dpi: exportDpi,
            includeLabels,
            includeMargins,
            includeRulers,
            color: "#28594B",
          },
          projectTitle: activeProject?.name || "ARTISTRY AI — Physical Drawing Template",
        });

        const { uri } = await result.saveToFileAsync();

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: "Print Physical Drawing Grid",
            UTI: "com.adobe.pdf",
          });
        } else {
          Alert.alert("PDF Generated", `Saved calibrated PDF document to:\n${uri}`);
        }
      } else {
        const html = generatePrintableHtml(
          calculation,
          activeProject?.referenceUri,
          activeProject?.name || "ARTISTRY AI — Drawing Grid"
        );
        const filename = `ARTISTRY_${calculation.paperSize}_${calculation.columns}x${calculation.rows}.html`;
        const uri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(uri, html, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "text/html",
            dialogTitle: "Print Drawing Grid",
            UTI: "public.html",
          });
        } else {
          Alert.alert("HTML Generated", `Saved printable HTML document to:\n${uri}`);
        }
      }
    } catch (err) {
      Alert.alert("Export Failed", err instanceof Error ? err.message : "Could not export document.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top HUD */}
      <View style={styles.topHud}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityLabel="Back to Reference Studio"
        >
          <Text style={styles.backBtnText}>‹ Studio</Text>
        </Pressable>

        <View style={styles.headerTitles}>
          <Text style={styles.screenTag}>PAPER & PRINT STUDIO</Text>
          <Text style={styles.screenTitle} numberOfLines={1}>
            {activeProject?.name ?? "Physical Drawing Workspace"}
          </Text>
        </View>

        <Pressable
          onPress={handleApplyToProject}
          style={({ pressed }) => [styles.primarySaveBtn, pressed && styles.pressed]}
          accessibilityLabel="Apply to Project"
        >
          <Text style={styles.primarySaveBtnText}>✓ Apply</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.mainScroll} showsVerticalScrollIndicator={false}>
        {/* 1. VISUAL PREVIEW HERO */}
        <View style={styles.heroSection}>
          <Text style={styles.sectionHeader}>1. Aspect-Accurate Sheet Preview</Text>
          <PaperGridVisualPreview calculation={calculation} previewHeight={300} />
        </View>

        {/* 2. PAPER SETUP */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>2. Paper Dimensions & Orientation</Text>
            {/* Orientation Toggle */}
            <View style={styles.pillGroup}>
              <Pressable
                onPress={() => setOrientation("portrait")}
                style={[styles.pillBtn, orientation === "portrait" && styles.pillBtnActive]}
              >
                <Text style={[styles.pillBtnText, orientation === "portrait" && styles.pillBtnTextActive]}>
                  ↕ Portrait
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setOrientation("landscape")}
                style={[styles.pillBtn, orientation === "landscape" && styles.pillBtnActive]}
              >
                <Text style={[styles.pillBtnText, orientation === "landscape" && styles.pillBtnTextActive]}>
                  ↔ Landscape
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Paper Size Tabs */}
          <View style={styles.paperTabsGrid}>
            {(["A4", "A3", "A5", "A6", "US_LETTER", "CUSTOM"] as const).map((s) => {
              const isSelected = paperSize === s;
              const label =
                s === "US_LETTER"
                  ? "US Letter"
                  : s === "CUSTOM"
                  ? "Custom"
                  : `ISO ${s}`;
              const dims =
                s === "CUSTOM"
                  ? `${customWidthMm}×${customHeightMm}mm`
                  : `${STANDARD_PAPER_DEFINITIONS[s].widthMm}×${STANDARD_PAPER_DEFINITIONS[s].heightMm}mm`;

              return (
                <Pressable
                  key={s}
                  onPress={() => setPaperSize(s)}
                  style={[styles.paperTabCard, isSelected && styles.paperTabCardActive]}
                >
                  <Text style={[styles.paperTabLabel, isSelected && styles.paperTabLabelActive]}>
                    {label}
                  </Text>
                  <Text style={styles.paperTabDimsText}>{dims}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Custom Size Inputs */}
          {paperSize === "CUSTOM" && (
            <View style={styles.customRow}>
              <View style={styles.customField}>
                <Text style={styles.fieldLabel}>Width (mm):</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={customWidthText}
                  onChangeText={setCustomWidthText}
                  keyboardType="numeric"
                  placeholder="210"
                  placeholderTextColor="#68776E"
                />
              </View>
              <View style={styles.customField}>
                <Text style={styles.fieldLabel}>Height (mm):</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={customHeightText}
                  onChangeText={setCustomHeightText}
                  keyboardType="numeric"
                  placeholder="297"
                  placeholderTextColor="#68776E"
                />
              </View>
            </View>
          )}
        </View>

        {/* 3. MARGINS & PRINTABLE AREA */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionHeader}>3. Margins & Printable Safe Area</Text>
              <Text style={styles.sectionSub}>
                Printable: {calculation.printableWidthMm} × {calculation.printableHeightMm} mm
              </Text>
            </View>

            <Pressable
              onPress={() => setMarginsLinked(!marginsLinked)}
              style={[styles.linkBtn, marginsLinked && styles.linkBtnActive]}
            >
              <Text style={styles.linkBtnText}>{marginsLinked ? "🔗 Margins Linked" : "🔓 Independent"}</Text>
            </Pressable>
          </View>

          {/* 4-Way Margin Inputs */}
          <View style={styles.marginsGrid}>
            <View style={styles.marginItem}>
              <Text style={styles.marginTag}>Top ({unit})</Text>
              <TextInput
                style={styles.marginInput}
                value={marginTopText}
                onChangeText={(t) => handleUpdateMargin("top", t)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.marginItem}>
              <Text style={styles.marginTag}>Bottom ({unit})</Text>
              <TextInput
                style={styles.marginInput}
                value={marginBottomText}
                onChangeText={(t) => handleUpdateMargin("bottom", t)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.marginItem}>
              <Text style={styles.marginTag}>Left ({unit})</Text>
              <TextInput
                style={styles.marginInput}
                value={marginLeftText}
                onChangeText={(t) => handleUpdateMargin("left", t)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.marginItem}>
              <Text style={styles.marginTag}>Right ({unit})</Text>
              <TextInput
                style={styles.marginInput}
                value={marginRightText}
                onChangeText={(t) => handleUpdateMargin("right", t)}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Grid Alignment & Fit Toggles */}
          <View style={styles.alignmentRow}>
            <View style={styles.pillGroup}>
              <Pressable
                onPress={() => setAlignmentMode("centered")}
                style={[styles.pillBtn, alignmentMode === "centered" && styles.pillBtnActive]}
              >
                <Text style={[styles.pillBtnText, alignmentMode === "centered" && styles.pillBtnTextActive]}>
                  Centered
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setAlignmentMode("top-left")}
                style={[styles.pillBtn, alignmentMode === "top-left" && styles.pillBtnActive]}
              >
                <Text style={[styles.pillBtnText, alignmentMode === "top-left" && styles.pillBtnTextActive]}>
                  Top-Left
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setFitInsideMargins(!fitInsideMargins)}
              style={[styles.toggleBtn, fitInsideMargins && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleBtnText, fitInsideMargins && styles.toggleBtnTextActive]}>
                {fitInsideMargins ? "✓ Fit Inside Margins" : "Full Paper Sheet"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 4. GRID LINE SPACING */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>4. Grid Spacing & Units</Text>
            {/* Unit Selector */}
            <View style={styles.pillGroup}>
              {(["mm", "cm", "in"] as const).map((u) => (
                <Pressable
                  key={u}
                  onPress={() => handleChangeUnit(u)}
                  style={[styles.unitPill, unit === u && styles.unitPillActive]}
                >
                  <Text style={[styles.unitPillText, unit === u && styles.unitPillTextActive]}>{u}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Presets Row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsList}>
            {GRID_SPACING_PRESETS.map((p) => {
              const isSelected = Math.abs(spacingXMm - p.valueMm) < 0.1 && isLinked;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => handleSelectPreset(p.valueMm)}
                  style={[styles.presetItem, isSelected && styles.presetItemActive]}
                >
                  <Text style={[styles.presetItemText, isSelected && styles.presetItemTextActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Spacing Controls */}
          <View style={styles.spacingInputsCard}>
            <View style={styles.spacingInputRow}>
              <Text style={styles.spacingRowLabel}>
                {isLinked ? "Square Cell Spacing" : "Horizontal Spacing (X)"}
              </Text>
              <View style={styles.stepperContainer}>
                <Pressable
                  onPress={() => {
                    const step = unit === "in" ? 0.25 : unit === "cm" ? 0.5 : 5;
                    const next = Math.max(1, parsedSpacingX - step);
                    setSpacingXText(String(Math.round(next * 10) / 10));
                    if (isLinked) setSpacingYText(String(Math.round(next * 10) / 10));
                  }}
                  style={styles.stepperBtn}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </Pressable>
                <TextInput
                  style={styles.stepperInput}
                  value={spacingXText}
                  onChangeText={(t) => {
                    setSpacingXText(t);
                    if (isLinked) setSpacingYText(t);
                  }}
                  keyboardType="numeric"
                />
                <Text style={styles.stepperUnit}>{unit}</Text>
                <Pressable
                  onPress={() => {
                    const step = unit === "in" ? 0.25 : unit === "cm" ? 0.5 : 5;
                    const next = parsedSpacingX + step;
                    setSpacingXText(String(Math.round(next * 10) / 10));
                    if (isLinked) setSpacingYText(String(Math.round(next * 10) / 10));
                  }}
                  style={styles.stepperBtn}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={() => setIsLinked(!isLinked)}
              style={[styles.linkBtn, isLinked && styles.linkBtnActive]}
            >
              <Text style={styles.linkBtnText}>
                {isLinked ? "🔗 Square Cells (X = Y)" : "🔓 Unlinked (X ≠ Y)"}
              </Text>
            </Pressable>

            {!isLinked && (
              <View style={[styles.spacingInputRow, { marginTop: 12 }]}>
                <Text style={styles.spacingRowLabel}>Vertical Spacing (Y)</Text>
                <View style={styles.stepperContainer}>
                  <Pressable
                    onPress={() => {
                      const step = unit === "in" ? 0.25 : unit === "cm" ? 0.5 : 5;
                      const next = Math.max(1, parsedSpacingY - step);
                      setSpacingYText(String(Math.round(next * 10) / 10));
                    }}
                    style={styles.stepperBtn}
                  >
                    <Text style={styles.stepperBtnText}>−</Text>
                  </Pressable>
                  <TextInput
                    style={styles.stepperInput}
                    value={spacingYText}
                    onChangeText={setSpacingYText}
                    keyboardType="numeric"
                  />
                  <Text style={styles.stepperUnit}>{unit}</Text>
                  <Pressable
                    onPress={() => {
                      const step = unit === "in" ? 0.25 : unit === "cm" ? 0.5 : 5;
                      const next = parsedSpacingY + step;
                      setSpacingYText(String(Math.round(next * 10) / 10));
                    }}
                    style={styles.stepperBtn}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* 5. SMART RECOMMENDATIONS */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>5. Smart Spacing Recommendations</Text>
          <Text style={styles.sectionSub}>Calibrated for {calculation.paperSize} {calculation.orientation}:</Text>
          <View style={styles.recsList}>
            {recommendations.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => handleSelectPreset(r.presetMm)}
                style={styles.recItemCard}
              >
                <View style={styles.recItemTop}>
                  <Text style={styles.recItemTitle}>{r.label}</Text>
                  <Text style={styles.recItemTier}>
                    {r.tier === "fine" ? "🎯 Fine" : r.tier === "balanced" ? "⚖️ Balanced" : "⚡ Coarse"}
                  </Text>
                </View>
                <Text style={styles.recItemCount}>{r.columns} cols × {r.rows} rows</Text>
                <Text style={styles.recItemDesc}>{r.description}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 6. PHYSICAL ACCURACY & COORDINATES METRICS */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Physical Drawing Calibration & Specs</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricVal}>{calculation.columns} × {calculation.rows}</Text>
              <Text style={styles.metricLbl}>Columns × Rows</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricVal}>{calculation.totalCells}</Text>
              <Text style={styles.metricLbl}>Total Cells</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricVal}>{calculation.cellWidthMm} × {calculation.cellHeightMm} mm</Text>
              <Text style={styles.metricLbl}>Cell Physical Size</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricVal}>{calculation.pageWidthPt} × {calculation.pageHeightPt} pt</Text>
              <Text style={styles.metricLbl}>PDF MediaBox (PostScript)</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricVal}>{calculation.pixelWidth} × {calculation.pixelHeight} px</Text>
              <Text style={styles.metricLbl}>{exportDpi} DPI Pixel Res</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricVal}>±{calculation.marginXMm}mm / ±{calculation.marginYMm}mm</Text>
              <Text style={styles.metricLbl}>Active Grid Offsets</Text>
            </View>
          </View>
        </View>

        {/* 7. GENUINE ISO 32000-1 PDF & PRINT EXPORT */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>7. Print-Ready Vector PDF Export</Text>
          <Text style={styles.sectionSub}>Generate genuine ISO 32000-1 binary PDF with exact physical PostScript dimensions.</Text>

          {/* Format Selector */}
          <View style={[styles.pillGroup, { marginTop: 12 }]}>
            <Pressable
              onPress={() => setExportFormat("pdf")}
              style={[styles.pillBtn, exportFormat === "pdf" && styles.pillBtnActive]}
            >
              <Text style={[styles.pillBtnText, exportFormat === "pdf" && styles.pillBtnTextActive]}>
                📄 PDF (ISO 32000-1 Vector)
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setExportFormat("html")}
              style={[styles.pillBtn, exportFormat === "html" && styles.pillBtnActive]}
            >
              <Text style={[styles.pillBtnText, exportFormat === "html" && styles.pillBtnTextActive]}>
                🌐 HTML (CSS @page)
              </Text>
            </Pressable>
          </View>

          {/* Template Selector */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Template Mode:</Text>
          <View style={styles.pillGroup}>
            {(["grid", "blank", "reference-overlays"] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTemplateType(t)}
                style={[styles.pillBtn, templateType === t && styles.pillBtnActive]}
              >
                <Text style={[styles.pillBtnText, templateType === t && styles.pillBtnTextActive]}>
                  {t === "grid" ? "Grid Template" : t === "blank" ? "Blank Paper" : "Photo + Grid"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* DPI Selector */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Print Resolution (DPI):</Text>
          <View style={styles.pillGroup}>
            {([150, 200, 300, 600] as const).map((d) => (
              <Pressable
                key={d}
                onPress={() => setExportDpi(d)}
                style={[styles.unitPill, exportDpi === d && styles.unitPillActive]}
              >
                <Text style={[styles.unitPillText, exportDpi === d && styles.unitPillTextActive]}>{d} DPI</Text>
              </Pressable>
            ))}
          </View>

          {/* Options Toggles */}
          <View style={styles.optionsRow}>
            <Pressable
              onPress={() => setIncludeLabels(!includeLabels)}
              style={[styles.toggleBtn, includeLabels && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleBtnText, includeLabels && styles.toggleBtnTextActive]}>
                {includeLabels ? "✓ Alphanumeric Labels (A-Z, 1-N)" : "No Labels"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setIncludeMargins(!includeMargins)}
              style={[styles.toggleBtn, includeMargins && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleBtnText, includeMargins && styles.toggleBtnTextActive]}>
                {includeMargins ? "✓ Margin Boundary" : "No Margin Line"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setIncludeRulers(!includeRulers)}
              style={[styles.toggleBtn, includeRulers && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleBtnText, includeRulers && styles.toggleBtnTextActive]}>
                {includeRulers ? "✓ Edge Metric Rulers" : "No Rulers"}
              </Text>
            </Pressable>
          </View>

          {/* Printer Advisory Banner */}
          <View style={styles.advisoryBanner}>
            <Text style={styles.advisoryIcon}>⚠️</Text>
            <Text style={styles.advisoryText}>
              IMPORTANT PHYSICAL SCALE ADVISORY: In your printer dialog, always select "100%" or "Actual Size". NEVER choose "Fit to Page" or "Shrink to Fit", as scaling distorts true physical millimetre dimensions.
            </Text>
          </View>

          {/* Export Action Button */}
          <Pressable
            onPress={handleExport}
            disabled={isExporting}
            style={({ pressed }) => [styles.exportActionButton, pressed && styles.pressed]}
          >
            <Text style={styles.exportActionButtonText}>
              {isExporting ? "Compiling Document..." : `📥 Export Calibrated ${exportFormat.toUpperCase()} Sheet`}
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111613",
  },
  topHud: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E2A22",
    backgroundColor: "#151C17",
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#202C24",
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#83A090",
  },
  headerTitles: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 8,
  },
  screenTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6CD498",
    letterSpacing: 1.2,
  },
  screenTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F6F5EE",
    marginTop: 2,
  },
  primarySaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#28594B",
  },
  primarySaveBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  mainScroll: {
    flex: 1,
    padding: 16,
  },
  heroSection: {
    backgroundColor: "#161E19",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#24352A",
    alignItems: "center",
  },
  sectionCard: {
    backgroundColor: "#161E19",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#24352A",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  sectionSub: {
    fontSize: 12,
    color: "#8FA396",
    marginTop: 2,
  },
  pillGroup: {
    flexDirection: "row",
    backgroundColor: "#101612",
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pillBtnActive: {
    backgroundColor: "#28594B",
  },
  pillBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8FA396",
  },
  pillBtnTextActive: {
    color: "#FFFFFF",
  },
  paperTabsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paperTabCard: {
    width: "31%",
    backgroundColor: "#1E2A22",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#2B3C31",
  },
  paperTabCardActive: {
    backgroundColor: "#244234",
    borderColor: "#6CD498",
  },
  paperTabLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#BCCDC2",
  },
  paperTabLabelActive: {
    color: "#FFFFFF",
  },
  paperTabDimsText: {
    fontSize: 10,
    color: "#7E9689",
    marginTop: 2,
  },
  customRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  customField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#BCCDC2",
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: "#101612",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#FFFFFF",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#2B3C31",
  },
  marginsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  marginItem: {
    flex: 1,
  },
  marginTag: {
    fontSize: 11,
    color: "#8FA396",
    marginBottom: 4,
  },
  marginInput: {
    backgroundColor: "#101612",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: "#FFFFFF",
    fontSize: 13,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#2B3C31",
  },
  alignmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#1E2A22",
    borderWidth: 1,
    borderColor: "#2B3C31",
  },
  toggleBtnActive: {
    backgroundColor: "#28594B",
    borderColor: "#6CD498",
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#BCCDC2",
  },
  toggleBtnTextActive: {
    color: "#FFFFFF",
  },
  linkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "#1E2A22",
  },
  linkBtnActive: {
    backgroundColor: "#244234",
  },
  linkBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8FA396",
  },
  unitPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  unitPillActive: {
    backgroundColor: "#28594B",
  },
  unitPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8FA396",
  },
  unitPillTextActive: {
    color: "#FFFFFF",
  },
  presetsList: {
    gap: 8,
    paddingVertical: 8,
  },
  presetItem: {
    backgroundColor: "#1E2A22",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2B3C31",
  },
  presetItemActive: {
    backgroundColor: "#244234",
    borderColor: "#6CD498",
  },
  presetItemText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#BCCDC2",
  },
  presetItemTextActive: {
    color: "#6CD498",
  },
  spacingInputsCard: {
    backgroundColor: "#101612",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  spacingInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  spacingRowLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F6F5EE",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#202C24",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6CD498",
  },
  stepperInput: {
    width: 50,
    height: 32,
    backgroundColor: "#18201A",
    borderRadius: 6,
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    borderWidth: 1,
    borderColor: "#2B3C31",
  },
  stepperUnit: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8FA396",
    width: 24,
  },
  recsList: {
    gap: 8,
    marginTop: 8,
  },
  recItemCard: {
    backgroundColor: "#1B261F",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#28392F",
  },
  recItemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recItemTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6CD498",
  },
  recItemTier: {
    fontSize: 11,
    color: "#BCCDC2",
  },
  recItemCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F6F5EE",
    marginTop: 2,
  },
  recItemDesc: {
    fontSize: 11,
    color: "#7E9689",
    marginTop: 2,
  },
  metricsCard: {
    backgroundColor: "#1B2920",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#2B4736",
  },
  metricsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6CD498",
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricBlock: {
    width: "48%",
    backgroundColor: "#141D17",
    borderRadius: 8,
    padding: 10,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  metricLbl: {
    fontSize: 10,
    color: "#8FA396",
    marginTop: 2,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  advisoryBanner: {
    flexDirection: "row",
    backgroundColor: "#2B2117",
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#573F26",
  },
  advisoryIcon: {
    fontSize: 16,
  },
  advisoryText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: "#E5BE94",
    fontWeight: "600",
  },
  exportActionButton: {
    backgroundColor: "#28594B",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  exportActionButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  pressed: {
    opacity: 0.8,
  },
});
