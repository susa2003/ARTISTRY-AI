/**
 * ARTISTRY AI — Practice Studio Screen
 * Dedicated traditional drawing practice headquarters:
 * - Daily drawing challenge based on today's calendar date
 * - 8 Skill category filters and 3 difficulty tiers
 * - Practice statistics: completed count, total time, and streak
 * - Recent practice history from SQLite
 * - Interactive PracticeModal for timed drawing sessions
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import type {
  PracticeCategory,
  PracticeDifficulty,
  PracticeExercise,
  PracticeSessionRecord,
} from "../../features/practice/types";
import {
  PRACTICE_CATEGORIES,
  filterExercises,
  getAllExercises,
  getCategoryMetadata,
  getDailyExercise,
} from "../../features/practice/practiceCatalog";
import { PracticeModal } from "../../features/practice/PracticeModal";
import { formatTimerSeconds } from "../../features/practice/PracticeTimer";
import { useResponsiveLayout } from "../../components/AppUI";
import {
  getPracticeSessionStats,
  getPracticeSessions,
} from "../../storage/database";
import { useAppStore } from "../../state/appStore";

type CategoryFilter = PracticeCategory | "all";
type DifficultyFilter = PracticeDifficulty | "all";

export default function PracticeStudioScreen() {
  const streak = useAppStore((state) => state.streak);
  const { isSmallPhone, isTablet, contentMaxWidth } = useResponsiveLayout();

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>("all");
  const [activeExercise, setActiveExercise] = useState<PracticeExercise | null>(null);
  const [historySessions, setHistorySessions] = useState<PracticeSessionRecord[]>([]);
  const [stats, setStats] = useState<{ totalSessions: number; completedCount: number; totalPracticeTimeMinutes: number }>({
    totalSessions: 0,
    completedCount: 0,
    totalPracticeTimeMinutes: 0,
  });
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const [sessions, statData] = await Promise.all([
        getPracticeSessions(20),
        getPracticeSessionStats(),
      ]);
      setHistorySessions(sessions);
      setStats(statData);
    } catch {
      // Safe fallback
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const dailyExercise = useMemo(() => getDailyExercise(), []);
  const filteredExercises = useMemo(
    () => filterExercises(selectedCategory, selectedDifficulty),
    [selectedCategory, selectedDifficulty]
  );

  const handleSessionFinished = async (session: PracticeSessionRecord) => {
    await loadData();
  };

  const formatTotalTime = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHud}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityLabel="Back to previous screen"
        >
          <Text style={styles.backBtnText}>‹ Back</Text>
        </Pressable>

        <View style={styles.headerTitles}>
          <Text style={styles.screenTag}>ARTISTRY AI STUDIO</Text>
          <Text style={styles.screenTitle}>Practice Studio</Text>
        </View>

        <View style={styles.streakBadge}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakText}>{streak.current} Days</Text>
        </View>
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={[styles.scrollContent, { maxWidth: contentMaxWidth as any, alignSelf: "center", width: "100%" }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Practice Performance Banner */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{stats.completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{formatTotalTime(stats.totalPracticeTimeMinutes)}</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValMoss}>{streak.current}d</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        {/* Daily Drawing Challenge Card */}
        {dailyExercise && (
          <View style={styles.dailyCard}>
            <View style={styles.dailyTopRow}>
              <View style={styles.dailyTagBadge}>
                <Text style={styles.dailyTagText}>☀️ TODAY'S PRACTICE</Text>
              </View>
              <View style={[styles.diffTag, getDifficultyStyle(dailyExercise.difficulty)]}>
                <Text style={styles.diffTagText}>{dailyExercise.difficulty.toUpperCase()}</Text>
              </View>
            </View>

            <Text style={styles.dailyTitle}>{dailyExercise.title}</Text>
            <Text style={styles.dailySub} numberOfLines={2}>
              {dailyExercise.objective}
            </Text>

            <View style={[styles.dailyFooter, isSmallPhone && { flexDirection: "column", alignItems: "stretch", gap: 10 }]}>
              <View style={styles.dailyMetaRow}>
                <Text style={styles.dailyTimeTag}>⏱ {dailyExercise.estimatedDurationMinutes} min</Text>
                <Text style={styles.dailyCatTag}>
                  {getCategoryMetadata(dailyExercise.category)?.icon} {getCategoryMetadata(dailyExercise.category)?.shortTitle}
                </Text>
              </View>

              <Pressable
                onPress={() => setActiveExercise(dailyExercise)}
                style={({ pressed }) => [styles.dailyStartBtn, isSmallPhone && { alignItems: "center" }, pressed && styles.pressed]}
                accessibilityLabel={`Start daily practice: ${dailyExercise.title}`}
              >
                <Text style={styles.dailyStartBtnText}>Start Practice ▶</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Skill Category Filter Chips */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>Skill Categories</Text>
          <Text style={styles.sectionSubCount}>{filteredExercises.length} Exercises</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <Pressable
            onPress={() => setSelectedCategory("all")}
            style={[styles.filterChip, selectedCategory === "all" && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, selectedCategory === "all" && styles.filterChipTextActive]}>
              ✨ All ({getAllExercises().length})
            </Text>
          </Pressable>

          {PRACTICE_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[styles.filterChip, selectedCategory === cat.id && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, selectedCategory === cat.id && styles.filterChipTextActive]}>
                {cat.icon} {cat.shortTitle}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Difficulty Filter Bar */}
        <View style={styles.diffFilterRow}>
          {(["all", "beginner", "intermediate", "advanced"] as const).map((diff) => (
            <Pressable
              key={diff}
              onPress={() => setSelectedDifficulty(diff)}
              style={[
                styles.diffFilterBtn,
                selectedDifficulty === diff && styles.diffFilterBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.diffFilterBtnText,
                  selectedDifficulty === diff && styles.diffFilterBtnTextActive,
                ]}
              >
                {diff === "all" ? "All Levels" : diff.charAt(0).toUpperCase() + diff.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Exercises List */}
        <View style={styles.exercisesList}>
          {filteredExercises.map((exercise) => {
            const meta = getCategoryMetadata(exercise.category);
            return (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.cardCatBadge}>
                    <Text style={styles.cardCatIcon}>{meta?.icon ?? "🎨"}</Text>
                    <Text style={styles.cardCatTitle}>{meta?.shortTitle ?? exercise.category}</Text>
                  </View>
                  <View style={[styles.diffTag, getDifficultyStyle(exercise.difficulty)]}>
                    <Text style={styles.diffTagText}>{exercise.difficulty.toUpperCase()}</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>{exercise.title}</Text>
                <Text style={styles.cardObjective} numberOfLines={2}>
                  {exercise.objective}
                </Text>

                <View style={[styles.cardFooter, isSmallPhone && { flexDirection: "column", alignItems: "stretch", gap: 8 }]}>
                  <View style={styles.cardBadgesRow}>
                    <Text style={styles.badgeTime}>⏱ {exercise.estimatedDurationMinutes}m</Text>
                    {exercise.recommendedOverlay && (
                      <Text style={styles.badgeOverlay}>
                        🎯 {exercise.recommendedOverlay.toUpperCase()}
                      </Text>
                    )}
                  </View>

                  <Pressable
                    onPress={() => setActiveExercise(exercise)}
                    style={({ pressed }) => [styles.cardStartBtn, isSmallPhone && { alignItems: "center" }, pressed && styles.pressed]}
                    accessibilityLabel={`Start exercise: ${exercise.title}`}
                  >
                    <Text style={styles.cardStartBtnText}>Start ▶</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        {/* Practice History Section */}
        <View style={styles.historySection}>
          <Pressable
            onPress={() => setShowHistory((prev) => !prev)}
            style={({ pressed }) => [styles.historyToggleHeader, pressed && styles.pressed]}
          >
            <View>
              <Text style={styles.historyHeading}>Practice History</Text>
              <Text style={styles.historySubHeading}>
                {historySessions.length} recorded drawing sessions
              </Text>
            </View>
            <Text style={styles.historyExpandIcon}>{showHistory ? "▲" : "▼"}</Text>
          </Pressable>

          {showHistory && (
            <View style={styles.historyList}>
              {historySessions.length === 0 ? (
                <Text style={styles.noHistoryText}>No completed sessions yet. Start drawing!</Text>
              ) : (
                historySessions.map((sess) => (
                  <View key={sess.id} style={styles.historyItemCard}>
                    <View style={styles.historyItemTop}>
                      <Text style={styles.historyItemExercise} numberOfLines={1}>
                        {sess.exerciseId}
                      </Text>
                      <Text style={styles.historyItemStatus}>
                        {sess.status === "completed" ? "✓ Completed" : "Partial"}
                      </Text>
                    </View>
                    <View style={styles.historyItemMeta}>
                      <Text style={styles.historyItemDuration}>
                        ⏱ {formatTimerSeconds(sess.elapsedDurationSeconds)} (Target: {sess.targetDurationMinutes}m)
                      </Text>
                      <Text style={styles.historyItemDate}>
                        {new Date(sess.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    {sess.notes && (
                      <Text style={styles.historyItemNotes} numberOfLines={2}>
                        "{sess.notes}"
                      </Text>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Interactive Practice Session Modal */}
      <PracticeModal
        visible={Boolean(activeExercise)}
        exercise={activeExercise}
        onClose={() => setActiveExercise(null)}
        onSessionComplete={handleSessionFinished}
      />
    </SafeAreaView>
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
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#202E24",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  streakIcon: {
    fontSize: 12,
  },
  streakText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E8B24C",
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  statsCard: {
    backgroundColor: "#141D17",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#202E24",
  },
  statItem: {
    alignItems: "center",
  },
  statVal: {
    fontSize: 20,
    fontWeight: "900",
    color: "#F6F5EE",
  },
  statValMoss: {
    fontSize: 20,
    fontWeight: "900",
    color: "#6CD498",
  },
  statLabel: {
    fontSize: 11,
    color: "#8FA396",
    marginTop: 2,
    fontWeight: "700",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#223528",
  },
  dailyCard: {
    backgroundColor: "#16231B",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2E4738",
    gap: 8,
  },
  dailyTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dailyTagBadge: {
    backgroundColor: "#244234",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  dailyTagText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#6CD498",
    letterSpacing: 0.8,
  },
  diffTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  diffTagText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  dailyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  dailySub: {
    fontSize: 13,
    color: "#9EB6A6",
    lineHeight: 18,
  },
  dailyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  dailyMetaRow: {
    flexDirection: "row",
    gap: 8,
  },
  dailyTimeTag: {
    fontSize: 11,
    color: "#8FA396",
    fontWeight: "700",
  },
  dailyCatTag: {
    fontSize: 11,
    color: "#6CD498",
    fontWeight: "700",
  },
  dailyStartBtn: {
    backgroundColor: "#28594B",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dailyStartBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  sectionSubCount: {
    fontSize: 12,
    color: "#7E9689",
    fontWeight: "700",
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    backgroundColor: "#161E19",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#25372B",
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
  diffFilterRow: {
    flexDirection: "row",
    backgroundColor: "#131C16",
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  diffFilterBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  diffFilterBtnActive: {
    backgroundColor: "#203026",
  },
  diffFilterBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7E9689",
  },
  diffFilterBtnTextActive: {
    color: "#F6F5EE",
  },
  exercisesList: {
    gap: 12,
  },
  exerciseCard: {
    backgroundColor: "#141D17",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#223328",
    gap: 6,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCatBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardCatIcon: {
    fontSize: 14,
  },
  cardCatTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6CD498",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  cardObjective: {
    fontSize: 12,
    color: "#9EB6A6",
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  cardBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgeTime: {
    fontSize: 11,
    color: "#7E9689",
  },
  badgeOverlay: {
    fontSize: 9,
    fontWeight: "700",
    color: "#BCCDC2",
    backgroundColor: "#1E2F25",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardStartBtn: {
    backgroundColor: "#244234",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cardStartBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6CD498",
  },
  historySection: {
    backgroundColor: "#131C16",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#202E24",
    marginTop: 8,
  },
  historyToggleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  historySubHeading: {
    fontSize: 11,
    color: "#7E9689",
    marginTop: 2,
  },
  historyExpandIcon: {
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
  historyItemCard: {
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
  historyItemExercise: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F6F5EE",
    flex: 1,
  },
  historyItemStatus: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6CD498",
  },
  historyItemMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  historyItemDuration: {
    fontSize: 11,
    color: "#8FA396",
  },
  historyItemDate: {
    fontSize: 11,
    color: "#6D8376",
  },
  historyItemNotes: {
    fontSize: 11,
    color: "#ADC1B4",
    fontStyle: "italic",
    marginTop: 2,
  },
  pressed: {
    opacity: 0.8,
  },
});
