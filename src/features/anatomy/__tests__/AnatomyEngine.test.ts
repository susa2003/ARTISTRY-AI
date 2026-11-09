import {
  calculateAnatomy,
  convertAnatomyToStrokes,
  DEFAULT_ANATOMY_CONFIG,
  ANATOMY_TUTORIAL_STEPS,
  type AnatomyConfig,
} from "../AnatomyEngine";

describe("AnatomyEngine", () => {
  const width = 800;
  const height = 1200;

  test("calculates standard 8-head canonical proportions", () => {
    const config: AnatomyConfig = { ...DEFAULT_ANATOMY_CONFIG, gender: "neutral" };
    const data = calculateAnatomy(width, height, config);

    expect(data.divisions.length).toBe(9); // Head 0 through Head 8
    expect(data.divisions[0]?.label).toBe("Head 0");
    expect(data.divisions[1]?.landmark).toContain("Chin");
    expect(data.divisions[4]?.landmark).toContain("Pubic Arch");
    expect(data.divisions[8]?.landmark).toContain("Feet");

    // Pubic arch at Head 4 should be approximately halfway down the total figure
    const totalFigureHeight = data.divisions[8]!.y - data.divisions[0]!.y;
    const midpointY = data.divisions[0]!.y + totalFigureHeight / 2;
    expect(data.divisions[4]!.y).toBeCloseTo(midpointY, 1);
  });

  test("supports Heroic (8.5-head) and Classical Female (7.5-head) canons", () => {
    const heroic = calculateAnatomy(width, height, { ...DEFAULT_ANATOMY_CONFIG, gender: "heroic" });
    expect(heroic.divisions.length).toBe(10); // 0 to 9 divisions for 8.5 canon

    const female = calculateAnatomy(width, height, { ...DEFAULT_ANATOMY_CONFIG, gender: "female" });
    expect(female.divisions.length).toBe(9); // 0 to 8 divisions for 7.5 canon
  });

  test("calculates skeletal landmarks and bone structures", () => {
    const data = calculateAnatomy(width, height, DEFAULT_ANATOMY_CONFIG);

    expect(data.skeletalLines.length).toBeGreaterThanOrEqual(6);
    const names = data.skeletalLines.map((s) => s.name);
    expect(names).toContain("Cranium");
    expect(names).toContain("Spine Column");
    expect(names).toContain("Clavicle");
    expect(names).toContain("Thoracic Cage");
    expect(names).toContain("Pelvis Basin");
  });

  test("calculates primary muscle group contours", () => {
    const data = calculateAnatomy(width, height, DEFAULT_ANATOMY_CONFIG);

    expect(data.muscles.length).toBeGreaterThanOrEqual(4);
    const muscleNames = data.muscles.map((m) => m.name);
    expect(muscleNames).toContain("Left Deltoid Cap");
    expect(muscleNames).toContain("Left Pectoral Plate");
    expect(muscleNames).toContain("Rectus Abdominis (Core)");

    // Verify all muscle landmarks have valid 2D coordinates
    data.muscles.forEach((m) => {
      expect(m.points.length).toBeGreaterThanOrEqual(3);
      m.points.forEach((pt) => {
        expect(pt.x).toBeGreaterThan(0);
        expect(pt.y).toBeGreaterThan(0);
      });
    });
  });

  test("converts anatomy proportions and muscles to canvas drawing strokes", () => {
    const strokes = convertAnatomyToStrokes(1000, 1400, { ...DEFAULT_ANATOMY_CONFIG, mode: "muscular" });

    expect(strokes.length).toBeGreaterThan(0);
    strokes.forEach((stroke) => {
      expect(stroke.id).toBeDefined();
      expect(stroke.points.length).toBeGreaterThanOrEqual(2);
      expect(stroke.width).toBeGreaterThan(0);
      expect(stroke.color).toBeDefined();
    });
  });

  test("provides complete 4-step interactive tutorial canon", () => {
    expect(ANATOMY_TUTORIAL_STEPS.length).toBe(4);
    const stepModes = ANATOMY_TUTORIAL_STEPS.map((s) => s.focusMode);
    expect(stepModes).toContain("proportions");
    expect(stepModes).toContain("skeletal");
    expect(stepModes).toContain("muscular");
    expect(stepModes).toContain("facial");

    ANATOMY_TUTORIAL_STEPS.forEach((step) => {
      expect(step.title).toBeDefined();
      expect(step.instruction.length).toBeGreaterThan(20);
      expect(step.tip.length).toBeGreaterThan(10);
      expect(step.landmarks.length).toBeGreaterThan(0);
    });
  });
});
