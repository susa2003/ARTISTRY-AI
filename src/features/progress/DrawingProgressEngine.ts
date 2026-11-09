import type { DrawingAnalysisRecord, ProjectSummary } from "../../domain/types";
import * as database from "../../storage/database";

export type SkillRadar = {
  proportions: number;
  alignment: number;
  perspective: number;
  shading: number;
  composition: number;
  consistency: number;
};

export type ProgressReport = {
  radar: SkillRadar;
  overallAverage: number;
  totalDrawingsCount: number;
  streakDays: number;
  completedLessonsCount: number;
  completedChallengesCount: number;
  weakestArea: string;
  recommendedFocus: {
    category: string;
    lessonTitle: string;
    description: string;
    actionToolId: string;
  };
  comparisonPairs?: {
    oldest: { name: string; date: string; score: number };
    newest: { name: string; date: string; score: number };
    improvementDelta: number;
  };
};

export async function computeDrawingProgress(): Promise<ProgressReport> {
  const [analyses, projects, lessonProgress, streakData, challenges] = await Promise.all([
    database.getDrawingAnalyses(50),
    database.listProjects(),
    database.getLessonProgress(),
    database.getStreakData(),
    database.getChallengeHistory(),
  ]);

  let proportions = 70;
  let alignment = 70;
  let perspective = 70;
  let shading = 70;
  let composition = 70;

  if (analyses.length > 0) {
    const sum = analyses.reduce(
      (acc, a) => ({
        p: acc.p + a.proportionsScore,
        al: acc.al + a.alignmentScore,
        pe: acc.pe + a.perspectiveScore,
        s: acc.s + a.shadingScore,
        c: acc.c + a.compositionScore,
      }),
      { p: 0, al: 0, pe: 0, s: 0, c: 0 }
    );
    const count = analyses.length;
    proportions = Math.round(sum.p / count);
    alignment = Math.round(sum.al / count);
    perspective = Math.round(sum.pe / count);
    shading = Math.round(sum.s / count);
    composition = Math.round(sum.c / count);
  }

  const completedLessonsCount = Object.values(lessonProgress).filter((l) => l.completed).length;
  const consistency = Math.min(100, Math.round(streakData.currentStreak * 12 + completedLessonsCount * 4));

  const radar: SkillRadar = {
    proportions,
    alignment,
    perspective,
    shading,
    composition,
    consistency: Math.max(20, consistency),
  };

  const skills = [
    { key: "proportions", score: proportions, name: "Figure Proportions", tool: "anatomy", lesson: "Human Proportion 8-Head Canon", desc: "Sharpen head-unit measurements and pelvic ratios." },
    { key: "alignment", score: alignment, name: "Facial & Feature Alignment", tool: "loomis", lesson: "Loomis Sphere & Brow Tilt", desc: "Practice aligning eye axis perpendicular to facial centerlines." },
    { key: "perspective", score: perspective, name: "Perspective & Foreshortening", tool: "perspective", lesson: "2-Point Converging Grids", desc: "Lock down vanishing points before adding form details." },
    { key: "shading", score: shading, name: "Form Shading & Values", tool: "shading", lesson: "5-Value Shading Matrix", desc: "Deepen core terminator shadows and control bounce light." },
    { key: "composition", score: composition, name: "Composition & Balance", tool: "composition", lesson: "Rule of Thirds & Golden Ratio", desc: "Balance positive masses against generous negative space." },
  ];

  skills.sort((a, b) => a.score - b.score);
  const weakest = skills[0]!;

  const overallAverage = Math.round(
    (proportions + alignment + perspective + shading + composition) / 5
  );

  let comparisonPairs;
  if (analyses.length >= 2) {
    const newest = analyses[0]!;
    const oldest = analyses[analyses.length - 1]!;
    const delta = newest.overallScore - oldest.overallScore;
    comparisonPairs = {
      oldest: {
        name: `Study #${oldest.id.slice(-4)}`,
        date: new Date(oldest.timestamp).toLocaleDateString(),
        score: oldest.overallScore,
      },
      newest: {
        name: `Study #${newest.id.slice(-4)}`,
        date: new Date(newest.timestamp).toLocaleDateString(),
        score: newest.overallScore,
      },
      improvementDelta: delta,
    };
  }

  return {
    radar,
    overallAverage,
    totalDrawingsCount: projects.length,
    streakDays: streakData.currentStreak,
    completedLessonsCount,
    completedChallengesCount: challenges.length,
    weakestArea: weakest.name,
    recommendedFocus: {
      category: weakest.name,
      lessonTitle: weakest.lesson,
      description: weakest.desc,
      actionToolId: weakest.tool,
    },
    comparisonPairs,
  };
}
