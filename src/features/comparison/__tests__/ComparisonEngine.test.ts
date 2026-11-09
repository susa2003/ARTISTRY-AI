import {
  calculateDifferenceMap,
  DEFAULT_COMPARISON_CONFIG,
} from "../ComparisonEngine";

describe("ComparisonEngine", () => {
  const width = 10;
  const height = 10;
  const pixelCount = width * height * 4;

  test("calculates difference map for an exact matching stroke", () => {
    const refPixels = new Uint8Array(pixelCount);
    const drawPixels = new Uint8Array(pixelCount);

    // Initialize all to white background
    refPixels.fill(255);
    drawPixels.fill(255);

    // Place an edge in the reference at index 0 (dark luma < 120)
    refPixels[0] = 50;
    refPixels[1] = 50;
    refPixels[2] = 50;
    refPixels[3] = 255;

    // Place a matching drawn stroke at index 0 (alpha > 50, luma < 200)
    drawPixels[0] = 20;
    drawPixels[1] = 20;
    drawPixels[2] = 20;
    drawPixels[3] = 255;

    const result = calculateDifferenceMap(refPixels, drawPixels, width, height);

    expect(result.image).toBeDefined();
    expect(result.matchScore).toBe(100); // 1 drawn pixel, 1 match = 100%
  });

  test("flags deviating lines in terracotta red and decreases matchScore", () => {
    const refPixels = new Uint8Array(pixelCount);
    const drawPixels = new Uint8Array(pixelCount);

    refPixels.fill(255); // Reference has no edge at index 0 (luma = 255)
    drawPixels.fill(255);

    // User draws an erroneous stroke at index 0 where reference is blank
    drawPixels[0] = 30;
    drawPixels[1] = 30;
    drawPixels[2] = 30;
    drawPixels[3] = 255;

    const result = calculateDifferenceMap(refPixels, drawPixels, width, height);

    expect(result.image).toBeDefined();
    expect(result.matchScore).toBe(0); // 1 drawn pixel, 0 match = 0%
  });

  test("returns default config with split, onion, and plumb line parameters", () => {
    expect(DEFAULT_COMPARISON_CONFIG.mode).toBe("split");
    expect(DEFAULT_COMPARISON_CONFIG.splitPosition).toBe(0.5);
    expect(DEFAULT_COMPARISON_CONFIG.onionOpacity).toBe(0.5);
    expect(DEFAULT_COMPARISON_CONFIG.showPlumbLines).toBe(true);
    expect(DEFAULT_COMPARISON_CONFIG.plumbX).toBe(0.5);
    expect(DEFAULT_COMPARISON_CONFIG.plumbY).toBe(0.45);
  });
});
