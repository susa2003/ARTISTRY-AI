import {
  fetchAnalysisHistory,
  runDrawingAnalysis,
} from "../DrawingAnalyzerEngine";

describe("DrawingAnalyzerEngine", () => {
  test("computes genuine multi-factor scores and stores record", async () => {
    const dummyPixels = new Uint8Array(400);
    // Fill dummy drawing pixels with some strokes (darker values)
    for (let i = 0; i < dummyPixels.length; i += 4) {
      dummyPixels[i] = 40;     // R
      dummyPixels[i + 1] = 40; // G
      dummyPixels[i + 2] = 40; // B
      dummyPixels[i + 3] = 255;
    }

    const record = await runDrawingAnalysis({
      drawingPixels: dummyPixels,
      width: 100,
      height: 100,
    }, "proj-test-1");

    expect(record.overallScore).toBeGreaterThanOrEqual(50);
    expect(record.overallScore).toBeLessThanOrEqual(100);
    expect(record.proportionsScore).toBeGreaterThan(0);
    expect(record.alignmentScore).toBeGreaterThan(0);
    expect(record.perspectiveScore).toBeGreaterThan(0);
    expect(record.compositionScore).toBeGreaterThan(0);
    expect(record.shadingScore).toBeGreaterThan(0);

    expect(record.feedback.length).toBeGreaterThan(0);
    expect(record.annotations.length).toBeGreaterThan(0);
    expect(record.annotations[0]?.label).toBeDefined();

    // Verify history retrieval
    const history = await fetchAnalysisHistory("proj-test-1");
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]?.projectId).toBe("proj-test-1");
  });
});
