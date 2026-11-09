import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppHeader, Button, Eyebrow, InfoCard, Screen } from "../../components/AppUI";
import { colors } from "../../theme";
import { computeDrawingProgress, type ProgressReport } from "./DrawingProgressEngine";

export const DrawingProgressView: React.FC = () => {
  const [report, setReport] = useState<ProgressReport | null>(null);

  useEffect(() => {
    void computeDrawingProgress().then(setReport);
  }, []);

  if (!report) {
    return (
      <Screen>
        <AppHeader title="Drawing Progress AI" onBack={() => router.back()} />
        <Text style={{ marginTop: 24, textAlign: "center", color: colors.inkMuted }}>Analyzing drawing history...</Text>
      </Screen>
    );
  }

  const radarItems = [
    { label: "Proportions", score: report.radar.proportions },
    { label: "Linework & Alignment", score: report.radar.alignment },
    { label: "Perspective", score: report.radar.perspective },
    { label: "Form Shading", score: report.radar.shading },
    { label: "Composition", score: report.radar.composition },
    { label: "Habit & Consistency", score: report.radar.consistency },
  ];

  return (
    <Screen>
      <AppHeader title="Drawing Progress AI" onBack={() => router.back()} />
      <Eyebrow>DATA-DRIVEN SKILL DIAGNOSTICS</Eyebrow>
      <Text style={styles.title}>Drawing Progress AI<Text style={styles.titleDot}>.</Text></Text>
      <Text style={styles.note}>
        Holistic mastery evaluation calculated from your saved sketches, daily challenges, and diagnostic history.
      </Text>

      {/* Overview Stat Cards */}
      <View style={styles.statRow}>
        <InfoCard style={styles.statCard}>
          <Text style={styles.statValue}>{report.overallAverage}%</Text>
          <Text style={styles.statLabel}>Composite Skill Score</Text>
        </InfoCard>
        <InfoCard style={styles.statCard}>
          <Text style={styles.statValue}>🔥 {report.streakDays}</Text>
          <Text style={styles.statLabel}>Day Active Streak</Text>
        </InfoCard>
        <InfoCard style={styles.statCard}>
          <Text style={styles.statValue}>{report.totalDrawingsCount}</Text>
          <Text style={styles.statLabel}>Saved Studies</Text>
        </InfoCard>
      </View>

      {/* Skill Radar Breakdown */}
      <InfoCard style={styles.radarCard}>
        <Text style={styles.cardHeading}>Artistic Competency Radar</Text>
        <View style={styles.radarList}>
          {radarItems.map((item) => (
            <View key={item.label} style={styles.radarRow}>
              <View style={styles.radarLabelRow}>
                <Text style={styles.radarName}>{item.label}</Text>
                <Text style={styles.radarScore}>{item.score}%</Text>
              </View>
              <View style={styles.radarBarBg}>
                <View
                  style={[
                    styles.radarBarFill,
                    {
                      width: `${item.score}%`,
                      backgroundColor: item.score >= 75 ? colors.forest : item.score >= 50 ? colors.terracotta : "#C0392B",
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </InfoCard>

      {/* Weakness-Targeted Recommendation */}
      <InfoCard style={[styles.recommendCard, { borderColor: colors.clay }]}>
        <View style={styles.recommendBadge}>
          <Text style={styles.recommendBadgeText}>TARGETED FOCUS AREA</Text>
        </View>
        <Text style={styles.recommendTitle}>{report.recommendedFocus.category}</Text>
        <Text style={styles.recommendDesc}>{report.recommendedFocus.description}</Text>
        <Text style={styles.recommendLesson}>Recommended: {report.recommendedFocus.lessonTitle}</Text>
        <Button
          title={`Practice in ${report.recommendedFocus.category}`}
          icon="✎"
          onPress={() => router.push(`/tools/${report.recommendedFocus.actionToolId}` as any)}
          style={styles.fullBtn}
        />
      </InfoCard>

      {/* Old vs New Comparison Pair */}
      {report.comparisonPairs && (
        <InfoCard style={styles.comparisonCard}>
          <Text style={styles.cardHeading}>Growth Comparison (Earliest vs Latest)</Text>
          <View style={styles.pairRow}>
            <View style={styles.pairItem}>
              <Text style={styles.pairTag}>EARLIEST STUDY</Text>
              <Text style={styles.pairName}>{report.comparisonPairs.oldest.name}</Text>
              <Text style={styles.pairDate}>{report.comparisonPairs.oldest.date}</Text>
              <Text style={styles.pairScore}>{report.comparisonPairs.oldest.score}%</Text>
            </View>
            <View style={styles.deltaBox}>
              <Text style={[styles.deltaText, { color: report.comparisonPairs.improvementDelta >= 0 ? colors.forest : colors.terracotta }]}>
                {report.comparisonPairs.improvementDelta >= 0 ? `+${report.comparisonPairs.improvementDelta}%` : `${report.comparisonPairs.improvementDelta}%`}
              </Text>
              <Text style={styles.deltaLabel}>Growth</Text>
            </View>
            <View style={styles.pairItem}>
              <Text style={styles.pairTag}>LATEST STUDY</Text>
              <Text style={styles.pairName}>{report.comparisonPairs.newest.name}</Text>
              <Text style={styles.pairDate}>{report.comparisonPairs.newest.date}</Text>
              <Text style={styles.pairScore}>{report.comparisonPairs.newest.score}%</Text>
            </View>
          </View>
        </InfoCard>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "700", color: colors.charcoal, marginTop: 4, marginBottom: 4 },
  titleDot: { color: colors.terracotta },
  note: { fontSize: 13, color: colors.inkMuted, lineHeight: 18, marginBottom: 14 },
  statRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  statCard: { flex: 1, padding: 12, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: colors.charcoal },
  statLabel: { fontSize: 10, color: colors.inkMuted, marginTop: 4, textAlign: "center" },
  radarCard: { padding: 16, marginBottom: 14 },
  cardHeading: { fontSize: 14, fontWeight: "700", color: colors.charcoal, marginBottom: 12 },
  radarList: { gap: 10 },
  radarRow: { gap: 4 },
  radarLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  radarName: { fontSize: 12, color: colors.charcoal, fontWeight: "500" },
  radarScore: { fontSize: 12, fontWeight: "700", color: colors.forest },
  radarBarBg: { height: 8, backgroundColor: "#EBE5D8", borderRadius: 4, overflow: "hidden" },
  radarBarFill: { height: "100%", borderRadius: 4 },
  recommendCard: { padding: 16, marginBottom: 14 },
  recommendBadge: { alignSelf: "flex-start", backgroundColor: colors.forest, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginBottom: 8 },
  recommendBadgeText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
  recommendTitle: { fontSize: 16, fontWeight: "700", color: colors.charcoal, marginBottom: 4 },
  recommendDesc: { fontSize: 12, color: colors.inkMuted, marginBottom: 6 },
  recommendLesson: { fontSize: 12, fontStyle: "italic", color: colors.forest, marginBottom: 12 },
  fullBtn: { marginTop: 4 },
  comparisonCard: { padding: 16, marginBottom: 14 },
  pairRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pairItem: { flex: 1, alignItems: "center" },
  pairTag: { fontSize: 9, fontWeight: "700", color: colors.inkMuted, marginBottom: 2 },
  pairName: { fontSize: 12, fontWeight: "600", color: colors.charcoal },
  pairDate: { fontSize: 10, color: colors.inkMuted },
  pairScore: { fontSize: 16, fontWeight: "700", color: colors.charcoal, marginTop: 4 },
  deltaBox: { paddingHorizontal: 12, alignItems: "center" },
  deltaText: { fontSize: 18, fontWeight: "800" },
  deltaLabel: { fontSize: 9, color: colors.inkMuted },
});
