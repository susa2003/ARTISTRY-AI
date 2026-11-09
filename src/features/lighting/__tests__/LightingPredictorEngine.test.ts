import {
  convertLightingToStrokes,
  detectLighting,
} from "../LightingPredictorEngine";

describe("LightingPredictorEngine", () => {
  test("predicts light direction and produces graphite recommendations", async () => {
    const res = await detectLighting(undefined, null, 800, 800);

    expect(res.primaryLightAngle).toBeGreaterThanOrEqual(0);
    expect(res.primaryLightAngle).toBeLessThanOrEqual(360);
    expect(res.highlightZones.length).toBeGreaterThan(0);
    expect(res.coreShadowZones.length).toBeGreaterThan(0);

    expect(res.recommendedGraphiteGrades.highlights).toContain("2H");
    expect(res.recommendedGraphiteGrades.midtones).toContain("HB");
    expect(res.recommendedGraphiteGrades.shadows).toContain("2B");
    expect(res.recommendedGraphiteGrades.deepDark).toContain("6B");

    const strokes = convertLightingToStrokes(res, 800, 800);
    expect(strokes.length).toBeGreaterThan(0);
    expect(strokes.some((s) => s.color === "#F39C12")).toBe(true); // Directional light ray
  });
});
