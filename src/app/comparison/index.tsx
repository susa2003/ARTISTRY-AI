/**
 * ARTISTRY AI — Drawing Comparison & Feedback Workspace
 * Dedicated workspace for comparing reference images with physical drawings:
 * - 5 Classical comparison modes: Side-by-side, Reference Overlay,
 *   Drawing Overlay, Adjustable Opacity (Onion), Split-View, Difference Map
 * - Practical manual alignment: Zoom, Pan, Rotation, Flip, Aspect Ratio
 * - Discrepancy analysis: Proportion, Placement, Angles, Contours, Spacing, Tonal
 * - Actionable traditional drawing advice on physical paper
 * - SQLite comparison history persistence and offline operation
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import type {
  DrawingComparisonFeedbackResult,
  DrawingComparisonMode,
  FeedbackCategory,
  ImageAlignmentSettings,
  SavedDrawingComparisonRecord,
} from "../../features/comparison/types";
import { DEFAULT_ALIGNMENT_SETTINGS } from "../../features/comparison/types";
import { ComparisonTransform } from "../../features/comparison/ComparisonTransform";
import { DrawingFeedbackEngine } from "../../features/comparison/DrawingFeedbackEngine";
import {
  deleteDrawingComparison,
  getDrawingComparisons,
  saveDrawingComparison,
} from "../../storage/database";
import { useAppStore } from "../../state/appStore";
import { useResponsiveLayout } from "../../components/AppUI";

const COMPARISON_MODES: Array<{ id: DrawingComparisonMode; label: string; icon: string }> = [
  { id: "side_by_side", label: "Side by Side", icon: "↔️" },
  { id: "opacity_overlay", label: "Opacity (Onion)", icon: "🧅" },
  { id: "split_view", label: "Split Wipe", icon: "✂️" },
  { id: "reference_overlay", label: "Ref on Draw", icon: "📋" },
  { id: "drawing_overlay", label: "Draw on Ref", icon: "✏️" },
  { id: "difference_map", label: "Diff Heatmap", icon: "🔥" },
];

export default function DrawingComparisonScreen() {
  const layout = useResponsiveLayout();
  const currentProject = useAppStore((state) => state.currentProject);
  const createProject = useAppStore((state) => state.createProject);
  const projects = useAppStore((state) => state.projects);

  const [isOpeningStudio, setIsOpeningStudio] = useState(false);

  const [referenceUri, setReferenceUri] = useState<string | null>(
    currentProject?.referenceUri ?? null
  );
  const [drawingUri, setDrawingUri] = useState<string | null>(null);

  const [comparisonMode, setComparisonMode] = useState<DrawingComparisonMode>("side_by_side");
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.5);
  const [splitPosition, setSplitPosition] = useState<number>(0.5);

  const [alignment, setAlignment] = useState<ImageAlignmentSettings>(DEFAULT_ALIGNMENT_SETTINGS);
  const [feedbackResult, setFeedbackResult] = useState<DrawingComparisonFeedbackResult | null>(null);
  const [userNotes, setUserNotes] = useState<string>("");
  const [savedComparisons, setSavedComparisons] = useState<SavedDrawingComparisonRecord[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<FeedbackCategory | "all">("all");

  const loadHistory = useCallback(async () => {
    try {
      const history = await getDrawingComparisons(20);
      setSavedComparisons(history);
    } catch {
      // Safe fallback
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // Pick Reference from Gallery
  const handlePickReference = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setReferenceUri(res.assets[0].uri);
        setFeedbackResult(null);
      }
    } catch {
      Alert.alert("Picker Error", "Could not open image picker.");
    }
  };

  // Pick Drawing from Gallery or Camera
  const handlePickDrawing = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setDrawingUri(res.assets[0].uri);
        setFeedbackResult(null);
      }
    } catch {
      Alert.alert("Picker Error", "Could not open image picker.");
    }
  };

  // Alignment Controls
  const handleResetAlignment = () => {
    setAlignment(ComparisonTransform.resetAlignment());
  };

  const handleZoom = (factor: number) => {
    setAlignment((prev) => ComparisonTransform.applyZoom(prev, factor));
  };

  const handlePan = (dx: number, dy: number) => {
    setAlignment((prev) => ComparisonTransform.applyPan(prev, dx, dy));
  };

  const handleRotate = (deg: number) => {
    setAlignment((prev) => ComparisonTransform.applyRotation(prev, deg));
  };

  const handleToggleFlip = () => {
    setAlignment((prev) => ({ ...prev, flipHorizontal: !prev.flipHorizontal }));
  };

  // Run Feedback Analysis
  const handleAnalyzeFeedback = () => {
    if (!referenceUri || !drawingUri) {
      Alert.alert("Images Missing", "Please select both a reference image and your physical drawing.");
      return;
    }
    const result = DrawingFeedbackEngine.analyzeComparison(referenceUri, drawingUri, {
      alignment,
    });
    setFeedbackResult(result);
  };

  // Save Comparison Record
  const handleSaveComparison = async () => {
    if (!referenceUri || !drawingUri || !feedbackResult || isSaving) return;
    setIsSaving(true);
    try {
      const now = Date.now();
      const record: SavedDrawingComparisonRecord = {
        id: `comp-rec-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        projectId: currentProject?.id,
        referenceUri,
        drawingUri,
        alignment,
        comparisonMode,
        feedback: feedbackResult,
        userNotes: userNotes.trim() || undefined,
        createdAt: now,
      };

      await saveDrawingComparison(record);
      await loadHistory();
      Alert.alert("Saved", "Comparison record saved successfully.");
    } catch {
      Alert.alert("Save Error", "Could not save comparison.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    await deleteDrawingComparison(id);
    await loadHistory();
  };

  const filteredFeedbackItems = useMemo(() => {
    if (!feedbackResult) return [];
    if (activeCategoryFilter === "all") return feedbackResult.items;
    return feedbackResult.items.filter((item) => item.category === activeCategoryFilter);
  }, [feedbackResult, activeCategoryFilter]);

  const drawingTransformStyle = useMemo(
    () => ({
      transform: ComparisonTransform.getTransformStyles(alignment),
    }),
    [alignment]
  );

  const handleOpenReferenceStudio = async () => {
    if (isOpeningStudio) return;
    setIsOpeningStudio(true);
    try {
      if (currentProject) {
        router.push(`/reference-studio/${currentProject.id}` as any);
      } else {
        const id = await createProject(referenceUri, "Comparison Reference Study");
        router.push(`/reference-studio/${id}` as any);
      }
    } catch {
      router.push("/projects" as any);
    } finally {
      setIsOpeningStudio(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={[styles.topHud, { paddingHorizontal: layout.horizontalPadding }]}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityLabel="Back"
        >
          <Text style={styles.backBtnText}>‹ Back</Text>
        </Pressable>

        <View style={styles.headerTitles}>
          <Text style={styles.screenTag}>ARTISTRY AI STUDIO</Text>
          <Text style={styles.screenTitle}>Drawing Comparison</Text>
        </View>

        <Pressable
          onPress={handleResetAlignment}
          style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}
          accessibilityLabel="Reset alignment"
        >
          <Text style={styles.resetBtnText}>↺ Reset</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            maxWidth: layout.contentMaxWidth,
            alignSelf: "center",
            width: "100%",
            paddingHorizontal: layout.horizontalPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Comparison Mode Selector Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeChipsScroll}>
          {COMPARISON_MODES.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => setComparisonMode(m.id)}
              style={[
                styles.modeChip,
                comparisonMode === m.id && styles.modeChipActive,
              ]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  comparisonMode === m.id && styles.modeChipTextActive,
                ]}
              >
                {m.icon} {m.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Image Selection Buttons Row */}
        <View style={[styles.imageSelectorRow, layout.isSmallPhone && { flexDirection: "column" }]}>
          <Pressable
            onPress={handlePickReference}
            style={({ pressed }) => [styles.imageSelectBtn, pressed && styles.pressed]}
            accessibilityLabel="Select Reference Image"
          >
            <Text style={styles.imageSelectBtnLabel}>Reference Image</Text>
            <Text style={styles.imageSelectBtnStatus} numberOfLines={1}>
              {referenceUri ? "✓ Reference Loaded" : "📷 Pick Reference"}
            </Text>
          </Pressable>

          <Pressable
            onPress={handlePickDrawing}
            style={({ pressed }) => [styles.imageSelectBtn, pressed && styles.pressed]}
            accessibilityLabel="Select Drawing Photo"
          >
            <Text style={styles.imageSelectBtnLabel}>Physical Drawing</Text>
            <Text style={styles.imageSelectBtnStatus} numberOfLines={1}>
              {drawingUri ? "✓ Drawing Loaded" : "✏️ Pick Drawing Photo"}
            </Text>
          </Pressable>
        </View>

        {/* Main Comparison Canvas Stage */}
        <View style={styles.stageContainer}>
          {!referenceUri || !drawingUri ? (
            <View style={styles.emptyStage}>
              <Text style={styles.emptyStageIcon}>🔍</Text>
              <Text style={styles.emptyStageTitle}>Select Both Images to Compare</Text>
              <Text style={styles.emptyStageSub}>
                Load your original reference and a photograph of your physical drawing to inspect differences.
              </Text>
            </View>
          ) : (
            <View style={[styles.canvasWrapper, { height: layout.isTablet ? 420 : layout.isSmallPhone ? 240 : 320 }]}>
              {/* Mode 1: Side by Side */}
              {comparisonMode === "side_by_side" && (
                <View style={styles.sideBySideRow}>
                  <View style={styles.sideHalf}>
                    <Text style={styles.sideLabel}>ORIGINAL REFERENCE</Text>
                    <Image source={{ uri: referenceUri }} style={styles.sideImage} resizeMode="contain" />
                  </View>
                  <View style={styles.sideHalf}>
                    <Text style={styles.sideLabel}>PHYSICAL DRAWING</Text>
                    <View style={styles.alignedImageContainer}>
                      <Image source={{ uri: drawingUri }} style={[styles.sideImage, drawingTransformStyle]} resizeMode="contain" />
                    </View>
                  </View>
                </View>
              )}

              {/* Mode 2: Reference Overlay on Drawing */}
              {comparisonMode === "reference_overlay" && (
                <View style={styles.overlayStage}>
                  <Image source={{ uri: drawingUri }} style={[styles.fillImage, drawingTransformStyle]} resizeMode="contain" />
                  <Image source={{ uri: referenceUri }} style={[styles.fillImage, { opacity: overlayOpacity }]} resizeMode="contain" />
                  <View style={styles.stageBadge}>
                    <Text style={styles.stageBadgeText}>Reference Over Drawing ({Math.round(overlayOpacity * 100)}%)</Text>
                  </View>
                </View>
              )}

              {/* Mode 3: Drawing Overlay on Reference */}
              {comparisonMode === "drawing_overlay" && (
                <View style={styles.overlayStage}>
                  <Image source={{ uri: referenceUri }} style={styles.fillImage} resizeMode="contain" />
                  <Image source={{ uri: drawingUri }} style={[styles.fillImage, drawingTransformStyle, { opacity: overlayOpacity }]} resizeMode="contain" />
                  <View style={styles.stageBadge}>
                    <Text style={styles.stageBadgeText}>Drawing Over Reference ({Math.round(overlayOpacity * 100)}%)</Text>
                  </View>
                </View>
              )}

              {/* Mode 4: Opacity Overlay (Onion Skin) */}
              {comparisonMode === "opacity_overlay" && (
                <View style={styles.overlayStage}>
                  <Image source={{ uri: referenceUri }} style={styles.fillImage} resizeMode="contain" />
                  <Image source={{ uri: drawingUri }} style={[styles.fillImage, drawingTransformStyle, { opacity: overlayOpacity }]} resizeMode="contain" />
                  <View style={styles.stageBadge}>
                    <Text style={styles.stageBadgeText}>Blend: Ref ← {Math.round(overlayOpacity * 100)}% → Draw</Text>
                  </View>
                </View>
              )}

              {/* Mode 5: Split Wipe View */}
              {comparisonMode === "split_view" && (
                <View style={styles.overlayStage}>
                  <Image source={{ uri: referenceUri }} style={styles.fillImage} resizeMode="contain" />
                  <View style={[styles.splitClip, { width: `${Math.round(splitPosition * 100)}%` }]}>
                    <Image source={{ uri: drawingUri }} style={[styles.fillImage, drawingTransformStyle]} resizeMode="contain" />
                  </View>
                  <View style={[styles.splitDividerLine, { left: `${Math.round(splitPosition * 100)}%` }]} />
                  <View style={styles.stageBadge}>
                    <Text style={styles.stageBadgeText}>Split Wipe ({Math.round(splitPosition * 100)}%)</Text>
                  </View>
                </View>
              )}

              {/* Mode 6: Difference Heatmap */}
              {comparisonMode === "difference_map" && (
                <View style={styles.overlayStage}>
                  <Image source={{ uri: referenceUri }} style={styles.fillImage} resizeMode="contain" />
                  <Image source={{ uri: drawingUri }} style={[styles.fillImage, drawingTransformStyle, { opacity: 0.6 }]} resizeMode="contain" />
                  <View style={styles.heatmapLegend}>
                    <Text style={styles.legendText}>🟢 Matching Contours   🔴 Line Drift</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Interactive Sliders for Opacity or Split Wipe */}
          {referenceUri && drawingUri && (
            <View style={styles.sliderControlsBar}>
              {comparisonMode === "split_view" ? (
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderLabel}>Split Wipe:</Text>
                  <Pressable onPress={() => setSplitPosition((p) => Math.max(0.1, p - 0.1))} style={styles.sliderStepBtn}>
                    <Text style={styles.sliderStepBtnText}>◀</Text>
                  </Pressable>
                  <Text style={styles.sliderVal}>{Math.round(splitPosition * 100)}%</Text>
                  <Pressable onPress={() => setSplitPosition((p) => Math.min(0.9, p + 0.1))} style={styles.sliderStepBtn}>
                    <Text style={styles.sliderStepBtnText}>▶</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderLabel}>Overlay Opacity:</Text>
                  <Pressable onPress={() => setOverlayOpacity((o) => Math.max(0.1, o - 0.1))} style={styles.sliderStepBtn}>
                    <Text style={styles.sliderStepBtnText}>-</Text>
                  </Pressable>
                  <Text style={styles.sliderVal}>{Math.round(overlayOpacity * 100)}%</Text>
                  <Pressable onPress={() => setOverlayOpacity((o) => Math.min(1.0, o + 0.1))} style={styles.sliderStepBtn}>
                    <Text style={styles.sliderStepBtnText}>+</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Manual Alignment Controls Box */}
        {referenceUri && drawingUri && (
          <View style={styles.controlsCard}>
            <Text style={styles.controlsHeading}>Drawing Alignment Controls</Text>
            <Text style={styles.controlsSub}>
              Align corresponding landmarks on physical paper (translation, scale, rotation):
            </Text>

            <View style={[styles.controlButtonsGrid, layout.isSmallPhone && { flexDirection: "column", alignItems: "stretch" }]}>
              {/* Pan D-Pad */}
              <View style={styles.dpadGroup}>
                <Pressable onPress={() => handlePan(0, -15)} style={styles.controlBtn}>
                  <Text style={styles.controlBtnText}>▲ Up</Text>
                </Pressable>
                <View style={styles.dpadHorizontalRow}>
                  <Pressable onPress={() => handlePan(-15, 0)} style={styles.controlBtn}>
                    <Text style={styles.controlBtnText}>◀ Left</Text>
                  </Pressable>
                  <Pressable onPress={() => handlePan(15, 0)} style={styles.controlBtn}>
                    <Text style={styles.controlBtnText}>Right ▶</Text>
                  </Pressable>
                </View>
                <Pressable onPress={() => handlePan(0, 15)} style={styles.controlBtn}>
                  <Text style={styles.controlBtnText}>▼ Down</Text>
                </Pressable>
              </View>

              {/* Zoom & Rotation */}
              <View style={styles.secondaryControlsGroup}>
                <View style={styles.zoomButtonsRow}>
                  <Pressable onPress={() => handleZoom(0.9)} style={styles.controlBtn}>
                    <Text style={styles.controlBtnText}>🔍 - Zoom</Text>
                  </Pressable>
                  <Text style={styles.scaleDisplay}>{alignment.scale.toFixed(2)}x</Text>
                  <Pressable onPress={() => handleZoom(1.1)} style={styles.controlBtn}>
                    <Text style={styles.controlBtnText}>🔍 + Zoom</Text>
                  </Pressable>
                </View>

                <View style={styles.rotateButtonsRow}>
                  <Pressable onPress={() => handleRotate(-3)} style={styles.controlBtn}>
                    <Text style={styles.controlBtnText}>↺ -3°</Text>
                  </Pressable>
                  <Pressable onPress={() => handleRotate(3)} style={styles.controlBtn}>
                    <Text style={styles.controlBtnText}>↻ +3°</Text>
                  </Pressable>
                  <Pressable onPress={handleToggleFlip} style={styles.controlBtn}>
                    <Text style={styles.controlBtnText}>⇄ Flip</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Analyze Differences Button */}
            <Pressable
              onPress={handleAnalyzeFeedback}
              style={({ pressed }) => [styles.analyzeFeedbackBtn, pressed && styles.pressed]}
              accessibilityLabel="Analyze Differences and Feedback"
            >
              <Text style={styles.analyzeFeedbackBtnText}>
                🎯 Analyze Drawing Differences & Feedback
              </Text>
            </Pressable>
          </View>
        )}

        {/* Feedback Analysis Results */}
        {feedbackResult && (
          <View style={styles.feedbackContainer}>
            {/* Score Banner */}
            <View style={[styles.scoreBanner, layout.isSmallPhone && { flexDirection: "column", alignItems: "flex-start", gap: 12 }]}>
              <View>
                <Text style={styles.scoreBannerTitle}>Correspondence Accuracy</Text>
                <Text style={styles.scoreBannerSub}>{feedbackResult.summary}</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreNumber}>{feedbackResult.overallMatchScore}%</Text>
                <Text style={styles.scoreLabel}>Match</Text>
              </View>
            </View>

            {/* Category Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChipsScroll}>
              {(["all", "proportion", "placement", "angle", "contour", "spacing", "tonal"] as const).map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setActiveCategoryFilter(cat)}
                  style={[
                    styles.catChip,
                    activeCategoryFilter === cat && styles.catChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      activeCategoryFilter === cat && styles.catChipTextActive,
                    ]}
                  >
                    {cat === "all" ? "All Feedback" : cat.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Discrepancy Items List */}
            <View style={styles.feedbackItemsList}>
              {filteredFeedbackItems.map((item) => (
                <View key={item.id} style={styles.feedbackCard}>
                  <View style={styles.feedbackTopRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{item.category.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.confidenceBadge, getConfidenceStyle(item.confidence)]}>
                      <Text style={styles.confidenceText}>{item.confidence.toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={styles.feedbackTitle}>{item.detectedDifference}</Text>
                  <Text style={styles.feedbackLocation}>📍 Location: {item.approximateLocation}</Text>
                  <Text style={styles.feedbackExplanation}>{item.explanation}</Text>

                  <View style={styles.suggestionBox}>
                    <Text style={styles.suggestionTitle}>✏️ Traditional Drawing Advice:</Text>
                    <Text style={styles.suggestionText}>{item.suggestedCorrection}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Limitations Notice Box */}
            <View style={styles.limitationsBox}>
              <Text style={styles.limitationsText}>ℹ️ {feedbackResult.limitationsNotice}</Text>
            </View>

            {/* Save Comparison Section */}
            <View style={styles.saveCard}>
              <Text style={styles.saveHeading}>Save Comparison to Project</Text>
              <TextInput
                style={styles.notesInput}
                multiline
                numberOfLines={3}
                placeholder="Personal notes: e.g. Eye placement 2mm high, corrected with kneaded eraser..."
                placeholderTextColor="#688072"
                value={userNotes}
                onChangeText={setUserNotes}
              />
              <Pressable
                disabled={isSaving}
                onPress={handleSaveComparison}
                style={({ pressed }) => [styles.saveBtn, isSaving && styles.btnDisabled, pressed && styles.pressed]}
                accessibilityLabel="Save Comparison"
              >
                <Text style={styles.saveBtnText}>
                  {isSaving ? "Saving Record..." : "💾 Save Comparison Record"}
                </Text>
              </Pressable>

              <Pressable
                disabled={isOpeningStudio}
                onPress={() => void handleOpenReferenceStudio()}
                style={({ pressed }) => [styles.saveBtn, { backgroundColor: "#20352A", borderColor: "#2F5040", marginTop: 8 }, isOpeningStudio && styles.btnDisabled, pressed && styles.pressed]}
                accessibilityLabel="Apply Feedback in Reference Studio"
              >
                <Text style={[styles.saveBtnText, { color: "#6CD498" }]}>
                  {isOpeningStudio ? "Opening Reference Studio…" : "📐 Apply in Reference Studio ›"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Saved Comparison History Drawer */}
        <View style={styles.historySection}>
          <Pressable
            onPress={() => setShowHistory((prev) => !prev)}
            style={({ pressed }) => [styles.historyHeader, pressed && styles.pressed]}
          >
            <View>
              <Text style={styles.historyTitle}>Comparison History</Text>
              <Text style={styles.historySubtitle}>{savedComparisons.length} saved comparisons</Text>
            </View>
            <Text style={styles.historyArrow}>{showHistory ? "▲" : "▼"}</Text>
          </Pressable>

          {showHistory && (
            <View style={styles.historyList}>
              {savedComparisons.length === 0 ? (
                <Text style={styles.noHistoryText}>No saved comparisons yet.</Text>
              ) : (
                savedComparisons.map((item) => (
                  <View key={item.id} style={styles.historyItem}>
                    <View style={styles.historyItemTop}>
                      <Text style={styles.historyItemScore}>
                        Match: {item.feedback.overallMatchScore}% ({item.comparisonMode})
                      </Text>
                      <Pressable onPress={() => handleDeleteSaved(item.id)} style={styles.deleteBtn}>
                        <Text style={styles.deleteBtnText}>🗑</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.historyItemDate}>
                      {new Date(item.createdAt).toLocaleDateString()} • {item.feedback.items.length} feedback points
                    </Text>
                    {item.userNotes && (
                      <Text style={styles.historyItemNotes} numberOfLines={2}>
                        "{item.userNotes}"
                      </Text>
                    )}
                    <Pressable
                      onPress={() => {
                        setReferenceUri(item.referenceUri);
                        setDrawingUri(item.drawingUri);
                        setAlignment(item.alignment);
                        setComparisonMode(item.comparisonMode);
                        setFeedbackResult(item.feedback);
                      }}
                      style={styles.reloadBtn}
                    >
                      <Text style={styles.reloadBtnText}>Review in Workspace ›</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getConfidenceStyle(conf: string) {
  switch (conf) {
    case "high":
      return { backgroundColor: "#1F382B", borderColor: "#6CD498" };
    case "medium":
      return { backgroundColor: "#332B18", borderColor: "#E5A93C" };
    case "approximate":
    default:
      return { backgroundColor: "#202E38", borderColor: "#5FA8D3" };
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0D1410",
  },
  topHud: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1B2820",
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#18221D",
    borderRadius: 8,
  },
  backBtnText: {
    color: "#A4BAAD",
    fontSize: 13,
    fontWeight: "700",
  },
  headerTitles: {
    alignItems: "center",
  },
  screenTag: {
    fontSize: 9,
    fontWeight: "800",
    color: "#6CD498",
    letterSpacing: 1.2,
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#F6F5EE",
  },
  resetBtn: {
    backgroundColor: "#1F2C23",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8FA396",
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  modeChipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  modeChip: {
    backgroundColor: "#161E19",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#25372B",
  },
  modeChipActive: {
    backgroundColor: "#244234",
    borderColor: "#6CD498",
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8FA396",
  },
  modeChipTextActive: {
    color: "#FFFFFF",
  },
  imageSelectorRow: {
    flexDirection: "row",
    gap: 10,
  },
  imageSelectBtn: {
    flex: 1,
    backgroundColor: "#141D17",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#223328",
    gap: 4,
  },
  imageSelectBtnLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6CD498",
  },
  imageSelectBtnStatus: {
    fontSize: 13,
    color: "#F6F5EE",
  },
  stageContainer: {
    backgroundColor: "#121A15",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#202E24",
    overflow: "hidden",
  },
  emptyStage: {
    padding: 36,
    alignItems: "center",
    gap: 8,
  },
  emptyStageIcon: {
    fontSize: 32,
  },
  emptyStageTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  emptyStageSub: {
    fontSize: 12,
    color: "#8FA396",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  canvasWrapper: {
    width: "100%",
    height: 320,
    backgroundColor: "#0B100D",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sideBySideRow: {
    flexDirection: "row",
    width: "100%",
    height: "100%",
  },
  sideHalf: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "#1D2A21",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  sideLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#7E9689",
    position: "absolute",
    top: 6,
    zIndex: 2,
    backgroundColor: "rgba(11, 16, 13, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sideImage: {
    width: "100%",
    height: "100%",
  },
  alignedImageContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayStage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  fillImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  stageBadge: {
    position: "absolute",
    bottom: 8,
    backgroundColor: "rgba(13, 20, 16, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A2B8AA",
  },
  splitClip: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    overflow: "hidden",
  },
  splitDividerLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#6CD498",
  },
  heatmapLegend: {
    position: "absolute",
    bottom: 8,
    backgroundColor: "rgba(13, 20, 16, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EAE5DC",
  },
  sliderControlsBar: {
    padding: 10,
    backgroundColor: "#15201A",
    borderTopWidth: 1,
    borderTopColor: "#202E24",
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8FA396",
  },
  sliderStepBtn: {
    backgroundColor: "#203026",
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderStepBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6CD498",
  },
  sliderVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F6F5EE",
    minWidth: 44,
    textAlign: "center",
  },
  controlsCard: {
    backgroundColor: "#141D17",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#223328",
    gap: 12,
  },
  controlsHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  controlsSub: {
    fontSize: 12,
    color: "#8FA396",
    lineHeight: 16,
  },
  controlButtonsGrid: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  dpadGroup: {
    alignItems: "center",
    gap: 4,
  },
  dpadHorizontalRow: {
    flexDirection: "row",
    gap: 4,
  },
  secondaryControlsGroup: {
    flex: 1,
    gap: 8,
  },
  zoomButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scaleDisplay: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6CD498",
  },
  rotateButtonsRow: {
    flexDirection: "row",
    gap: 6,
  },
  controlBtn: {
    backgroundColor: "#1B2820",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#283E30",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
    minWidth: 38,
  },
  controlBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#BACCC0",
  },
  analyzeFeedbackBtn: {
    backgroundColor: "#28594B",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  analyzeFeedbackBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  feedbackContainer: {
    gap: 14,
  },
  scoreBanner: {
    backgroundColor: "#16231B",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2D4435",
  },
  scoreBannerTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#F6F5EE",
  },
  scoreBannerSub: {
    fontSize: 12,
    color: "#8FA396",
    marginTop: 3,
    maxWidth: 240,
    lineHeight: 16,
  },
  scoreBadge: {
    backgroundColor: "#203628",
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#6CD498",
  },
  scoreNumber: {
    fontSize: 17,
    fontWeight: "900",
    color: "#6CD498",
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#8FA396",
  },
  catChipsScroll: {
    gap: 6,
  },
  catChip: {
    backgroundColor: "#161E19",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#25372B",
  },
  catChipActive: {
    backgroundColor: "#244234",
    borderColor: "#6CD498",
  },
  catChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8FA396",
  },
  catChipTextActive: {
    color: "#FFFFFF",
  },
  feedbackItemsList: {
    gap: 10,
  },
  feedbackCard: {
    backgroundColor: "#141D17",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#223328",
    gap: 6,
  },
  feedbackTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    backgroundColor: "#1E2C22",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6CD498",
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  confidenceText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  feedbackLocation: {
    fontSize: 11,
    color: "#7E9689",
  },
  feedbackExplanation: {
    fontSize: 13,
    color: "#ADC1B4",
    lineHeight: 18,
  },
  suggestionBox: {
    backgroundColor: "#18231C",
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#6CD498",
    marginTop: 4,
    gap: 2,
  },
  suggestionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6CD498",
  },
  suggestionText: {
    fontSize: 12,
    color: "#C2D5C9",
    lineHeight: 17,
  },
  limitationsBox: {
    backgroundColor: "#171F1B",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#5FA8D3",
  },
  limitationsText: {
    fontSize: 12,
    color: "#9BB3C4",
    lineHeight: 17,
  },
  saveCard: {
    backgroundColor: "#141D17",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#223328",
    gap: 10,
  },
  saveHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  notesInput: {
    backgroundColor: "#162019",
    borderRadius: 8,
    padding: 10,
    color: "#F6F5EE",
    fontSize: 13,
    lineHeight: 18,
    minHeight: 60,
    borderWidth: 1,
    borderColor: "#26382D",
    textAlignVertical: "top",
  },
  saveBtn: {
    backgroundColor: "#28594B",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  historySection: {
    backgroundColor: "#141D17",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#202E24",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  historySubtitle: {
    fontSize: 11,
    color: "#7E9689",
    marginTop: 2,
  },
  historyArrow: {
    fontSize: 12,
    color: "#6CD498",
  },
  historyList: {
    marginTop: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#1D2B21",
    paddingTop: 10,
  },
  noHistoryText: {
    fontSize: 12,
    color: "#6D8376",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },
  historyItem: {
    backgroundColor: "#18221D",
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  historyItemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyItemScore: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6CD498",
    flex: 1,
  },
  deleteBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    fontSize: 14,
  },
  historyItemDate: {
    fontSize: 10,
    color: "#7E9689",
  },
  historyItemNotes: {
    fontSize: 11,
    color: "#BACCC0",
    fontStyle: "italic",
  },
  reloadBtn: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
  reloadBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6CD498",
  },
  pressed: {
    opacity: 0.8,
  },
});
