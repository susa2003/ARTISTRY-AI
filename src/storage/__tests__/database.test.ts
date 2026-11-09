import {
  recordLessonProgress,
  getLessonProgress,
  recordChallengeCompletion,
  getStreakData,
  getChallengeHistory,
  getOnboardingCompleted,
  setOnboardingCompleted,
} from "../database";

describe("SQLite Persistence (Phase 3 Learning & Challenges)", () => {
  test("persists and retrieves onboarding completion state", async () => {
    await setOnboardingCompleted(false);
    expect(await getOnboardingCompleted()).toBe(false);
    await setOnboardingCompleted(true);
    expect(await getOnboardingCompleted()).toBe(true);
  });

  test("persists lesson completion and toggles status", async () => {
    // Record lesson 1 as complete
    await recordLessonProgress("lesson-01", true);
    let progress = await getLessonProgress();
    expect(progress["lesson-01"]?.completed).toBe(true);

    // Toggle lesson 1 to incomplete
    await recordLessonProgress("lesson-01", false);
    progress = await getLessonProgress();
    expect(progress["lesson-01"]).toBeUndefined();
  });

  test("records daily challenge completions and updates streak safely", async () => {
    const today = new Date().toISOString().split("T")[0]!;

    const result = await recordChallengeCompletion("Daily Sprint - Master Study", "proj-123");
    expect(result.streak).toBeGreaterThanOrEqual(1);

    const streak = await getStreakData();
    expect(streak.currentStreak).toBe(result.streak);
    expect(streak.longestStreak).toBeGreaterThanOrEqual(result.streak);
    expect(streak.lastActiveDate).toBe(today);

    const history = await getChallengeHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]?.challengeTitle).toBe("Daily Sprint - Master Study");
  });
});
