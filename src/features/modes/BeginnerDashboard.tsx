/**
 * ARTISTRY AI — Beginner Mode Dashboard
 * Full educational command center for beginners as specified in Section 2.1:
 * - Start Learning / Continue Learning action banner
 * - My Drawing Progress (real completion count, percentage, streak)
 * - 7-Level Drawing Lessons curriculum accordion
 * - Practice Exercises browser
 * - My Projects recent list
 * - Beginner Drawing Guide launcher
 */

import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { DRAWING_CURRICULUM, getAllLessons, getLessonById } from "./curriculumData";
import type { CurriculumLesson, CurriculumLevel } from "./types";
import { BeginnerLessonModal } from "./BeginnerLessonModal";
import { BeginnerDrawingGuideModal } from "./BeginnerDrawingGuideModal";
import { useAppStore } from "../../state/appStore";

export interface BeginnerDashboardProps {
  onOpenModeSelector?: () => void;
}

export function BeginnerDashboard({ onOpenModeSelector }: BeginnerDashboardProps = {}) {
  const lessonProgress = useAppStore((state) => state.lessonProgress);
  const activeLessonId = useAppStore((state) => state.activeLessonId);
  const streak = useAppStore((state) => state.streak);
  const projects = useAppStore((state) => state.projects);
  const createProject = useAppStore((state) => state.createProject);

  const [selectedLesson, setSelectedLesson] = useState<CurriculumLesson | null>(null);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({
    1: true, // Level 1 open by default
  });

  const allLessons = useMemo(() => getAllLessons(), []);
  const totalLessons = allLessons.length;

  // Real progress count from SQLite
  const completedCount = useMemo(() => {
    return allLessons.filter((l) => Boolean(lessonProgress[l.id])).length;
  }, [allLessons, lessonProgress]);

  const percentComplete = Math.round((completedCount / Math.max(1, totalLessons)) * 100);

  // Determine active or next uncompleted lesson
  const currentOrNextLesson = useMemo(() => {
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

  const handleStartOrContinue = () => {
    setSelectedLesson(currentOrNextLesson);
  };

  const handleOpenNewDrawing = async () => {
    try {
      const id = await createProject(null, "Beginner Practice Drawing");
      router.push(`/reference-studio/${id}`);
    } catch {
      router.push("/reference");
    }
  };

  return (
    <View style={styles.container}>
      {/* MODE INDICATOR & SWITCHER BAR */}
      <View style={styles.modeBar}>
        <View style={styles.modeTag}>
          <Text style={styles.modeTagDot}>🌱</Text>
          <Text style={styles.modeTagText}>Beginner Personal Drawing Teacher</Text>
        </View>
        {onOpenModeSelector ? (
          <Pressable
            onPress={onOpenModeSelector}
            style={({ pressed }) => [styles.modeSwitchBtn, pressed && styles.pressed]}
            accessibilityLabel="Switch experience mode"
          >
            <Text style={styles.modeSwitchBtnText}>Switch to Pro ⚡</Text>
          </Pressable>
        ) : null}
      </View>

      {/* 1. START / CONTINUE LEARNING HERO BANNER */}
      <View style={styles.heroBanner}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>
            {completedCount > 0 ? "CONTINUE LEARNING" : "START LEARNING"}
          </Text>
        </View>

        <Text style={styles.heroTitle}>{currentOrNextLesson.title}</Text>
        <Text style={styles.heroSubtitle}>
          Level {currentOrNextLesson.level} · Lesson {currentOrNextLesson.lessonNumber} · {currentOrNextLesson.estimatedMinutes} min
        </Text>

        <Text style={styles.heroObjective} numberOfLines={2}>
          {currentOrNextLesson.objective}
        </Text>

        <View style={styles.heroActionRow}>
          <Pressable
            onPress={handleStartOrContinue}
            style={({ pressed }) => [styles.heroBtn, pressed && styles.pressed]}
            accessibilityLabel="Start or continue active lesson"
          >
            <Text style={styles.heroBtnText}>
              {completedCount > 0 ? "▶ Resume Lesson" : "▶ Start Level 1"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setGuideModalOpen(true)}
            style={({ pressed }) => [styles.guideBtn, pressed && styles.pressed]}
            accessibilityLabel="Open Beginner Drawing Guide"
          >
            <Text style={styles.guideBtnText}>📖 Drawing Guide</Text>
          </Pressable>
        </View>
      </View>

      {/* 2. MY DRAWING PROGRESS METRICS */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.progressCardTitle}>My Drawing Progress</Text>
            <Text style={styles.progressCardSub}>
              {completedCount} of {totalLessons} curriculum lessons completed
            </Text>
          </View>

          <View style={styles.percentBadge}>
            <Text style={styles.percentText}>{percentComplete}%</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${Math.max(4, percentComplete)}%` }]} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{streak.current} 🔥</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalLessons - completedCount}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>
      </View>

      {/* 3. DRAWING LESSONS (7-LEVEL ACCORDION) */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionMainTitle}>Drawing Curriculum</Text>
          <Text style={styles.sectionMainSub}>7 Levels from fundamentals to completed portraits</Text>
        </View>
      </View>

      {DRAWING_CURRICULUM.map((level: CurriculumLevel) => {
        const isExpanded = Boolean(expandedLevels[level.level]);
        const levelCompletedCount = level.lessons.filter((l) => Boolean(lessonProgress[l.id])).length;
        const isLevelFinished = levelCompletedCount === level.lessons.length;

        return (
          <View key={level.level} style={styles.levelCard}>
            {/* Level Accordion Header */}
            <Pressable
              onPress={() => toggleLevelExpand(level.level)}
              style={styles.levelHeader}
              accessibilityLabel={`Toggle Level ${level.level}`}
            >
              <View style={styles.levelHeaderLeft}>
                <View style={[styles.levelIconBox, isLevelFinished && styles.levelIconBoxComplete]}>
                  <Text style={styles.levelIcon}>{level.icon}</Text>
                </View>
                <View style={styles.levelTitleGroup}>
                  <View style={styles.levelTitleRow}>
                    <Text style={styles.levelTitleText}>{level.title}</Text>
                    {isLevelFinished && (
                      <View style={styles.levelDoneBadge}>
                        <Text style={styles.levelDoneBadgeText}>DONE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.levelSubText}>
                    {levelCompletedCount}/{level.lessons.length} lessons · {level.subtitle}
                  </Text>
                </View>
              </View>

              <Text style={styles.expandChevron}>{isExpanded ? "▲" : "▼"}</Text>
            </Pressable>

            {/* Level Lesson Items */}
            {isExpanded && (
              <View style={styles.lessonList}>
                {level.lessons.map((lesson: CurriculumLesson) => {
                  const isDone = Boolean(lessonProgress[lesson.id]);
                  const isCurrent = currentOrNextLesson.id === lesson.id;

                  return (
                    <Pressable
                      key={lesson.id}
                      onPress={() => setSelectedLesson(lesson)}
                      style={({ pressed }) => [
                        styles.lessonRow,
                        isCurrent && styles.lessonRowCurrent,
                        pressed && styles.pressed,
                      ]}
                      accessibilityLabel={`Open lesson ${lesson.title}`}
                    >
                      <View style={[styles.lessonStatusCircle, isDone && styles.lessonStatusCircleDone]}>
                        <Text style={[styles.lessonStatusIcon, isDone && styles.lessonStatusIconDone]}>
                          {isDone ? "✓" : String(lesson.lessonNumber)}
                        </Text>
                      </View>

                      <View style={styles.lessonInfo}>
                        <Text style={[styles.lessonItemTitle, isDone && styles.lessonItemTitleDone]}>
                          {lesson.title}
                        </Text>
                        <Text style={styles.lessonItemSub} numberOfLines={1}>
                          {lesson.subtitle}
                        </Text>
                      </View>

                      <Text style={styles.lessonDuration}>{lesson.estimatedMinutes}m</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {/* 4. MY PROJECTS RECENT ROW */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionMainTitle}>My Practice Drawings</Text>
          <Text style={styles.sectionMainSub}>Your saved drawings and studio exercises</Text>
        </View>

        <Pressable
          onPress={handleOpenNewDrawing}
          style={styles.newDrawingBtn}
          accessibilityLabel="Start a new blank drawing"
        >
          <Text style={styles.newDrawingBtnText}>＋ New Drawing</Text>
        </Pressable>
      </View>

      {projects.length === 0 ? (
        <View style={styles.emptyProjectsCard}>
          <Text style={styles.emptyProjectsIcon}>🎨</Text>
          <Text style={styles.emptyProjectsTitle}>No Drawings Yet</Text>
          <Text style={styles.emptyProjectsText}>
            Start a lesson or open a blank canvas to begin applying your traditional drawing foundations.
          </Text>
          <Pressable
            onPress={handleOpenNewDrawing}
            style={styles.emptyStartBtn}
          >
            <Text style={styles.emptyStartBtnText}>Start Drawing Now</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.projectScroll}
          contentContainerStyle={styles.projectScrollContent}
        >
          {projects.slice(0, 6).map((proj) => (
            <Pressable
              key={proj.id}
              onPress={() => router.push(`/reference-studio/${proj.id}`)}
              style={({ pressed }) => [styles.projectCard, pressed && styles.pressed]}
            >
              <View style={styles.projectThumbPlaceholder}>
                <Text style={styles.projectThumbIcon}>🖼️</Text>
              </View>
              <Text style={styles.projectName} numberOfLines={1}>
                {proj.name}
              </Text>
              <Text style={styles.projectDate}>
                {new Date(proj.updatedAt).toLocaleDateString()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Modals */}
      <BeginnerLessonModal
        lesson={selectedLesson}
        visible={Boolean(selectedLesson)}
        onClose={() => setSelectedLesson(null)}
        onLessonChange={(next) => setSelectedLesson(next)}
      />

      <BeginnerDrawingGuideModal
        visible={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 32,
  },
  pressed: {
    opacity: 0.82,
  },
  modeBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#17201B",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#223128",
  },
  modeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modeTagDot: {
    fontSize: 14,
  },
  modeTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C5D7CC",
  },
  modeSwitchBtn: {
    backgroundColor: "#202F27",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2E4739",
  },
  modeSwitchBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#77D9A4",
  },
  heroBanner: {
    backgroundColor: "#18221D",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#263B30",
    gap: 8,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#20362B",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#305542",
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6CD498",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F6F5EE",
    lineHeight: 26,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "#A2B4A8",
  },
  heroObjective: {
    fontSize: 13,
    color: "#D0DCD3",
    lineHeight: 18,
    marginVertical: 4,
  },
  heroActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  heroBtn: {
    backgroundColor: "#28594B",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  heroBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  guideBtn: {
    backgroundColor: "#232F28",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#304037",
  },
  guideBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#DCE5DF",
  },
  progressCard: {
    backgroundColor: "#19201C",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#26322B",
    gap: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F6F5EE",
  },
  progressCardSub: {
    fontSize: 12,
    color: "#8B9A90",
    marginTop: 2,
  },
  percentBadge: {
    backgroundColor: "#203027",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2F473A",
  },
  percentText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6CD498",
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#232D27",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4EA87D",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#242E28",
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  statLabel: {
    fontSize: 11,
    color: "#809085",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#26322B",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 6,
  },
  sectionMainTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  sectionMainSub: {
    fontSize: 12,
    color: "#8B9A90",
    marginTop: 2,
  },
  newDrawingBtn: {
    backgroundColor: "#202C25",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2E4237",
  },
  newDrawingBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5EB689",
  },
  levelCard: {
    backgroundColor: "#18201C",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#28342D",
    overflow: "hidden",
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  levelHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  levelIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#212A24",
    justifyContent: "center",
    alignItems: "center",
  },
  levelIconBoxComplete: {
    backgroundColor: "#1B3628",
  },
  levelIcon: {
    fontSize: 20,
  },
  levelTitleGroup: {
    flex: 1,
  },
  levelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  levelTitleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F6F5EE",
  },
  levelDoneBadge: {
    backgroundColor: "#203A2B",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  levelDoneBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#6CD498",
  },
  levelSubText: {
    fontSize: 12,
    color: "#8B9A90",
    marginTop: 2,
  },
  expandChevron: {
    fontSize: 11,
    color: "#6E7E74",
    paddingLeft: 8,
  },
  lessonList: {
    borderTopWidth: 1,
    borderTopColor: "#222B25",
    paddingVertical: 4,
  },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  lessonRowCurrent: {
    backgroundColor: "#1E2A23",
  },
  lessonStatusCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#252F28",
    justifyContent: "center",
    alignItems: "center",
  },
  lessonStatusCircleDone: {
    backgroundColor: "#204230",
  },
  lessonStatusIcon: {
    fontSize: 11,
    fontWeight: "700",
    color: "#839288",
  },
  lessonStatusIconDone: {
    color: "#6CD498",
  },
  lessonInfo: {
    flex: 1,
  },
  lessonItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E2ECE5",
  },
  lessonItemTitleDone: {
    color: "#A2B2A7",
  },
  lessonItemSub: {
    fontSize: 11,
    color: "#77857C",
    marginTop: 1,
  },
  lessonDuration: {
    fontSize: 11,
    color: "#6E7D73",
  },
  emptyProjectsCard: {
    backgroundColor: "#18201C",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#26322B",
  },
  emptyProjectsIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  emptyProjectsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E2ECE5",
  },
  emptyProjectsText: {
    fontSize: 13,
    color: "#7B8A80",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyStartBtn: {
    backgroundColor: "#28594B",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  emptyStartBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  projectScroll: {
    marginHorizontal: -18,
  },
  projectScrollContent: {
    paddingHorizontal: 18,
    gap: 12,
  },
  projectCard: {
    width: 140,
    backgroundColor: "#18201C",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#28342D",
    gap: 6,
  },
  projectThumbPlaceholder: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    backgroundColor: "#202A24",
    justifyContent: "center",
    alignItems: "center",
  },
  projectThumbIcon: {
    fontSize: 24,
  },
  projectName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E2ECE5",
  },
  projectDate: {
    fontSize: 10,
    color: "#74847A",
  },
});
