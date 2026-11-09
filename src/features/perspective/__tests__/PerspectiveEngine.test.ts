import {
  calculatePerspective,
  convertPerspectiveToStrokes,
  DEFAULT_PERSPECTIVE_CONFIG,
  type PerspectiveConfig,
} from "../PerspectiveEngine";

describe("PerspectiveEngine", () => {
  const width = 1000;
  const height = 800;

  test("calculates 1-point perspective with single central vanishing point", () => {
    const config: PerspectiveConfig = {
      ...DEFAULT_PERSPECTIVE_CONFIG,
      mode: "1-point",
      horizonY: 0.5,
      vp1X: 0.5,
      showVerticals: true,
    };
    const data = calculatePerspective(width, height, config);

    expect(data.vanishingPoints.length).toBe(1);
    expect(data.vanishingPoints[0]?.label).toBe("VP 1");
    expect(data.vanishingPoints[0]?.x).toBe(500);
    expect(data.vanishingPoints[0]?.y).toBe(400);

    expect(data.rays.length).toBeGreaterThan(0);
    expect(data.verticals.length).toBeGreaterThan(0);
    expect(data.horizonLine[0].y).toBe(400);
    expect(data.horizonLine[1].y).toBe(400);
  });

  test("calculates 2-point perspective with left and right vanishing points", () => {
    const config: PerspectiveConfig = {
      ...DEFAULT_PERSPECTIVE_CONFIG,
      mode: "2-point",
      horizonY: 0.4,
      vp1X: 0.1,
      vp2X: 0.9,
    };
    const data = calculatePerspective(width, height, config);

    expect(data.vanishingPoints.length).toBe(2);
    expect(data.vanishingPoints[0]?.label).toBe("VP Left");
    expect(data.vanishingPoints[1]?.label).toBe("VP Right");
    expect(data.vanishingPoints[0]?.x).toBe(100);
    expect(data.vanishingPoints[1]?.x).toBe(900);
    expect(data.vanishingPoints[0]?.y).toBe(320); // 800 * 0.4
    expect(data.vanishingPoints[1]?.y).toBe(320);
  });

  test("calculates 3-point perspective with zenith / worm's eye vanishing point", () => {
    const config: PerspectiveConfig = {
      ...DEFAULT_PERSPECTIVE_CONFIG,
      mode: "3-point",
      horizonY: 0.6,
      vp1X: 0.15,
      vp2X: 0.85,
      vp3Y: -0.4, // Looking up at skyscraper (Zenith)
    };
    const data = calculatePerspective(width, height, config);

    expect(data.vanishingPoints.length).toBe(3);
    const vp3 = data.vanishingPoints[2];
    expect(vp3?.label).toContain("Zenith");
    expect(vp3?.y).toBe(800 * -0.4);
    expect(vp3?.x).toBe(500);
  });

  test("calculates 3-point perspective with nadir / bird's eye vanishing point", () => {
    const config: PerspectiveConfig = {
      ...DEFAULT_PERSPECTIVE_CONFIG,
      mode: "3-point",
      vp3Y: 1.4, // Looking down (Nadir)
    };
    const data = calculatePerspective(width, height, config);
    expect(data.vanishingPoints[2]?.label).toContain("Nadir");
  });

  test("converts perspective rays into drawing strokes for canvas", () => {
    const strokes = convertPerspectiveToStrokes(1000, 1000, DEFAULT_PERSPECTIVE_CONFIG);

    expect(strokes.length).toBeGreaterThan(10);
    const horizonStroke = strokes.find((s) => s.color === "#CB7857");
    expect(horizonStroke).toBeDefined();
    expect(horizonStroke?.points.length).toBe(2);

    strokes.forEach((stroke) => {
      expect(stroke.id).toMatch(/^persp-/);
      expect(stroke.kind).toBe("pencil");
      expect(stroke.points[0]?.x).toBeDefined();
      expect(stroke.points[1]?.y).toBeDefined();
    });
  });
});
