import {
  analyzeCompositionFidelity,
  convertCompositionToStrokes,
} from "../CompositionCoachEngine";

describe("CompositionCoachEngine", () => {
  test("analyzes rule of thirds, golden ratio, and visual balance", async () => {
    const res = await analyzeCompositionFidelity(undefined, null, 800, 800);

    expect(res.ruleOfThirdsAlignment).toBeGreaterThan(0);
    expect(res.goldenSpiralAlignment).toBeGreaterThan(0);
    expect(res.visualWeightCenter).toBeDefined();
    expect(res.critique.length).toBeGreaterThan(0);
  });

  test("generates Rule-of-Thirds and Golden Spiral guide strokes", () => {
    const thirdsStrokes = convertCompositionToStrokes(900, 900, "thirds");
    expect(thirdsStrokes.length).toBe(8); // 4 grid lines + 4 power point circles

    const spiralStrokes = convertCompositionToStrokes(900, 900, "golden_spiral");
    expect(spiralStrokes.length).toBe(1);
    expect(spiralStrokes[0]?.points.length).toBeGreaterThan(20);
  });
});
