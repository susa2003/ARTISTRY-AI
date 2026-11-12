/**
 * ARTISTRY AI — Practice Session Modal
 * Interactive timed drawing session with physical paper guidance,
 * duration configuration, wall-clock timing, self-assessment checklist,
 * notes recording, and SQLite persistence.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
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
import type { PracticeExercise, PracticeSessionRecord } from "./types";
import {
  createPracticeTimer,
  finishPracticeTimer,
  formatTimerSeconds,
  getElapsedSeconds,
  getRemainingSeconds,
  getTimerProgress,
  isTimerCompleted,
  pausePracticeTimer,
  resetPracticeTimer,
  startPracticeTimer,
} from "./PracticeTimer";
import { getCategoryMetadata } from "./practiceCatalog";
import { recordPracticeCompletion, savePracticeSession } from "../../storage/database";
import { useAppStore } from "../../state/appStore";

interface PracticeModalProps {
  visible: boolean;
  exercise: PracticeExercise | null;
  onClose: () => void;
  onSessionComplete?: (session: PracticeSessionRecord) => void;
}

const PRESET_DURATIONS = [5, 10, 15, 20, 30];

export function PracticeModal({
  visible,
  exercise,
  onClose,
  onSessionComplete,
}: PracticeModalProps) {
  if (!exercise) return null;

  const currentProjectId = useAppStore((state) => state.currentProject?.id);
  const createProject = useAppStore((state) => state.createProject);
  const refreshStreak = useAppStore((state) => state.refreshStreak);

  const [selectedDuration, setSelectedDuration] = useState<number>(
    exercise.estimatedDurationMinutes || 15
  );
  const [timerState, setTimerState] = useState(() =>
    createPracticeTimer(exercise.estimatedDurationMinutes || 15)
  );
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [userNotes, setUserNotes] = useState<string>("");
  const [checkedChecklist, setCheckedChecklist] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Reset local state when exercise changes
  useEffect(() => {
    if (visible && exercise) {
      const dur = exercise.estimatedDurationMinutes || 15;
      setSelectedDuration(dur);
      setTimerState(createPracticeTimer(dur));
      setNowMs(Date.now());
      setSessionStartedAt(null);
      setIsFinishing(false);
      setUserNotes("");
      setCheckedChecklist({});
      setIsSaving(false);
    }
  }, [visible, exercise]);

  // Wall-clock animation tick when timer is running
  useEffect(() => {
    if (!timerState.isRunning) return;
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 250);
    return () => clearInterval(interval);
  }, [timerState.isRunning]);

  const elapsedSec = useMemo(() => getElapsedSeconds(timerState, nowMs), [timerState, nowMs]);
  const remainingSec = useMemo(() => getRemainingSeconds(timerState, nowMs), [timerState, nowMs]);
  const progressRatio = useMemo(() => getTimerProgress(timerState, nowMs), [timerState, nowMs]);
  const hasMetTarget = useMemo(() => isTimerCompleted(timerState, nowMs), [timerState, nowMs]);

  const categoryMeta = useMemo(() => getCategoryMetadata(exercise.category), [exercise.category]);

  const handleStartTimer = () => {
    const now = Date.now();
    if (!sessionStartedAt) {
      setSessionStartedAt(now);
    }
    setTimerState((prev) => startPracticeTimer(prev, now));
    setNowMs(now);
  };

  const handlePauseTimer = () => {
    const now = Date.now();
    setTimerState((prev) => pausePracticeTimer(prev, now));
    setNowMs(now);
  };

  const handleDurationChange = (minutes: number) => {
    setSelectedDuration(minutes);
    setTimerState((prev) => resetPracticeTimer(prev, minutes));
    setNowMs(Date.now());
  };

  const handleFinishSession = () => {
    const now = Date.now();
    setTimerState((prev) => finishPracticeTimer(prev, now));
    setNowMs(now);
    setIsFinishing(true);
  };

  const toggleChecklistItem = (item: string) => {
    setCheckedChecklist((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const handleSaveAndClose = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const now = Date.now();
      const sessionRecord: PracticeSessionRecord = {
        id: `sess-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        exerciseId: exercise.id,
        category: exercise.category,
        difficulty: exercise.difficulty,
        targetDurationMinutes: selectedDuration,
        elapsedDurationSeconds: Math.max(1, elapsedSec),
        status: "completed",
        notes: userNotes.trim() || undefined,
        selfAssessmentResults: checkedChecklist,
        startedAt: sessionStartedAt ?? now - elapsedSec * 1000,
        completedAt: now,
        createdAt: now,
      };

      await recordPracticeCompletion(sessionRecord);
      await refreshStreak();
      onSessionComplete?.(sessionRecord);
      onClose();
    } catch {
      // Graceful fallback
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAbandon = async () => {
    if (sessionStartedAt && elapsedSec >= 15) {
      // Save in-progress or abandoned partial session for records
      const now = Date.now();
      const record: PracticeSessionRecord = {
        id: `sess-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        exerciseId: exercise.id,
        category: exercise.category,
        difficulty: exercise.difficulty,
        targetDurationMinutes: selectedDuration,
        elapsedDurationSeconds: elapsedSec,
        status: "abandoned",
        notes: userNotes.trim() || undefined,
        selfAssessmentResults: checkedChecklist,
        startedAt: sessionStartedAt,
        completedAt: now,
        createdAt: now,
      };
      await savePracticeSession(record);
    }
    onClose();
  };

  const handleLaunchOverlay = async () => {
    onClose();
    try {
      if (currentProjectId) {
        router.push(`/reference-studio/${currentProjectId}` as any);
      } else {
        const id = await createProject(null, `Practice: ${exercise.title}`);
        router.push(`/reference-studio/${id}` as any);
      }
    } catch {
      router.push("/projects" as any);
    }
  };

  const checkedCount = Object.values(checkedChecklist).filter(Boolean).length;
  const totalChecklist = exercise.selfAssessmentChecklist.length;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleAbandon}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <Pressable
            onPress={handleAbandon}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            accessibilityLabel="Close practice session"
          >
            <Text style={styles.closeBtnText}>✕ Close</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.categoryBadgeText}>
              {categoryMeta?.icon ?? "🎨"} {categoryMeta?.title ?? exercise.category}
            </Text>
          </View>

          <View style={[styles.difficultyPill, getDifficultyStyle(exercise.difficulty)]}>
            <Text style={styles.difficultyText}>{exercise.difficulty.toUpperCase()}</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Exercise Hero Banner */}
          <View style={styles.heroBanner}>
            <Text style={styles.exerciseTitle}>{exercise.title}</Text>
            <Text style={styles.exerciseObjective}>{exercise.objective}</Text>
          </View>

          {!isFinishing ? (
            <>
              {/* Timer Controls Box */}
              <View style={styles.timerCard}>
                <View style={styles.timerDurationSelector}>
                  <Text style={styles.timerSelectorLabel}>Session Target:</Text>
                  <View style={styles.durationChipsRow}>
                    {PRESET_DURATIONS.map((dur) => (
                      <Pressable
                        key={dur}
                        disabled={timerState.isRunning}
                        onPress={() => handleDurationChange(dur)}
                        style={[
                          styles.durationChip,
                          selectedDuration === dur && styles.durationChipActive,
                          timerState.isRunning && styles.chipDisabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.durationChipText,
                            selectedDuration === dur && styles.durationChipTextActive,
                          ]}
                        >
                          {dur}m
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Big Digital Display */}
                <View style={styles.bigTimerDisplay}>
                  <Text style={styles.timerRemainingText}>{formatTimerSeconds(remainingSec)}</Text>
                  <Text style={styles.timerElapsedSub}>
                    Elapsed: {formatTimerSeconds(elapsedSec)} / {selectedDuration}:00
                  </Text>
                </View>

                {/* Progress Fill Bar */}
                <View style={styles.timerBarBg}>
                  <View style={[styles.timerBarFill, { width: `${Math.max(2, Math.round(progressRatio * 100))}%` }]} />
                </View>

                {/* Action Buttons */}
                <View style={styles.timerButtonsRow}>
                  {!timerState.isRunning ? (
                    <Pressable
                      onPress={handleStartTimer}
                      style={({ pressed }) => [styles.timerActionBtn, styles.startBtn, pressed && styles.pressed]}
                      accessibilityLabel="Start practice timer"
                    >
                      <Text style={styles.startBtnText}>
                        {timerState.accumulatedMs > 0 ? "▶ Resume Practice" : "▶ Start Practice"}
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={handlePauseTimer}
                      style={({ pressed }) => [styles.timerActionBtn, styles.pauseBtn, pressed && styles.pressed]}
                      accessibilityLabel="Pause practice timer"
                    >
                      <Text style={styles.pauseBtnText}>⏸ Pause</Text>
                    </Pressable>
                  )}

                  {(timerState.isRunning || timerState.accumulatedMs > 0) && (
                    <Pressable
                      onPress={handleFinishSession}
                      style={({ pressed }) => [styles.timerActionBtn, styles.finishBtn, pressed && styles.pressed]}
                      accessibilityLabel="Finish practice session"
                    >
                      <Text style={styles.finishBtnText}>✓ Finish & Review</Text>
                    </Pressable>
                  )}
                </View>

                {hasMetTarget && (
                  <View style={styles.targetMetBadge}>
                    <Text style={styles.targetMetText}>🎯 Target practice duration reached! Continue or finish.</Text>
                  </View>
                )}
              </View>

              {/* Physical Paper & Setup Guidance */}
              <View style={styles.guidanceCard}>
                <View style={styles.guidanceHeader}>
                  <Text style={styles.guidanceIcon}>📄</Text>
                  <Text style={styles.guidanceTitle}>Physical Paper & Posture Setup</Text>
                </View>
                <Text style={styles.guidanceBody}>{exercise.physicalPaperGuidance}</Text>
              </View>

              {/* Required Physical Materials */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Required Physical Materials</Text>
                <View style={styles.materialsWrap}>
                  {exercise.requiredMaterials.map((mat, i) => (
                    <View key={i} style={styles.materialChip}>
                      <Text style={styles.materialChipText}>✏️ {mat}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Step-by-Step Instructions */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Step-by-Step Instructions</Text>
                {exercise.instructions.map((step, idx) => (
                  <View key={idx} style={styles.instructionStep}>
                    <View style={styles.instructionNumCircle}>
                      <Text style={styles.instructionNumText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{step}</Text>
                  </View>
                ))}
              </View>

              {/* Overlay Recommendation Launcher */}
              {exercise.recommendedOverlay && (
                <View style={styles.overlayCard}>
                  <View style={styles.overlayInfo}>
                    <Text style={styles.overlayTitle}>Recommended Companion Overlay</Text>
                    <Text style={styles.overlaySubtitle}>
                      Use the {exercise.recommendedOverlay.toUpperCase()} overlay on your reference image in Reference Studio.
                    </Text>
                  </View>
                  <Pressable
                    onPress={handleLaunchOverlay}
                    style={({ pressed }) => [styles.overlayLaunchBtn, pressed && styles.pressed]}
                    accessibilityLabel="Launch overlay in Reference Studio"
                  >
                    <Text style={styles.overlayLaunchBtnText}>Launch Studio ↗</Text>
                  </Pressable>
                </View>
              )}

              {/* Completion Criteria */}
              <View style={styles.criteriaCard}>
                <Text style={styles.criteriaTitle}>Completion Standard</Text>
                <Text style={styles.criteriaBody}>{exercise.completionCriteria}</Text>
              </View>
            </>
          ) : (
            /* Session Review & Completion Screen */
            <View style={styles.reviewContainer}>
              <View style={styles.completionBanner}>
                <Text style={styles.completionEmoji}>🎉</Text>
                <Text style={styles.completionTitle}>Practice Session Finished!</Text>
                <Text style={styles.completionSub}>
                  You drew for {formatTimerSeconds(elapsedSec)} (Target: {selectedDuration}m)
                </Text>
              </View>

              {/* Self-Assessment Checklist */}
              {exercise.selfAssessmentChecklist.length > 0 && (
                <View style={styles.sectionCard}>
                  <View style={styles.checklistHeader}>
                    <Text style={styles.sectionTitle}>Self-Assessment Checklist</Text>
                    <Text style={styles.checklistCounter}>
                      {checkedCount}/{totalChecklist} Verified
                    </Text>
                  </View>
                  <Text style={styles.checklistPrompt}>
                    Inspect your physical drawing and check off verified criteria:
                  </Text>

                  {exercise.selfAssessmentChecklist.map((item, idx) => {
                    const isChecked = Boolean(checkedChecklist[item]);
                    return (
                      <Pressable
                        key={idx}
                        onPress={() => toggleChecklistItem(item)}
                        style={({ pressed }) => [
                          styles.checklistItemRow,
                          isChecked && styles.checklistItemRowActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <View style={[styles.checkBox, isChecked && styles.checkBoxActive]}>
                          <Text style={styles.checkMark}>{isChecked ? "✓" : ""}</Text>
                        </View>
                        <Text style={[styles.checkItemText, isChecked && styles.checkItemTextActive]}>
                          {item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Artist Reflection & Notes */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Artist Observations & Notes (Optional)</Text>
                <Text style={styles.notesPrompt}>
                  Record what felt easy, challenging, or what you want to improve next session:
                </Text>
                <TextInput
                  style={styles.notesInput}
                  multiline
                  numberOfLines={4}
                  placeholder="e.g. Struggled with outer calf asymmetry; shoulder motion felt relaxed..."
                  placeholderTextColor="#5C7567"
                  value={userNotes}
                  onChangeText={setUserNotes}
                />
              </View>

              {/* Save & Finish Action */}
              <Pressable
                disabled={isSaving}
                onPress={handleSaveAndClose}
                style={({ pressed }) => [styles.saveSessionBtn, isSaving && styles.chipDisabled, pressed && styles.pressed]}
                accessibilityLabel="Save practice session"
              >
                <Text style={styles.saveSessionBtnText}>
                  {isSaving ? "Saving Record..." : "💾 Save Practice & Record Streak"}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function getDifficultyStyle(diff: string) {
  switch (diff) {
    case "beginner":
      return { backgroundColor: "#1F382B", borderColor: "#6CD498" };
    case "intermediate":
      return { backgroundColor: "#332B18", borderColor: "#E5A93C" };
    case "advanced":
      return { backgroundColor: "#381F23", borderColor: "#E55C6C" };
    default:
      return { backgroundColor: "#1F2C23", borderColor: "#4C6B57" };
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0D1410",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1B2820",
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#18221D",
    borderRadius: 8,
  },
  closeBtnText: {
    color: "#A4BAAD",
    fontSize: 13,
    fontWeight: "700",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6CD498",
  },
  difficultyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: "#141D17",
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#223328",
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F6F5EE",
    marginBottom: 6,
  },
  exerciseObjective: {
    fontSize: 14,
    color: "#B2C5B8",
    lineHeight: 20,
  },
  timerCard: {
    backgroundColor: "#131C16",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A4032",
    alignItems: "center",
  },
  timerDurationSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  timerSelectorLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8FA396",
  },
  durationChipsRow: {
    flexDirection: "row",
    gap: 6,
  },
  durationChip: {
    backgroundColor: "#1E2B23",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2D4235",
  },
  durationChipActive: {
    backgroundColor: "#28594B",
    borderColor: "#6CD498",
  },
  durationChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8FA396",
  },
  durationChipTextActive: {
    color: "#FFFFFF",
  },
  chipDisabled: {
    opacity: 0.5,
  },
  bigTimerDisplay: {
    alignItems: "center",
    marginVertical: 12,
  },
  timerRemainingText: {
    fontSize: 48,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    color: "#F6F5EE",
    letterSpacing: 1,
  },
  timerElapsedSub: {
    fontSize: 13,
    color: "#7E9689",
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  timerBarBg: {
    width: "100%",
    height: 6,
    backgroundColor: "#1F2E25",
    borderRadius: 3,
    marginVertical: 14,
    overflow: "hidden",
  },
  timerBarFill: {
    height: "100%",
    backgroundColor: "#6CD498",
    borderRadius: 3,
  },
  timerButtonsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    justifyContent: "center",
    marginTop: 6,
  },
  timerActionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
  },
  startBtn: {
    backgroundColor: "#28594B",
  },
  startBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  pauseBtn: {
    backgroundColor: "#423B22",
  },
  pauseBtnText: {
    color: "#F2D57E",
    fontSize: 14,
    fontWeight: "800",
  },
  finishBtn: {
    backgroundColor: "#1E2F25",
    borderWidth: 1,
    borderColor: "#3D614E",
  },
  finishBtnText: {
    color: "#6CD498",
    fontSize: 14,
    fontWeight: "800",
  },
  targetMetBadge: {
    marginTop: 12,
    backgroundColor: "#1A3326",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  targetMetText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6CD498",
  },
  guidanceCard: {
    backgroundColor: "#18201A",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#6CD498",
  },
  guidanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  guidanceIcon: {
    fontSize: 16,
  },
  guidanceTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  guidanceBody: {
    fontSize: 13,
    color: "#ADC1B4",
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: "#131C16",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#202E24",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  materialsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  materialChip: {
    backgroundColor: "#1B2820",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#293D30",
  },
  materialChipText: {
    fontSize: 12,
    color: "#C2D4C8",
  },
  instructionStep: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  instructionNumCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#203026",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  instructionNumText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6CD498",
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: "#BACCC0",
    lineHeight: 19,
  },
  overlayCard: {
    backgroundColor: "#19261E",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2D4436",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  overlayInfo: {
    flex: 1,
  },
  overlayTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  overlaySubtitle: {
    fontSize: 11,
    color: "#8FA396",
    marginTop: 2,
  },
  overlayLaunchBtn: {
    backgroundColor: "#28594B",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  overlayLaunchBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  criteriaCard: {
    backgroundColor: "#121A15",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E2C22",
  },
  criteriaTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8FA396",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  criteriaBody: {
    fontSize: 13,
    color: "#D0DFD5",
    lineHeight: 18,
  },
  reviewContainer: {
    gap: 16,
  },
  completionBanner: {
    backgroundColor: "#1B2B21",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3D614E",
  },
  completionEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#F6F5EE",
  },
  completionSub: {
    fontSize: 13,
    color: "#A2B8AA",
    marginTop: 4,
  },
  checklistHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checklistCounter: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6CD498",
  },
  checklistPrompt: {
    fontSize: 12,
    color: "#8FA396",
    marginBottom: 4,
  },
  checklistItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#17231B",
    borderWidth: 1,
    borderColor: "#233529",
  },
  checklistItemRowActive: {
    backgroundColor: "#1E3326",
    borderColor: "#3D614E",
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#4A6655",
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxActive: {
    backgroundColor: "#28594B",
    borderColor: "#6CD498",
  },
  checkMark: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  checkItemText: {
    flex: 1,
    fontSize: 13,
    color: "#BACCC0",
  },
  checkItemTextActive: {
    color: "#F6F5EE",
  },
  notesPrompt: {
    fontSize: 12,
    color: "#8FA396",
  },
  notesInput: {
    backgroundColor: "#162019",
    borderRadius: 8,
    padding: 12,
    color: "#F6F5EE",
    fontSize: 13,
    lineHeight: 18,
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#26382D",
    textAlignVertical: "top",
  },
  saveSessionBtn: {
    backgroundColor: "#28594B",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveSessionBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  pressed: {
    opacity: 0.8,
  },
});
