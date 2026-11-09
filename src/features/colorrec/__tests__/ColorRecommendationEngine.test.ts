import {
  fetchSavedPalettes,
  generateColorRecommendations,
  persistPalette,
  removePalette,
} from "../ColorRecommendationEngine";

describe("ColorRecommendationEngine", () => {
  test("generates harmonic palettes and persists records", async () => {
    const res = await generateColorRecommendations(["#7C5D43"]);

    expect(res.palettes.complementary.length).toBeGreaterThan(0);
    expect(res.palettes.analogous.length).toBeGreaterThan(0);
    expect(res.palettes.triadic.length).toBeGreaterThan(0);
    expect(res.palettes.skinTones.length).toBeGreaterThan(0);
    expect(res.brushSuggestions.length).toBeGreaterThan(0);

    const saved = await persistPalette("Test Palette", ["#111111", "#222222", "#333333"]);
    expect(saved.id).toBeDefined();

    const list = await fetchSavedPalettes();
    expect(list.some((p) => p.id === saved.id)).toBe(true);

    await removePalette(saved.id);
    const updated = await fetchSavedPalettes();
    expect(updated.some((p) => p.id === saved.id)).toBe(false);
  });
});
