import {
  DEFAULT_SKETCH_OPTIONS,
  SKETCH_STYLES,
  convertSketchGuideToStrokes,
} from "../SketchConverterEngine";

describe("SketchConverterEngine", () => {
  test("defines 8 distinct artistic styles", () => {
    expect(SKETCH_STYLES.length).toBe(8);
    const styleIds = SKETCH_STYLES.map((s) => s.id);
    expect(styleIds).toContain("graphite");
    expect(styleIds).toContain("charcoal");
    expect(styleIds).toContain("ink");
    expect(styleIds).toContain("lineart");
    expect(styleIds).toContain("coloredpencil");
    expect(styleIds).toContain("watercolor");
    expect(styleIds).toContain("cartoon");
    expect(styleIds).toContain("realistic");
  });

  test("generates canvas guide strokes with appropriate style weights", () => {
    const strokes = convertSketchGuideToStrokes(800, 1000, "charcoal");
    expect(strokes.length).toBeGreaterThan(0);
    expect(strokes[0]?.kind).toBe("pencil");
    expect(strokes[0]?.width).toBe(4); // charcoal uses heavier stroke width
    expect(strokes[0]?.color).toBe("#1A1A1A");

    const inkStrokes = convertSketchGuideToStrokes(800, 1000, "ink");
    expect(inkStrokes[0]?.width).toBe(2); // ink uses fine stroke width
  });

  test("default options have balanced parameters", () => {
    expect(DEFAULT_SKETCH_OPTIONS.intensity).toBe(75);
    expect(DEFAULT_SKETCH_OPTIONS.contrast).toBe(60);
    expect(DEFAULT_SKETCH_OPTIONS.grayscale).toBe(true);
    expect(DEFAULT_SKETCH_OPTIONS.paperTexture).toBe(true);
  });
});
