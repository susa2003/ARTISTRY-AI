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

  test("persists and retrieves project with paper settings, image adjustments, and overlays", async () => {
    const { saveProject, getProject, removeProject } = await import("../database");
    const { DEFAULT_PAPER_SETTINGS, DEFAULT_IMAGE_ADJUSTMENTS } = await import("../../domain/overlayTypes");

    const testProject = {
      id: "test-proj-workstation-001",
      name: "Traditional Loomis Study",
      width: 1200,
      height: 900,
      layers: [
        {
          id: "layer-1",
          name: "Underdrawing",
          visible: true,
          opacity: 0.9,
          strokes: [],
        },
      ],
      activeLayerId: "layer-1",
      referenceUri: "file:///test/ref.jpg",
      paperSettings: {
        ...DEFAULT_PAPER_SETTINGS,
        size: "A4" as const,
        orientation: "portrait" as const,
        widthMm: 210,
        heightMm: 297,
        marginMm: 5.0,
      },
      imageAdjustments: {
        ...DEFAULT_IMAGE_ADJUSTMENTS,
        whiteoutStrength: 0.45,
        brightness: 0.1,
        contrast: 1.2,
      },
      overlays: [
        {
          id: "grid-01",
          type: "grid" as const,
          name: "Square Grid",
          visible: true,
          opacity: 0.7,
          locked: false,
          zIndex: 1,
          mode: "standard" as const,
          cellMode: "square" as const,
          divisions: 4,
          color: "#28594B",
          strokeWidth: 1.5,
          showLabels: true,
          showDiagonals: false,
          showSubdivisions: false,
        },
      ],
      experienceMode: "professional" as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveProject(testProject);
    const loaded = await getProject("test-proj-workstation-001");

    expect(loaded).toBeDefined();
    expect(loaded?.name).toBe("Traditional Loomis Study");
    expect(loaded?.paperSettings?.size).toBe("A4");
    expect(loaded?.paperSettings?.widthMm).toBe(210);
    expect(loaded?.imageAdjustments?.whiteoutStrength).toBe(0.45);
    expect(loaded?.imageAdjustments?.contrast).toBe(1.2);
    expect(loaded?.overlays).toHaveLength(1);
    expect(loaded?.overlays?.[0]?.type).toBe("grid");
    expect(loaded?.experienceMode).toBe("professional");

    // Clean up
    await removeProject("test-proj-workstation-001");
    const afterDelete = await getProject("test-proj-workstation-001");
    expect(afterDelete).toBeUndefined();
  });
});
