import {
  analyzeHandOrFoot,
  convertHandFootToStrokes,
} from "../HandFootEngine";

describe("HandFootEngine", () => {
  test("analyzes hand landmarks, palm box, and knuckle arches", async () => {
    const res = await analyzeHandOrFoot("hand", undefined, 800, 800);

    expect(res.type).toBe("hand");
    expect(res.landmarks.length).toBe(21);
    expect(res.palmBoundingBox).toBeDefined();
    expect(res.commonMistakes.length).toBeGreaterThan(0);

    const strokes = convertHandFootToStrokes(res);
    expect(strokes.length).toBeGreaterThan(0);
  });

  test("analyzes foot structure, arch, and calcaneus", async () => {
    const res = await analyzeHandOrFoot("foot", undefined, 800, 800);

    expect(res.type).toBe("foot");
    expect(res.landmarks.length).toBeGreaterThanOrEqual(6);
    expect(res.tips.length).toBeGreaterThan(0);

    const strokes = convertHandFootToStrokes(res);
    expect(strokes.length).toBeGreaterThan(0);
  });
});
