import {
  DEFAULT_SHADING_CONFIG,
  FIVE_VALUES,
  processShadingImage,
  type ShadingConfig,
} from "../ShadingEngine";

describe("ShadingEngine", () => {
  test("defines all 5 canonical tonal drawing values", () => {
    expect(FIVE_VALUES.length).toBe(5);
    expect(FIVE_VALUES[0]?.name).toBe("Highlight");
    expect(FIVE_VALUES[1]?.name).toContain("Halftone");
    expect(FIVE_VALUES[2]?.name).toContain("Core Shadow");
    expect(FIVE_VALUES[3]?.name).toContain("Reflected Light");
    expect(FIVE_VALUES[4]?.name).toContain("Cast Shadow");

    FIVE_VALUES.forEach((v) => {
      expect(v.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(v.range).toBeDefined();
    });
  });

  test("processes pixels into 5-value form shading with directional light bias", () => {
    const width = 10;
    const height = 10;
    const pixels = new Uint8Array(width * height * 4);

    // Populate a gradient of luma pixels
    for (let i = 0; i < pixels.length; i += 4) {
      const idx = i / 4;
      const val = Math.floor((idx / (width * height)) * 255);
      pixels[i] = val;     // R
      pixels[i + 1] = val; // G
      pixels[i + 2] = val; // B
      pixels[i + 3] = 255; // A
    }

    const config: ShadingConfig = {
      ...DEFAULT_SHADING_CONFIG,
      lightAngle: 90, // Light from bottom
      valueSteps: 5,
    };

    const result = processShadingImage(pixels, width, height, config);

    expect(result.image).toBeDefined();
    expect(result.stats).toBeDefined();
    expect(result.stats.shadows + result.stats.midtones + result.stats.highlights).toBe(100);
    expect(result.stats.shadows).toBeGreaterThanOrEqual(0);
    expect(result.stats.highlights).toBeGreaterThanOrEqual(0);
  });

  test("handles 3-value tonal simplification study", () => {
    const width = 8;
    const height = 8;
    const pixels = new Uint8Array(width * height * 4);
    pixels.fill(128); // Uniform gray

    const config: ShadingConfig = {
      ...DEFAULT_SHADING_CONFIG,
      valueSteps: 3,
    };

    const result = processShadingImage(pixels, width, height, config);
    expect(result.image).toBeDefined();
    expect(result.stats.shadows + result.stats.midtones + result.stats.highlights).toBe(100);
  });
});
