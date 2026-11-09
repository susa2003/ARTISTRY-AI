import {
  REFERENCE_LIBRARY,
  getReferenceImageUri,
  type ReferenceItem,
} from "../ReferenceLibrary";

describe("ReferenceLibrary", () => {
  test("contains curated copyright-free reference items across all 5 categories", () => {
    expect(REFERENCE_LIBRARY.length).toBeGreaterThanOrEqual(8);

    const categories = new Set(REFERENCE_LIBRARY.map((item) => item.category));
    expect(categories.has("portraits")).toBe(true);
    expect(categories.has("anatomy")).toBe(true);
    expect(categories.has("animals")).toBe(true);
    expect(categories.has("landscapes")).toBe(true);
    expect(categories.has("master_studies")).toBe(true);

    REFERENCE_LIBRARY.forEach((item) => {
      expect(item.id).toMatch(/^ref-/);
      expect(item.title.length).toBeGreaterThan(3);
      expect(item.aspectRatio).toBeGreaterThan(0);
      expect(item.suggestedTools.length).toBeGreaterThan(0);
      expect(["beginner", "intermediate", "advanced"]).toContain(item.difficulty);
      expect(item.tags.length).toBeGreaterThan(0);
    });
  });

  test("bundles valid offline procedural SVG vector templates for every item", () => {
    REFERENCE_LIBRARY.forEach((item) => {
      expect(item.fallbackSvgUri).toBeDefined();
      expect(item.fallbackSvgUri.startsWith("data:image/svg+xml;utf8,")).toBe(true);
      const decodedSvg = decodeURIComponent(item.fallbackSvgUri.replace("data:image/svg+xml;utf8,", ""));
      expect(decodedSvg).toContain("<svg");
      expect(decodedSvg).toContain("</svg>");
    });
  });

  test("getReferenceImageUri resolves remote URL or offline fallback based on preference", () => {
    const item = REFERENCE_LIBRARY[0]!;

    // Online mode: returns remote URI
    const onlineUri = getReferenceImageUri(item, false);
    expect(onlineUri).toBe(item.uri);

    // Offline mode: returns SVG vector data URI
    const offlineUri = getReferenceImageUri(item, true);
    expect(offlineUri).toBe(item.fallbackSvgUri);
  });
});
