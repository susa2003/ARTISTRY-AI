/**
 * ARTISTRY AI — Beginner Guided Lesson Interface
 * Step-by-step interactive lesson viewer adhering strictly to Section 2.3:
 * - Title, objective, short explanation
 * - Visual demonstration diagram
 * - Step-by-step instructions with Previous, Next, and Restart controls
 * - Practice activity and completion criteria
 * - Explicit "Mark as Completed" action persisted to SQLite
 * - "Practice in Studio" quick-action launcher
 */

import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import type { CurriculumLesson } from "./types";
import { getNextLesson, getPreviousLesson } from "./curriculumData";
import { useAppStore } from "../../state/appStore";
import * as database from "../../storage/database";

interface BeginnerLessonModalProps {
  lesson: CurriculumLesson | null;
  visible: boolean;
  onClose: () => void;
  onLessonChange?: (newLesson: CurriculumLesson) => void;
}

export function BeginnerLessonModal({
  lesson,
  visible,
  onClose,
  onLessonChange,
}: BeginnerLessonModalProps) {
  if (!lesson) return null;

  const lessonProgress = useAppStore((state) => state.lessonProgress);
  const setLessonCompleted = useAppStore((state) => state.setLessonCompleted);
  const setActiveLessonId = useAppStore((state) => state.setActiveLessonId);
  const createProject = useAppStore((state) => state.createProject);

  const isCompleted = Boolean(lessonProgress[lesson.id]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const steps = lesson.steps;
  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex] ?? steps[0]!;

  // Load saved step progress from SQLite on mount or when lesson changes
  useEffect(() => {
    let mounted = true;
    async function loadStep() {
      try {
        const savedStep = await database.getLessonStepProgress(lesson!.id);
        if (mounted && savedStep >= 1 && savedStep <= totalSteps) {
          setCurrentStepIndex(savedStep - 1);
        } else if (mounted) {
          setCurrentStepIndex(0);
        }
        await setActiveLessonId(lesson!.id);
      } catch {
        if (mounted) setCurrentStepIndex(0);
      }
    }
    if (visible && lesson) {
      void loadStep();
    }
    return () => {
      mounted = false;
    };
  }, [lesson?.id, visible, totalSteps, setActiveLessonId]);

  const handleStepChange = async (newIndex: number) => {
    const clamped = Math.max(0, Math.min(totalSteps - 1, newIndex));
    setCurrentStepIndex(clamped);
    await database.saveLessonStepProgress(lesson.id, clamped + 1);
  };

  const handleRestart = async () => {
    setCurrentStepIndex(0);
    await database.saveLessonStepProgress(lesson.id, 1);
  };

  const handleToggleComplete = async () => {
    const nextState = !isCompleted;
    await setLessonCompleted(lesson.id, nextState);
  };

  const handlePracticeInStudio = async () => {
    onClose();
    try {
      const projectId = await createProject(null, `Practice: ${lesson.title}`);
      router.push(`/reference-studio/${projectId}`);
    } catch {
      router.push("/reference");
    }
  };

  const handleNextLesson = () => {
    const next = getNextLesson(lesson.id);
    if (next && onLessonChange) {
      onLessonChange(next);
    }
  };

  const handlePreviousLesson = () => {
    const prev = getPreviousLesson(lesson.id);
    if (prev && onLessonChange) {
      onLessonChange(prev);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Top Bar */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.levelPill}>
                <Text style={styles.levelPillText}>LEVEL {lesson.level}</Text>
              </View>
              <Text style={styles.lessonNumber}>Lesson {lesson.lessonNumber}</Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              accessibilityLabel="Close lesson"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {/* Title & Objective Card */}
            <View style={styles.titleCard}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonSubtitle}>{lesson.subtitle}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaBadge}>⏱ {lesson.estimatedMinutes} min</Text>
                <Text style={styles.metaBadge}>📂 {lesson.category.toUpperCase()}</Text>
                {isCompleted && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>✓ COMPLETED</Text>
                  </View>
                )}
              </View>

              <View style={styles.objectiveBox}>
                <Text style={styles.objectiveLabel}>LEARNING OBJECTIVE</Text>
                <Text style={styles.objectiveText}>{lesson.objective}</Text>
              </View>
            </View>

            {/* Explanation */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Foundational Concept</Text>
              <Text style={styles.explanationText}>{lesson.explanation}</Text>
            </View>

            {/* Visual Demonstration Banner */}
            <View style={styles.demonstrationBox}>
              <View style={styles.demoHeader}>
                <Text style={styles.demoIcon}>👁️</Text>
                <Text style={styles.demoTitle}>Visual Demonstration</Text>
              </View>
              <Text style={styles.demoText}>{lesson.visualDemonstration}</Text>
            </View>

            {/* Step-by-Step Instructions Card */}
            <View style={styles.stepCard}>
              <View style={styles.stepProgressRow}>
                <Text style={styles.stepProgressLabel}>
                  STEP {currentStepIndex + 1} OF {totalSteps}
                </Text>
                <View style={styles.stepDots}>
                  {steps.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.stepDot,
                        i === currentStepIndex && styles.stepDotActive,
                        i < currentStepIndex && styles.stepDotPassed,
                      ]}
                    />
                  ))}
                </View>
              </View>

              <Text style={styles.stepTitle}>{currentStep.title}</Text>
              <Text style={styles.stepInstruction}>{currentStep.instruction}</Text>

              {currentStep.tip ? (
                <View style={styles.tipBox}>
                  <Text style={styles.tipIcon}>💡</Text>
                  <Text style={styles.tipText}>
                    <Text style={styles.tipBold}>Master Tip: </Text>
                    {currentStep.tip}
                  </Text>
                </View>
              ) : null}

              {/* Step Navigation Controls */}
              <View style={styles.stepNavRow}>
                <Pressable
                  onPress={() => void handleStepChange(currentStepIndex - 1)}
                  disabled={currentStepIndex === 0}
                  style={[
                    styles.navBtn,
                    currentStepIndex === 0 && styles.navBtnDisabled,
                  ]}
                  accessibilityLabel="Previous Step"
                >
                  <Text style={[styles.navBtnText, currentStepIndex === 0 && styles.navBtnTextDisabled]}>
                    ‹ Previous Step
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleRestart}
                  style={styles.restartBtn}
                  accessibilityLabel="Restart Lesson"
                >
                  <Text style={styles.restartBtnText}>↺ Restart</Text>
                </Pressable>

                {currentStepIndex < totalSteps - 1 ? (
                  <Pressable
                    onPress={() => void handleStepChange(currentStepIndex + 1)}
                    style={[styles.navBtn, styles.navBtnPrimary]}
                    accessibilityLabel="Next Step"
                  >
                    <Text style={[styles.navBtnText, styles.navBtnTextPrimary]}>
                      Next Step ›
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={handleToggleComplete}
                    style={[
                      styles.navBtn,
                      isCompleted ? styles.navBtnCompleted : styles.navBtnPrimary,
                    ]}
                    accessibilityLabel="Mark as Completed"
                  >
                    <Text style={[styles.navBtnText, styles.navBtnTextPrimary]}>
                      {isCompleted ? "✓ Completed" : "Mark Complete"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Practice Activity Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Practice Activity</Text>
              <Text style={styles.practiceText}>{lesson.practiceActivity}</Text>

              <Pressable
                onPress={() => void handlePracticeInStudio()}
                style={({ pressed }) => [styles.studioActionBtn, pressed && styles.pressed]}
                accessibilityLabel="Practice in Reference Studio"
              >
                <Text style={styles.studioActionBtnIcon}>✎</Text>
                <Text style={styles.studioActionBtnText}>Practice in Reference Studio</Text>
              </Pressable>
            </View>

            {/* Completion Criteria & Mark Complete Button */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Completion Criteria</Text>
              <Text style={styles.criteriaText}>{lesson.completionCriteria}</Text>

              <Pressable
                onPress={handleToggleComplete}
                style={[
                  styles.completeToggleBtn,
                  isCompleted && styles.completeToggleBtnActive,
                ]}
                accessibilityLabel={isCompleted ? "Mark as Incomplete" : "Mark as Completed"}
              >
                <Text style={styles.completeToggleIcon}>{isCompleted ? "✓" : "○"}</Text>
                <Text style={styles.completeToggleText}>
                  {isCompleted ? "Lesson Completed (Tap to unmark)" : "Mark Lesson as Completed"}
                </Text>
              </Pressable>
            </View>

            {/* Lesson Navigation Footer */}
            <View style={styles.lessonNavFooter}>
              <Pressable
                onPress={handlePreviousLesson}
                style={styles.footerNavBtn}
              >
                <Text style={styles.footerNavBtnText}>‹ Previous Lesson</Text>
              </Pressable>

              <Pressable
                onPress={handleNextLesson}
                style={styles.footerNavBtn}
              >
                <Text style={styles.footerNavBtnText}>Next Lesson ›</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 13, 11, 0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#161B18",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#28342D",
    height: "92%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#242E28",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  levelPill: {
    backgroundColor: "#203026",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2E4738",
  },
  levelPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6DBA93",
    letterSpacing: 0.5,
  },
  lessonNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9EA9A1",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#222B25",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: "#D4DDD6",
    fontSize: 14,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.8,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 14,
    paddingBottom: 40,
  },
  titleCard: {
    backgroundColor: "#1D2420",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2A352E",
    gap: 10,
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F6F5EE",
    lineHeight: 26,
  },
  lessonSubtitle: {
    fontSize: 13,
    color: "#A2AEA5",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 2,
  },
  metaBadge: {
    fontSize: 11,
    color: "#7D8C81",
    backgroundColor: "#242E27",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  completedBadge: {
    backgroundColor: "#1F3B2C",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#305A43",
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6CD498",
  },
  objectiveBox: {
    backgroundColor: "#171D1A",
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#28594B",
    gap: 4,
  },
  objectiveLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#5CA882",
    letterSpacing: 0.5,
  },
  objectiveText: {
    fontSize: 13,
    color: "#DCE5DF",
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: "#1D2420",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A352E",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E5ECE7",
  },
  explanationText: {
    fontSize: 13,
    color: "#B4C0B7",
    lineHeight: 19,
  },
  demonstrationBox: {
    backgroundColor: "#1E2722",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#304036",
    gap: 8,
  },
  demoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  demoIcon: {
    fontSize: 16,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#D5A844",
  },
  demoText: {
    fontSize: 13,
    color: "#C2CEC6",
    lineHeight: 18,
    fontStyle: "italic",
  },
  stepCard: {
    backgroundColor: "#202823",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#314237",
    gap: 12,
  },
  stepProgressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepProgressLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#5EB689",
    letterSpacing: 0.5,
  },
  stepDots: {
    flexDirection: "row",
    gap: 5,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2C3930",
  },
  stepDotActive: {
    width: 16,
    backgroundColor: "#5EB689",
  },
  stepDotPassed: {
    backgroundColor: "#3A5444",
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  stepInstruction: {
    fontSize: 14,
    color: "#D0DAD3",
    lineHeight: 20,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#171F1A",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2A3B30",
  },
  tipIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  tipText: {
    fontSize: 12,
    color: "#AABCB0",
    lineHeight: 17,
    flex: 1,
  },
  tipBold: {
    fontWeight: "700",
    color: "#D5A844",
  },
  stepNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#29362E",
  },
  navBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#27332B",
  },
  navBtnPrimary: {
    backgroundColor: "#28594B",
  },
  navBtnCompleted: {
    backgroundColor: "#1F4230",
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D2DDD5",
  },
  navBtnTextPrimary: {
    color: "#FFFFFF",
  },
  navBtnTextDisabled: {
    color: "#7E8D82",
  },
  restartBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  restartBtnText: {
    fontSize: 11,
    color: "#8B9A90",
  },
  practiceText: {
    fontSize: 13,
    color: "#C2CEC6",
    lineHeight: 18,
  },
  studioActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#28594B",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  studioActionBtnIcon: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  studioActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  criteriaText: {
    fontSize: 13,
    color: "#C2CEC6",
    lineHeight: 18,
  },
  completeToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#202A24",
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#2D3E32",
  },
  completeToggleBtnActive: {
    backgroundColor: "#1A3324",
    borderColor: "#305A40",
  },
  completeToggleIcon: {
    fontSize: 16,
    fontWeight: "800",
    color: "#6CD498",
  },
  completeToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E2EEE6",
  },
  lessonNavFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  footerNavBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  footerNavBtnText: {
    fontSize: 12,
    color: "#8B9A90",
    fontWeight: "600",
  },
});
