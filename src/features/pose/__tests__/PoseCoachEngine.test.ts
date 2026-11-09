import {
  POSE_PRESETS,
  convertPoseToStrokes,
  detectPoseLandmarks,
} from "../PoseCoachEngine";

describe("PoseCoachEngine", () => {
  test("defines key action and gestural presets", () => {
    expect(POSE_PRESETS.length).toBeGreaterThanOrEqual(4);
    const names = POSE_PRESETS.map((p) => p.name);
    expect(names).toContain("Classic Contrapposto");
    expect(names).toContain("Dynamic Sprint");
  });

  test("detects landmarks and converts pose to editable canvas strokes", async () => {
    const pose = await detectPoseLandmarks(undefined, 800, 1000);

    expect(pose.landmarks.length).toBeGreaterThanOrEqual(13);
    expect(pose.lineOfAction).toBeDefined();
    expect(pose.lineOfAction.start.y).toBeLessThan(pose.lineOfAction.end.y);

    const strokes = convertPoseToStrokes(pose);
    expect(strokes.length).toBeGreaterThan(0);
    // Line of action stroke is present
    expect(strokes.some((s) => s.color === "#00ACC1")).toBe(true);
  });
});
