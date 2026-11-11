/**
 * ARTISTRY AI — Experience Mode & Curriculum Types
 * Defines Beginner and Professional mode structures, 7-level curriculum models,
 * step-by-step lesson interfaces, and learning progress schemas.
 */

export type ExperienceMode = "beginner" | "professional";

export type DiagramType =
  | "lines"
  | "shapes"
  | "cube"
  | "sphere"
  | "cylinder"
  | "cone"
  | "plumb"
  | "grid"
  | "loomis"
  | "shading"
  | "proportions"
  | "portrait";

export interface LessonStep {
  stepNumber: number;
  title: string;
  instruction: string;
  tip?: string;
  diagramType?: DiagramType;
}

export interface CurriculumLesson {
  id: string;
  level: number;
  lessonNumber: number;
  title: string;
  subtitle: string;
  category: "fundamentals" | "shapes" | "observation" | "grid" | "loomis" | "shading" | "practice";
  estimatedMinutes: number;
  objective: string;
  explanation: string;
  visualDemonstration: string;
  steps: LessonStep[];
  practiceActivity: string;
  completionCriteria: string;
  recommendedOverlay?: "grid" | "loomis" | "reilly" | "bargue" | "perspective" | "anatomy" | "shading" | "plumb" | "measurement" | "tracing";
}

export interface CurriculumLevel {
  level: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  lessons: CurriculumLesson[];
}

export interface UserLearningStats {
  totalLessons: number;
  completedLessons: number;
  percentComplete: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  activeLessonId: string | null;
  activeLessonStep: number;
}
