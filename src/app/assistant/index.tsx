/**
 * ARTISTRY AI — AI Drawing Assistant & Reference Analysis
 * Analyzes reference images for composition, geometric construction,
 * proportions, and lighting, and delivers step-by-step physical drawing
 * sequences and contextual coaching on real paper.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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
  CoachQuestionAnswer,
  DrawingSequenceStep,
  RecommendedMethod,
  ReferenceAnalysisResult,
  SavedReferenceAnalysisRecord,
} from "../../features/assistant/types";
import { AIDrawingAssistantEngine } from "../../features/assistant/AIDrawingAssistantEngine";
import {
  getPrivacyDisclosure,
  getRemoteAIConsent,
  setRemoteAIConsent,
} from "../../features/assistant/ConsentManager";
import {
  deleteReferenceAnalysis,
  getReferenceAnalyses,
  saveReferenceAnalysis,
} from "../../storage/database";
import { createId, useAppStore } from "../../state/appStore";
import { OVERLAY_REGISTRY } from "../../features/overlays/OverlayRegistry";
import type { OverlayType } from "../../domain/overlayTypes";
import { useResponsiveLayout } from "../../components/AppUI";

const QUICK_QUESTIONS = [
  "How should I start this drawing?",
  "Where should I place the centerline?",
  "Which Loomis stage should I use?",
  "Where is the light source?",
  "Which grid spacing should I choose?",
  "What pencils should I use?",
];

export default function AIDrawingAssistantScreen() {
  const layout = useResponsiveLayout();
  const currentProject = useAppStore((state) => state.currentProject);
  const projects = useAppStore((state) => state.projects);
  const createProject = useAppStore((state) => state.createProject);
  const addOverlay = useAppStore((state) => state.addOverlay);
  const saveCurrentProject = useAppStore((state) => state.saveCurrentProject);

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(
    currentProject?.referenceUri ?? null
  );
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ReferenceAnalysisResult | null>(null);
  const [coachQAs, setCoachQAs] = useState<CoachQuestionAnswer[]>([]);
  const [customQuestion, setCustomQuestion] = useState<string>("");
  const [savedAnalyses, setSavedAnalyses] = useState<SavedReferenceAnalysisRecord[]>([]);
  const [userNotes, setUserNotes] = useState<string>("");
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load consent state and saved history
  const loadHistoryAndConsent = useCallback(async () => {
    try {
      const [consent, history] = await Promise.all([
        getRemoteAIConsent(),
        getReferenceAnalyses(20),
      ]);
      setHasConsented(consent);
      setSavedAnalyses(history);
    } catch {
      // Safe fallback
    }
  }, []);

  useEffect(() => {
    void loadHistoryAndConsent();
  }, [loadHistoryAndConsent]);

  // Handle Pick Image from Device Gallery
  const handlePickFromGallery = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        setSelectedImageUri(res.assets[0].uri);
        setAnalysisResult(null);
        setCoachQAs([]);
      }
    } catch {
      Alert.alert("Gallery Error", "Could not open gallery. You can pick an existing project image.");
    }
  };

  // Perform Analysis
  const runAnalysis = async (allowCloud: boolean) => {
    if (!selectedImageUri) {
      Alert.alert("No Reference Selected", "Please select a reference image to analyze.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await AIDrawingAssistantEngine.analyzeReference(selectedImageUri, {
        allowCloud,
        projectId: currentProject?.id,
      });
      setAnalysisResult(result);
      // Initialize with welcome coach prompt
      setCoachQAs([
        AIDrawingAssistantEngine.askDrawingCoach(result, "How should I start this drawing?"),
      ]);
    } catch (err: any) {
      Alert.alert("Analysis Error", err?.message ?? "Failed to analyze reference image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartAnalysis = () => {
    if (!hasConsented) {
      setShowConsentModal(true);
    } else {
      void runAnalysis(true);
    }
  };

  const handleConsentChoice = async (allowCloud: boolean) => {
    setShowConsentModal(false);
    if (allowCloud) {
      await setRemoteAIConsent(true);
      setHasConsented(true);
    }
    void runAnalysis(allowCloud);
  };

  const handleAskQuestion = (questionText: string) => {
    if (!analysisResult || !questionText.trim()) return;
    const answer = AIDrawingAssistantEngine.askDrawingCoach(analysisResult, questionText.trim());
    setCoachQAs((prev) => [answer, ...prev]);
    setCustomQuestion("");
  };

  const handleSaveAnalysis = async () => {
    if (!analysisResult || isSaving) return;
    setIsSaving(true);
    try {
      const now = Date.now();
      const record: SavedReferenceAnalysisRecord = {
        id: `save-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        projectId: currentProject?.id,
        imageUri: analysisResult.imageUri,
        createdAt: now,
        analysis: analysisResult,
        userNotes: userNotes.trim() || undefined,
      };

      await saveReferenceAnalysis(record);
      await loadHistoryAndConsent();
      Alert.alert("Analysis Saved", "Reference analysis successfully saved to your records.");
    } catch {
      Alert.alert("Save Error", "Could not save analysis.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    await deleteReferenceAnalysis(id);
    await loadHistoryAndConsent();
  };

  const [isLaunching, setIsLaunching] = useState<boolean>(false);

  const handleLaunchOverlay = async (overlayId?: string) => {
    if (isLaunching) return;
    setIsLaunching(true);
    try {
      if (currentProject) {
        if (overlayId) {
          const typeKey = (overlayId === "plumb" ? "measurement" : overlayId).toLowerCase() as OverlayType;
          const existing = currentProject.overlays?.find((o) => o.type === typeKey);
          if (!existing && OVERLAY_REGISTRY[typeKey]) {
            const newLayer = OVERLAY_REGISTRY[typeKey].createDefault(createId(), (currentProject.overlays?.length ?? 0) + 1);
            addOverlay(newLayer);
            await saveCurrentProject();
          }
        }
        router.push(`/reference-studio/${currentProject.id}` as any);
        return;
      }

      const id = await createProject(selectedImageUri, "Assistant Study");
      if (overlayId) {
        const typeKey = (overlayId === "plumb" ? "measurement" : overlayId).toLowerCase() as OverlayType;
        if (OVERLAY_REGISTRY[typeKey]) {
          const newLayer = OVERLAY_REGISTRY[typeKey].createDefault(createId(), 1);
          addOverlay(newLayer);
          await saveCurrentProject();
        }
      }
      router.push(`/reference-studio/${id}` as any);
    } catch {
      router.push("/projects" as any);
    } finally {
      setIsLaunching(false);
    }
  };

  const privacyText = getPrivacyDisclosure();

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
          <Text style={styles.screenTitle}>AI Drawing Assistant</Text>
        </View>

        <Pressable
          onPress={() => setShowConsentModal(true)}
          style={styles.privacyPill}
          accessibilityLabel="Privacy and Consent"
        >
          <Text style={styles.privacyPillText}>{hasConsented ? "☁️ Cloud Ready" : "🔒 Local Only"}</Text>
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
        {/* Reference Image Selector & Preview */}
        <View style={styles.selectorCard}>
          <View style={styles.selectorHeader}>
            <Text style={styles.cardHeading}>Selected Reference</Text>
            <Pressable
              onPress={handlePickFromGallery}
              style={({ pressed }) => [styles.pickBtn, pressed && styles.pressed]}
              accessibilityLabel="Choose from Gallery"
            >
              <Text style={styles.pickBtnText}>📷 Choose Image</Text>
            </Pressable>
          </View>

          {selectedImageUri ? (
            <View style={[styles.previewContainer, { height: layout.isTablet ? 320 : layout.isSmallPhone ? 200 : 240 }]}>
              <Image source={{ uri: selectedImageUri }} style={styles.referenceImage} resizeMode="contain" />
              <View style={styles.imageBadgeRow}>
                <Text style={styles.imageBadgeText}>Ready for Traditional Analysis</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyReferenceBox}>
              <Text style={styles.emptyIcon}>🖼️</Text>
              <Text style={styles.emptyTitle}>No Reference Image Selected</Text>
              <Text style={styles.emptySub}>
                Select an image from your gallery or choose an existing project reference below.
              </Text>
              <Pressable
                onPress={handlePickFromGallery}
                style={({ pressed }) => [styles.selectFirstBtn, pressed && styles.pressed]}
              >
                <Text style={styles.selectFirstBtnText}>Select Reference Image</Text>
              </Pressable>
            </View>
          )}

          {/* Quick Select from Existing Projects */}
          {projects.length > 0 && (
            <View style={styles.projectRefsSection}>
              <Text style={styles.projectRefsLabel}>Or Pick from Existing Projects:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.projectChipsScroll}>
                {projects.map((proj) => (
                  <Pressable
                    key={proj.id}
                    onPress={() => {
                      if (proj.referenceUri) {
                        setSelectedImageUri(proj.referenceUri);
                        setAnalysisResult(null);
                        setCoachQAs([]);
                      }
                    }}
                    style={[
                      styles.projectChip,
                      selectedImageUri === proj.referenceUri && styles.projectChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.projectChipText,
                        selectedImageUri === proj.referenceUri && styles.projectChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {proj.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Action Button: Analyze Reference */}
          {selectedImageUri && (
            <Pressable
              disabled={isAnalyzing}
              onPress={handleStartAnalysis}
              style={({ pressed }) => [styles.analyzeBtn, isAnalyzing && styles.btnDisabled, pressed && styles.pressed]}
              accessibilityLabel="Analyze Reference"
            >
              {isAnalyzing ? (
                <View style={styles.analyzingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.analyzeBtnText}>Analyzing Traditional Elements...</Text>
                </View>
              ) : (
                <Text style={styles.analyzeBtnText}>✨ Analyze Reference for Traditional Drawing</Text>
              )}
            </Pressable>
          )}
        </View>

        {/* Structured Analysis Results */}
        {analysisResult && (
          <View style={styles.resultsContainer}>
            {/* Status indicator */}
            <View style={styles.analysisModeBadge}>
              <Text style={styles.analysisModeText}>
                {analysisResult.isLocalFallback
                  ? "🔒 On-Device Algorithmic Heuristics (Private — Non-Vision Model)"
                  : "☁️ Analyzed via Cloud AI Vision Model (Encrypted)"}
              </Text>
            </View>

            {/* 1. Composition Insights Card */}
            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardSectionTitle}>A. Composition & Framing</Text>
                <View style={styles.catPill}>
                  <Text style={styles.catPillText}>{analysisResult.composition.category.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.itemDetailBold}>{analysisResult.composition.mainSubject}</Text>
              <Text style={styles.itemDetailText}>
                <Text style={styles.itemDetailLabel}>Placement: </Text>
                {analysisResult.composition.subjectPlacement}
              </Text>
              <Text style={styles.itemDetailText}>
                <Text style={styles.itemDetailLabel}>Major Shapes: </Text>
                {analysisResult.composition.majorShapes.join(", ")}
              </Text>
              <Text style={styles.itemDetailText}>
                <Text style={styles.itemDetailLabel}>Compositional Balance: </Text>
                {analysisResult.composition.overallComposition}
              </Text>
            </View>

            {/* 2. Construction & Proportions Card */}
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>B. Geometric Construction & Sighting</Text>

              <View style={styles.subList}>
                <Text style={styles.subListHeading}>Basic 3D Forms:</Text>
                {analysisResult.construction.basicGeometricConstruction.map((form, i) => (
                  <Text key={i} style={styles.bulletItem}>• {form}</Text>
                ))}
              </View>

              <View style={styles.subList}>
                <Text style={styles.subListHeading}>Proportions & Relationships:</Text>
                {analysisResult.construction.proportionRelationships.map((prop, i) => (
                  <Text key={i} style={styles.bulletItem}>• {prop}</Text>
                ))}
              </View>

              <View style={styles.subList}>
                <Text style={styles.subListHeading}>Centerline & Alignment Axes:</Text>
                {analysisResult.construction.mainAxesAndAlignment.map((axis, i) => (
                  <Text key={i} style={styles.bulletItem}>• {axis}</Text>
                ))}
              </View>

              {analysisResult.construction.perspectiveDirection && (
                <Text style={styles.itemDetailText}>
                  <Text style={styles.itemDetailLabel}>Perspective: </Text>
                  {analysisResult.construction.perspectiveDirection}
                </Text>
              )}

              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerText}>⚠️ {analysisResult.construction.calibrationNote}</Text>
              </View>
            </View>

            {/* 3. Lighting & Tonal Masses Card */}
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>C. Directional Lighting & Tonal Values</Text>
              <Text style={styles.itemDetailText}>
                <Text style={styles.itemDetailLabel}>Light Source: </Text>
                {analysisResult.lighting.lightSourceDirection}
              </Text>
              <Text style={styles.itemDetailText}>
                <Text style={styles.itemDetailLabel}>Highlights: </Text>
                {analysisResult.lighting.highlightRegions.join(", ")}
              </Text>
              <Text style={styles.itemDetailText}>
                <Text style={styles.itemDetailLabel}>Core Shadows: </Text>
                {analysisResult.lighting.coreShadows.join(", ")}
              </Text>
              <Text style={styles.itemDetailText}>
                <Text style={styles.itemDetailLabel}>Cast Shadows: </Text>
                {analysisResult.lighting.castShadows.join(", ")}
              </Text>
              <View style={styles.tonalScaleBadge}>
                <Text style={styles.tonalScaleText}>
                  Recommended Value Steps: {analysisResult.lighting.recommendedTonalSteps} Tonal Masses
                </Text>
              </View>
            </View>

            {/* 4. Suggested Drawing Methods with Overlay Shortcuts */}
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>D. Recommended Drawing Methods</Text>
              <View style={styles.methodsList}>
                {analysisResult.recommendedMethods.map((m, idx) => (
                  <View key={idx} style={styles.methodCard}>
                    <View style={styles.methodInfo}>
                      <Text style={styles.methodTitle}>{m.title}</Text>
                      <Text style={styles.methodRationale}>{m.rationale}</Text>
                    </View>
                    {m.overlayId && (
                      <Pressable
                        onPress={() => handleLaunchOverlay(m.overlayId)}
                        style={({ pressed }) => [styles.launchOverlayBtn, pressed && styles.pressed]}
                      >
                        <Text style={styles.launchOverlayBtnText}>Launch {m.overlayId.toUpperCase()} ↗</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* 5. Step-by-Step Drawing Sequence on Physical Paper */}
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>E. Physical Paper Drawing Sequence</Text>
              <Text style={styles.sequenceIntro}>
                Follow these physical steps on real paper using graphite pencils:
              </Text>
              <View style={styles.sequenceList}>
                {analysisResult.drawingSequence.map((step) => (
                  <View key={step.stepNumber} style={styles.sequenceItem}>
                    <View style={[styles.seqHeaderRow, layout.isSmallPhone && { flexWrap: "wrap", rowGap: 4 }]}>
                      <View style={styles.stepNumBubble}>
                        <Text style={styles.stepNumText}>{step.stepNumber}</Text>
                      </View>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <View style={styles.pencilBadge}>
                        <Text style={styles.pencilBadgeText}>{step.recommendedPencilGrade}</Text>
                      </View>
                    </View>
                    <Text style={styles.stepAction}>{step.action}</Text>
                    <View style={styles.paperGuidanceCard}>
                      <Text style={styles.paperGuidanceText}>📄 Paper Advice: {step.physicalPaperGuidance}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* 6. Contextual AI Drawing Coach Q&A Panel */}
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>F. Ask AI Drawing Coach</Text>
              <Text style={styles.coachSub}>Tap a question or ask any specific technique question:</Text>

              {/* Quick Questions Pills */}
              <View style={styles.quickQuestionsWrap}>
                {QUICK_QUESTIONS.map((q, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleAskQuestion(q)}
                    style={({ pressed }) => [styles.quickQBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.quickQBtnText}>💬 {q}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Custom Question Input */}
              <View style={[styles.customQRow, layout.isSmallPhone && { flexDirection: "column" }]}>
                <TextInput
                  style={styles.customQInput}
                  placeholder="e.g. How do I construct the nose plane?"
                  placeholderTextColor="#688072"
                  value={customQuestion}
                  onChangeText={setCustomQuestion}
                />
                <Pressable
                  onPress={() => handleAskQuestion(customQuestion)}
                  style={({ pressed }) => [
                    styles.askBtn,
                    layout.isSmallPhone && { paddingVertical: 10, width: "100%" },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.askBtnText}>Ask</Text>
                </Pressable>
              </View>

              {/* Coach Q&A Feed */}
              {coachQAs.length > 0 && (
                <View style={styles.qaFeed}>
                  {coachQAs.map((qa, i) => (
                    <View key={i} style={styles.qaCard}>
                      <Text style={styles.qaQuestion}>Q: {qa.question}</Text>
                      <Text style={styles.qaAnswer}>{qa.answer}</Text>
                      {qa.suggestedOverlay && (
                        <Pressable
                          onPress={() => handleLaunchOverlay(qa.suggestedOverlay)}
                          style={styles.qaActionBtn}
                        >
                          <Text style={styles.qaActionBtnText}>
                            Open {qa.suggestedOverlay.toUpperCase()} Overlay ↗
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* 7. Save Analysis to Project */}
            <View style={styles.saveCard}>
              <Text style={styles.saveHeading}>Save Analysis & Personal Notes</Text>
              <TextInput
                style={styles.notesInput}
                multiline
                numberOfLines={3}
                placeholder="Personal notes: e.g. Focus on keeping cranial sphere round, use 2H for brow line..."
                placeholderTextColor="#688072"
                value={userNotes}
                onChangeText={setUserNotes}
              />
              <Pressable
                disabled={isSaving}
                onPress={handleSaveAnalysis}
                style={({ pressed }) => [styles.saveBtn, isSaving && styles.btnDisabled, pressed && styles.pressed]}
                accessibilityLabel="Save Analysis"
              >
                <Text style={styles.saveBtnText}>
                  {isSaving ? "Saving..." : "💾 Save Analysis to Project Records"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Saved Analysis History Section */}
        <View style={styles.historySection}>
          <Pressable
            onPress={() => setShowHistory((prev) => !prev)}
            style={({ pressed }) => [styles.historyHeader, pressed && styles.pressed]}
          >
            <View>
              <Text style={styles.historyTitle}>Saved Reference Analyses</Text>
              <Text style={styles.historySubtitle}>{savedAnalyses.length} saved studies</Text>
            </View>
            <Text style={styles.historyArrow}>{showHistory ? "▲" : "▼"}</Text>
          </Pressable>

          {showHistory && (
            <View style={styles.historyList}>
              {savedAnalyses.length === 0 ? (
                <Text style={styles.noHistoryText}>No saved analyses yet.</Text>
              ) : (
                savedAnalyses.map((item) => (
                  <View key={item.id} style={styles.historyItem}>
                    <View style={styles.historyItemTop}>
                      <Text style={styles.historyItemSubject}>
                        {item.analysis.composition.mainSubject}
                      </Text>
                      <Pressable
                        onPress={() => handleDeleteSaved(item.id)}
                        style={styles.deleteBtn}
                        accessibilityLabel="Delete analysis"
                      >
                        <Text style={styles.deleteBtnText}>🗑</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.historyItemDate}>
                      {new Date(item.createdAt).toLocaleDateString()} • {item.analysis.composition.category.toUpperCase()}
                    </Text>
                    {item.userNotes && (
                      <Text style={styles.historyItemNotes} numberOfLines={2}>
                        "{item.userNotes}"
                      </Text>
                    )}
                    <Pressable
                      onPress={() => {
                        setSelectedImageUri(item.imageUri);
                        setAnalysisResult(item.analysis);
                      }}
                      style={styles.reloadBtn}
                    >
                      <Text style={styles.reloadBtnText}>Review Analysis ›</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Explicit User Privacy & Consent Modal */}
      <Modal visible={showConsentModal} transparent animationType="fade" onRequestClose={() => setShowConsentModal(false)}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.consentCard,
              {
                maxWidth: typeof layout.contentMaxWidth === "number" ? Math.min(layout.contentMaxWidth, 440) : 440,
              },
            ]}
          >
            <Text style={styles.consentTitle}>{privacyText.title}</Text>
            <Text style={styles.consentBody}>{privacyText.body}</Text>

            <View style={styles.guaranteeBox}>
              <Text style={styles.guaranteeText}>{privacyText.localGuarantee}</Text>
            </View>

            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>{privacyText.cloudNotice}</Text>
            </View>

            <View style={styles.consentButtonsCol}>
              <Pressable
                onPress={() => handleConsentChoice(true)}
                style={({ pressed }) => [styles.consentChoiceBtn, styles.cloudChoiceBtn, pressed && styles.pressed]}
              >
                <Text style={styles.cloudChoiceText}>Allow Cloud AI Analysis ☁️</Text>
              </Pressable>

              <Pressable
                onPress={() => handleConsentChoice(false)}
                style={({ pressed }) => [styles.consentChoiceBtn, styles.localChoiceBtn, pressed && styles.pressed]}
              >
                <Text style={styles.localChoiceText}>Analyze On-Device (Private & Offline) 🔒</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
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
  privacyPill: {
    backgroundColor: "#1B2A20",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2E4738",
  },
  privacyPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6CD498",
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  selectorCard: {
    backgroundColor: "#141D17",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#223328",
    gap: 12,
  },
  selectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  pickBtn: {
    backgroundColor: "#203026",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2D4436",
  },
  pickBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6CD498",
  },
  previewContainer: {
    width: "100%",
    height: 240,
    borderRadius: 10,
    backgroundColor: "#0D1410",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  referenceImage: {
    width: "100%",
    height: "100%",
  },
  imageBadgeRow: {
    position: "absolute",
    bottom: 8,
    backgroundColor: "rgba(13, 20, 16, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  imageBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A2B8AA",
  },
  emptyReferenceBox: {
    padding: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#263B2F",
    borderStyle: "dashed",
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  emptySub: {
    fontSize: 12,
    color: "#8FA396",
    textAlign: "center",
    lineHeight: 17,
  },
  selectFirstBtn: {
    backgroundColor: "#28594B",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  selectFirstBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  projectRefsSection: {
    gap: 6,
  },
  projectRefsLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7E9689",
  },
  projectChipsScroll: {
    gap: 6,
  },
  projectChip: {
    backgroundColor: "#1B261F",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#273A2F",
    maxWidth: 160,
  },
  projectChipActive: {
    backgroundColor: "#244234",
    borderColor: "#6CD498",
  },
  projectChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8FA396",
  },
  projectChipTextActive: {
    color: "#FFFFFF",
  },
  analyzeBtn: {
    backgroundColor: "#28594B",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  analyzeBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  analyzingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  resultsContainer: {
    gap: 16,
  },
  analysisModeBadge: {
    backgroundColor: "#16231B",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#2B4434",
  },
  analysisModeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6CD498",
  },
  card: {
    backgroundColor: "#141D17",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#223328",
    gap: 8,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#6CD498",
    letterSpacing: 0.5,
  },
  catPill: {
    backgroundColor: "#203026",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#C2D5C9",
  },
  itemDetailBold: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  itemDetailText: {
    fontSize: 13,
    color: "#ADC1B4",
    lineHeight: 18,
  },
  itemDetailLabel: {
    fontWeight: "800",
    color: "#F6F5EE",
  },
  subList: {
    gap: 3,
    marginTop: 4,
  },
  subListHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: "#A2B8AA",
  },
  bulletItem: {
    fontSize: 13,
    color: "#BACCC0",
    lineHeight: 18,
    paddingLeft: 4,
  },
  disclaimerBox: {
    backgroundColor: "#1C1C14",
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#E5A93C",
    marginTop: 6,
  },
  disclaimerText: {
    fontSize: 11,
    color: "#E5D29C",
    lineHeight: 16,
  },
  tonalScaleBadge: {
    backgroundColor: "#1B2A21",
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  tonalScaleText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6CD498",
  },
  methodsList: {
    gap: 8,
  },
  methodCard: {
    backgroundColor: "#1A261F",
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  methodInfo: {
    gap: 2,
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  methodRationale: {
    fontSize: 12,
    color: "#8FA396",
    lineHeight: 16,
  },
  launchOverlayBtn: {
    backgroundColor: "#28594B",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  launchOverlayBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  sequenceIntro: {
    fontSize: 12,
    color: "#8FA396",
  },
  sequenceList: {
    gap: 12,
    marginTop: 6,
  },
  sequenceItem: {
    backgroundColor: "#18231C",
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  seqHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepNumBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#203628",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#6CD498",
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F6F5EE",
    flex: 1,
  },
  pencilBadge: {
    backgroundColor: "#24382B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pencilBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#A2CDB3",
  },
  stepAction: {
    fontSize: 13,
    color: "#BACCC0",
    lineHeight: 18,
  },
  paperGuidanceCard: {
    backgroundColor: "#131C16",
    padding: 8,
    borderRadius: 6,
  },
  paperGuidanceText: {
    fontSize: 11,
    color: "#8FA396",
    fontStyle: "italic",
    lineHeight: 16,
  },
  coachSub: {
    fontSize: 12,
    color: "#8FA396",
  },
  quickQuestionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickQBtn: {
    backgroundColor: "#1A2820",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#283E31",
  },
  quickQBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ADC1B4",
  },
  customQRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  customQInput: {
    flex: 1,
    backgroundColor: "#162019",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#F6F5EE",
    fontSize: 13,
    borderWidth: 1,
    borderColor: "#26382D",
  },
  askBtn: {
    backgroundColor: "#28594B",
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  askBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  qaFeed: {
    gap: 10,
    marginTop: 8,
  },
  qaCard: {
    backgroundColor: "#17231B",
    borderRadius: 10,
    padding: 12,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#6CD498",
  },
  qaQuestion: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6CD498",
  },
  qaAnswer: {
    fontSize: 13,
    color: "#BACCC0",
    lineHeight: 19,
  },
  qaActionBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#244234",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 2,
  },
  qaActionBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
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
    minHeight: 64,
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
  historyItemSubject: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F6F5EE",
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  consentCard: {
    backgroundColor: "#141D17",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderColor: "#2A4032",
    gap: 12,
  },
  consentTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#F6F5EE",
  },
  consentBody: {
    fontSize: 13,
    color: "#ADC1B4",
    lineHeight: 18,
  },
  guaranteeBox: {
    backgroundColor: "#192820",
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#6CD498",
  },
  guaranteeText: {
    fontSize: 12,
    color: "#C2D5C9",
    lineHeight: 17,
  },
  noticeBox: {
    backgroundColor: "#1A242B",
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#5FA8D3",
  },
  noticeText: {
    fontSize: 12,
    color: "#B2CCE0",
    lineHeight: 17,
  },
  consentButtonsCol: {
    gap: 10,
    marginTop: 8,
  },
  consentChoiceBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cloudChoiceBtn: {
    backgroundColor: "#28594B",
  },
  cloudChoiceText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  localChoiceBtn: {
    backgroundColor: "#1C2720",
    borderWidth: 1,
    borderColor: "#30473A",
  },
  localChoiceText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8FA396",
  },
  pressed: {
    opacity: 0.8,
  },
});
