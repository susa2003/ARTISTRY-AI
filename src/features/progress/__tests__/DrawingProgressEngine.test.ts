import { computeDrawingProgress } from "../DrawingProgressEngine";

describe("DrawingProgressEngine", () => {
  test("computes progress radar and diagnostic weaknesses", async () => {
    const report = await computeDrawingProgress();

    expect(report.radar.proportions).toBeGreaterThan(0);
    expect(report.radar.alignment).toBeGreaterThan(0);
    expect(report.radar.perspective).toBeGreaterThan(0);
    expect(report.radar.shading).toBeGreaterThan(0);
    expect(report.radar.composition).toBeGreaterThan(0);
    expect(report.radar.consistency).toBeGreaterThan(0);

    expect(report.overallAverage).toBeGreaterThan(0);
    expect(report.overallAverage).toBeLessThanOrEqual(100);

    expect(report.weakestArea).toBeDefined();
    expect(report.recommendedFocus.actionToolId).toBeDefined();
    expect(report.recommendedFocus.lessonTitle).toBeDefined();
  });
});
