/**
 * ARTISTRY AI — Learning Studio
 * Unified traditional drawing educational headquarters:
 * - 7-Level progressive curriculum (40 lessons) from absolute zero to complete drawing mastery
 * - Real-time progress tracking, completion percentages, and daily streak records
 * - Fast resume for in-progress lessons with step memory
 * - Category filtering (Fundamentals, Shapes, Observation, Grid, Loomis, Shading, Practice)
 * - Deep integration with physical paper guides and Reference Studio overlays
 */

import React, { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { DRAWING_CURRICULUM, getAllLessons, getLessonById } from "../../features/modes/curriculumData";
import type { CurriculumLesson, CurriculumLevel } from "../../features/modes/types";
import { BeginnerLessonModal } from "../../features/modes/BeginnerLessonModal";
import { useResponsiveLayout } from "../../components/AppUI";
import { useAppStore } from "../../state/appStore";

type CategoryFilter = "all" | "fundamentals" | "shapes" | "observation" | "grid" | "loomis" | "shading" | "practice";

export default function LearningStudioScreen() {
  const lessonProgress = useAppStore((state) => state.lessonProgress);
  const activeLessonId = useAppStore((state) => state.activeLessonId);
  const streak = useAppStore((state) => state.streak);
  const experienceMode = useAppStore((state) => state.experienceMode);
  const setExperienceMode = useAppStore((state) => state.setExperienceMode);

  const { isSmallPhone, isTablet, contentMaxWidth } = useResponsiveLayout();

  const [selectedLesson, setSelectedLesson] = useState<CurriculumLesson | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({
    1: true,
    2: true,
  });

  const allLessons = useMemo(() => getAllLessons(), []);
  const totalLessons = allLessons.length;

  const completedCount = useMemo(() => {
    return allLessons.filter((l) => Boolean(lessonProgress[l.id])).length;
  }, [allLessons, lessonProgress]);

  const percentComplete = Math.round((completedCount / Math.max(1, totalLessons)) * 100);

  // Active / next uncompleted lesson for quick resume
  const resumeLesson = useMemo(() => {
    if (activeLessonId) {
      const active = getLessonById(activeLessonId);
      if (active) return active;
    }
    const nextUncompleted = allLessons.find((l) => !lessonProgress[l.id]);
    return nextUncompleted ?? allLessons[0]!;
  }, [activeLessonId, allLessons, lessonProgress]);

  const toggleLevelExpand = (lvl: number) => {
    setExpandedLevels((prev) => ({
      ...prev,
      [lvl]: !prev[lvl],
    }));
  };

  const filteredLevels = useMemo(() => {
    if (selectedCategory === "all") return DRAWING_CURRICULUM;
    return DRAWING_CURRICULUM.map((lvl) => ({
      ...lvl,
      lessons: lvl.lessons.filter((l) => l.category === selectedCategory),
    })).filter((lvl) => lvl.lessons.length > 0);
  }, [selectedCategory]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navigation Bar */}
      <View style={styles.topHud}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityLabel="Back to Home"
        >
          <Text style={styles.backBtnText}>‹ Home</Text>
        </Pressable>

        <View style={styles.headerTitles}>
          <Text style={styles.screenTag}>ARTISTRY AI STUDIO</Text>
          <Text style={styles.screenTitle}>Learning Studio</Text>
        </View>

        <Pressable
          onPress={() => setExperienceMode(experienceMode === "beginner" ? "professional" : "beginner")}
          style={styles.modeTogglePill}
          accessibilityLabel="Toggle experience mode"
        >
          <Text style={styles.modeToggleText}>
            {experienceMode === "beginner" ? "🌱 Beginner" : "⚡ Pro"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={[styles.scrollContent, { maxWidth: contentMaxWidth as any, alignSelf: "center", width: "100%" }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Overview Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressTopRow}>
            <View>
              <Text style={styles.progressCardTitle}>Traditional Drawing Mastery</Text>
              <Text style={styles.progressCardSub}>7-Level Classical Pedagogical Path</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakText}>{streak.current} Day Streak</Text>
            </View>
          </View>

          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${Math.max(4, percentComplete)}%` }]} />
          </View>

          <View style={styles.progressStatsRow}>
            <Text style={styles.progressStatItem}>
              <Text style={styles.progressStatVal}>{completedCount}</Text> of {totalLessons} Lessons
            </Text>
            <Text style={styles.progressStatValMoss}>{percentComplete}% Complete</Text>
          </View>
        </View>

        {/* Continue Learning Action Card */}
        {resumeLesson && (
          <View style={[styles.resumeCard, isSmallPhone && { flexDirection: "column", alignItems: "stretch", gap: 10 }]}>
            <View style={styles.resumeCardLeft}>
              <View style={styles.resumeTagRow}>
                <Text style={styles.resumeTag}>CONTINUE LEARNING</Text>
                <Text style={styles.resumeLevelTag}>Level {resumeLesson.level}</Text>
              </View>
              <Text style={styles.resumeTitle} numberOfLines={1}>
                {resumeLesson.title}
              </Text>
              <Text style={styles.resumeSubtitle} numberOfLines={1}>
                {resumeLesson.subtitle}
              </Text>
            </View>

            <Pressable
              onPress={() => setSelectedLesson(resumeLesson)}
              style={({ pressed }) => [styles.resumeButton, pressed && styles.pressed]}
              accessibilityLabel={`Resume lesson: ${resumeLesson.title}`}
            >
              <Text style={styles.resumeButtonText}>Resume ›</Text>
            </Pressable>
          </View>
        )}

        {/* Practice Studio Quick Navigation */}
        <Pressable
          onPress={() => router.push("/practice" as any)}
          style={({ pressed }) => [styles.practiceNavCard, pressed && styles.pressed]}
          accessibilityLabel="Open Practice Studio"
        >
          <View style={styles.practiceNavLeft}>
            <View style={styles.practiceNavIconBg}>
              <Text style={styles.practiceNavIcon}>⏱️</Text>
            </View>
            <View style={styles.practiceNavTexts}>
              <Text style={styles.practiceNavTitle}>Practice Studio</Text>
              <Text style={styles.practiceNavSub}>
                Timed daily exercises across 8 skill categories
              </Text>
            </View>
          </View>
          <Text style={styles.practiceNavArrow}>›</Text>
        </Pressable>

        {/* AI Drawing Assistant Quick Navigation */}
        <Pressable
          onPress={() => router.push("/assistant" as any)}
          style={({ pressed }) => [styles.assistantNavCard, pressed && styles.pressed]}
          accessibilityLabel="Open AI Drawing Assistant"
        >
          <View style={styles.practiceNavLeft}>
            <View style={styles.assistantNavIconBg}>
              <Text style={styles.practiceNavIcon}>🤖</Text>
            </View>
            <View style={styles.practiceNavTexts}>
              <Text style={styles.practiceNavTitle}>AI Drawing Assistant</Text>
              <Text style={styles.practiceNavSub}>
                Analyze reference composition, construction & lighting
              </Text>
            </View>
          </View>
          <Text style={styles.assistantNavArrow}>›</Text>
        </Pressable>

        {/* Drawing Comparison & Feedback Navigation */}
        <Pressable
          onPress={() => router.push("/comparison" as any)}
          style={({ pressed }) => [styles.comparisonNavCard, pressed && styles.pressed]}
          accessibilityLabel="Open Drawing Comparison"
        >
          <View style={styles.practiceNavLeft}>
            <View style={styles.comparisonNavIconBg}>
              <Text style={styles.practiceNavIcon}>🔍</Text>
            </View>
            <View style={styles.practiceNavTexts}>
              <Text style={styles.practiceNavTitle}>Drawing Comparison & Feedback</Text>
              <Text style={styles.practiceNavSub}>
                Compare your paper drawing against reference with 5 modes
              </Text>
            </View>
          </View>
          <Text style={styles.comparisonNavArrow}>›</Text>
        </Pressable>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {([
            { id: "all", label: "All Lessons (40)" },
            { id: "fundamentals", label: "Fundamentals" },
            { id: "shapes", label: "Shapes & Form" },
            { id: "observation", label: "Observation" },
            { id: "grid", label: "Grid Drawing" },
            { id: "loomis", label: "Face / Loomis" },
            { id: "shading", label: "Shading" },
            { id: "practice", label: "Master Practice" },
          ] as const).map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[styles.filterChip, selectedCategory === cat.id && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, selectedCategory === cat.id && styles.filterChipTextActive]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Curriculum Levels Accordion */}
        <View style={styles.levelsList}>
          {filteredLevels.map((lvl: CurriculumLevel) => {
            const isExpanded = Boolean(expandedLevels[lvl.level]);
            const levelCompleted = lvl.lessons.every((l) => Boolean(lessonProgress[l.id]));
            const levelCompletedCount = lvl.lessons.filter((l) => Boolean(lessonProgress[l.id])).length;

            return (
              <View key={lvl.level} style={styles.levelCard}>
                <Pressable
                  onPress={() => toggleLevelExpand(lvl.level)}
                  style={styles.levelHeader}
                  accessibilityLabel={`Level ${lvl.level}: ${lvl.title}`}
                >
                  <View style={styles.levelHeaderLeft}>
                    <Text style={styles.levelIcon}>{lvl.icon}</Text>
                    <View style={styles.levelTitles}>
                      <View style={styles.levelBadgeRow}>
                        <Text style={styles.levelTitle}>{lvl.title}</Text>
                        {levelCompleted && (
                          <View style={styles.levelDoneBadge}>
                            <Text style={styles.levelDoneText}>✓ LEVEL COMPLETED</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.levelSubtitle}>{lvl.subtitle}</Text>
                    </View>
                  </View>

                  <View style={styles.levelHeaderRight}>
                    <Text style={styles.levelCounter}>
                      {levelCompletedCount}/{lvl.lessons.length}
                    </Text>
                    <Text style={styles.expandArrow}>{isExpanded ? "▲" : "▼"}</Text>
                  </View>
                </Pressable>

                {isExpanded && (
                  <View style={styles.lessonsContainer}>
                    {lvl.lessons.map((lesson: CurriculumLesson) => {
                      const isDone = Boolean(lessonProgress[lesson.id]);
                      const isActive = activeLessonId === lesson.id;

                      return (
                        <Pressable
                          key={lesson.id}
                          onPress={() => setSelectedLesson(lesson)}
                          style={({ pressed }) => [
                            styles.lessonRow,
                            isDone && styles.lessonRowDone,
                            isActive && styles.lessonRowActive,
                            pressed && styles.pressed,
                          ]}
                          accessibilityLabel={`Lesson ${lesson.lessonNumber}: ${lesson.title}`}
                        >
                          <View style={styles.lessonRowLeft}>
                            <View style={[styles.statusCheck, isDone && styles.statusCheckDone]}>
                              <Text style={[styles.statusCheckText, isDone && styles.statusCheckTextDone]}>
                                {isDone ? "✓" : String(lesson.lessonNumber)}
                              </Text>
                            </View>

                            <View style={styles.lessonRowTexts}>
                              <Text style={[styles.lessonRowTitle, isDone && styles.lessonRowTitleDone]}>
                                {lesson.title}
                              </Text>
                              <Text style={styles.lessonRowSub} numberOfLines={1}>
                                {lesson.subtitle}
                              </Text>

                              <View style={styles.lessonRowBadges}>
                                <Text style={styles.badgeTime}>⏱ {lesson.estimatedMinutes} min</Text>
                                <Text style={styles.badgeCat}>{lesson.category}</Text>
                                {lesson.recommendedOverlay && (
                                  <Text style={styles.badgeOverlay}>
                                    🎯 {lesson.recommendedOverlay.toUpperCase()}
                                  </Text>
                                )}
                              </View>
                            </View>
                          </View>

                          <Text style={styles.lessonChevron}>›</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Lesson Step-by-Step Viewer Modal */}
      <BeginnerLessonModal
        lesson={selectedLesson}
        visible={Boolean(selectedLesson)}
        onClose={() => setSelectedLesson(null)}
        onLessonChange={(next) => setSelectedLesson(next)}
      />
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
    fontSize: 16,
    fontWeight: "800",
    color: "#F6F5EE",
    marginTop: 2,
  },
  modeTogglePill: {
    backgroundColor: "#22352B",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#305A43",
  },
  modeToggleText: {
    fontSize: 12,
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
  progressCard: {
    backgroundColor: "#18221D",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#28392F",
    gap: 12,
  },
  progressTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  progressCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  progressCardSub: {
    fontSize: 12,
    color: "#8FA396",
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2A2318",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#573F26",
  },
  streakIcon: {
    fontSize: 12,
  },
  streakText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E2934D",
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#111713",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#28594B",
    borderRadius: 4,
  },
  progressStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressStatItem: {
    fontSize: 12,
    color: "#8FA396",
  },
  progressStatVal: {
    color: "#F6F5EE",
    fontWeight: "800",
  },
  progressStatValMoss: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6CD498",
  },
  resumeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1B2A22",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#305A43",
    gap: 12,
  },
  resumeCardLeft: {
    flex: 1,
    gap: 2,
  },
  resumeTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resumeTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6CD498",
    letterSpacing: 0.8,
  },
  resumeLevelTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8FA396",
    backgroundColor: "#15201A",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  resumeTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F6F5EE",
    marginTop: 2,
  },
  resumeSubtitle: {
    fontSize: 12,
    color: "#9BB1A4",
  },
  resumeButton: {
    backgroundColor: "#28594B",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resumeButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  practiceNavCard: {
    backgroundColor: "#16231B",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#2B4434",
  },
  practiceNavLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  practiceNavIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#203628",
    alignItems: "center",
    justifyContent: "center",
  },
  practiceNavIcon: {
    fontSize: 18,
  },
  practiceNavTexts: {
    flex: 1,
  },
  practiceNavTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  practiceNavSub: {
    fontSize: 11,
    color: "#8FA396",
    marginTop: 2,
  },
  practiceNavArrow: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6CD498",
    paddingLeft: 8,
  },
  assistantNavCard: {
    backgroundColor: "#152026",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#263B47",
  },
  assistantNavIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#1F333E",
    alignItems: "center",
    justifyContent: "center",
  },
  assistantNavArrow: {
    fontSize: 20,
    fontWeight: "700",
    color: "#5FA8D3",
    paddingLeft: 8,
  },
  comparisonNavCard: {
    backgroundColor: "#1F1D16",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#383324",
  },
  comparisonNavIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#2E2A1E",
    alignItems: "center",
    justifyContent: "center",
  },
  comparisonNavArrow: {
    fontSize: 20,
    fontWeight: "700",
    color: "#E5A93C",
    paddingLeft: 8,
  },
  filtersScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    backgroundColor: "#18221D",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#28392F",
  },
  filterChipActive: {
    backgroundColor: "#244234",
    borderColor: "#6CD498",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8FA396",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  levelsList: {
    gap: 12,
  },
  levelCard: {
    backgroundColor: "#161E19",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#24352A",
    overflow: "hidden",
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  levelHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  levelIcon: {
    fontSize: 22,
  },
  levelTitles: {
    flex: 1,
  },
  levelBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  levelTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  levelDoneBadge: {
    backgroundColor: "#1F382B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelDoneText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#6CD498",
  },
  levelSubtitle: {
    fontSize: 11,
    color: "#8FA396",
    marginTop: 2,
  },
  levelHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  levelCounter: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8FA396",
  },
  expandArrow: {
    fontSize: 10,
    color: "#5B7365",
  },
  lessonsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#1F2C23",
  },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1A251E",
  },
  lessonRowDone: {
    opacity: 0.85,
  },
  lessonRowActive: {
    backgroundColor: "#1A2A20",
  },
  lessonRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  statusCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#202C24",
    alignItems: "center",
    justifyContent: "center",
  },
  statusCheckDone: {
    backgroundColor: "#28594B",
  },
  statusCheckText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8FA396",
  },
  statusCheckTextDone: {
    color: "#FFFFFF",
  },
  lessonRowTexts: {
    flex: 1,
    gap: 2,
  },
  lessonRowTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F6F5EE",
  },
  lessonRowTitleDone: {
    color: "#B2C3B8",
  },
  lessonRowSub: {
    fontSize: 11,
    color: "#7E9689",
  },
  lessonRowBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  badgeTime: {
    fontSize: 10,
    color: "#7E9689",
  },
  badgeCat: {
    fontSize: 10,
    color: "#6CD498",
    textTransform: "capitalize",
  },
  badgeOverlay: {
    fontSize: 9,
    fontWeight: "700",
    color: "#BCCDC2",
    backgroundColor: "#223328",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  lessonChevron: {
    fontSize: 18,
    color: "#4A6153",
    paddingLeft: 8,
  },
  pressed: {
    opacity: 0.8,
  },
});
