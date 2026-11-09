import {
  ART_LESSONS,
  DAILY_CHALLENGES,
  getTodayChallenge,
  type DailyChallenge,
  type Lesson,
} from "../LearningCenter";

describe("LearningCenter", () => {
  test("defines comprehensive drawing curriculum lessons", () => {
    expect(ART_LESSONS.length).toBeGreaterThanOrEqual(6);

    const categories = new Set(ART_LESSONS.map((l) => l.category));
    expect(categories.has("fundamentals")).toBe(true);
    expect(categories.has("loomis")).toBe(true);
    expect(categories.has("anatomy")).toBe(true);
    expect(categories.has("shading")).toBe(true);
    expect(categories.has("perspective")).toBe(true);

    ART_LESSONS.forEach((lesson) => {
      expect(lesson.id).toMatch(/^lesson-\d+$/);
      expect(lesson.number).toBeGreaterThan(0);
      expect(lesson.title.length).toBeGreaterThan(5);
      expect(lesson.estimatedMinutes).toBeGreaterThan(0);
      expect(lesson.objective.length).toBeGreaterThan(15);
      expect(lesson.principles.length).toBeGreaterThanOrEqual(2);
      expect(lesson.exercises.length).toBeGreaterThanOrEqual(1);
    });
  });

  test("contains 7-day cyclical daily challenges with time limits", () => {
    expect(DAILY_CHALLENGES.length).toBe(7);

    DAILY_CHALLENGES.forEach((challenge) => {
      expect(challenge.dayOfWeek).toBeGreaterThanOrEqual(0);
      expect(challenge.dayOfWeek).toBeLessThanOrEqual(6);
      expect(challenge.title.length).toBeGreaterThan(5);
      expect(challenge.theme.length).toBeGreaterThan(3);
      expect(challenge.prompt.length).toBeGreaterThan(20);
      expect(challenge.timeLimitMinutes).toBeGreaterThan(0);
      expect(challenge.rubric.length).toBeGreaterThanOrEqual(3);
    });
  });

  test("getTodayChallenge returns today's matching daily sprint", () => {
    const today = getTodayChallenge();
    const currentDayOfWeek = new Date().getDay();

    expect(today).toBeDefined();
    expect(today.dayOfWeek).toBe(currentDayOfWeek);
    expect(today.timeLimitMinutes).toBeGreaterThan(0);
    expect(today.rubric.length).toBeGreaterThanOrEqual(3);
  });
});
