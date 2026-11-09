import {
  DEFAULT_VECTOR_OPTIONS,
  convertSketchToVector,
  convertVectorToStrokes,
} from "../VectorConverterEngine";

describe("VectorConverterEngine", () => {
  test("generates scalable Bézier SVG vector content", async () => {
    const res = await convertSketchToVector("dummy-uri.png", DEFAULT_VECTOR_OPTIONS);

    expect(res.svgContent).toContain("<svg");
    expect(res.svgContent).toContain("path d=");
    expect(res.pathCount).toBeGreaterThan(0);
    expect(res.pointCount).toBeGreaterThan(0);
    expect(res.savedFilePath).toContain(".svg");
  });

  test("converts vector contours to canvas guide strokes", () => {
    const strokes = convertVectorToStrokes(1000, 1400);
    expect(strokes.length).toBeGreaterThan(0);
    expect(strokes[0]?.points.length).toBeGreaterThan(15);
  });
});
