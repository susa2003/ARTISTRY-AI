import {
  REFERENCE_CATEGORIES,
  fetchGeneratedReferences,
  removeGeneratedReference,
  requestReferenceGeneration,
} from "../ReferenceGeneratorEngine";

describe("ReferenceGeneratorEngine", () => {
  test("defines 11 curated categories", () => {
    expect(REFERENCE_CATEGORIES.length).toBe(11);
    const ids = REFERENCE_CATEGORIES.map((c) => c.id);
    expect(ids).toContain("portraits");
    expect(ids).toContain("anime");
    expect(ids).toContain("anatomy");
    expect(ids).toContain("handsfeet");
    expect(ids).toContain("animals");
    expect(ids).toContain("stilllife");
    expect(ids).toContain("landscapes");
    expect(ids).toContain("architecture");
    expect(ids).toContain("vehicles");
    expect(ids).toContain("objects");
    expect(ids).toContain("flowers");
  });

  test("generates and stores offline reference templates", async () => {
    const record = await requestReferenceGeneration({
      category: "portraits",
      prompt: "Female head 3/4 turn study",
      style: "classical",
    });

    expect(record.id).toBeDefined();
    expect(record.category).toBe("portraits");
    expect(record.uri).toBeDefined();

    const all = await fetchGeneratedReferences();
    expect(all.length).toBeGreaterThan(0);

    await removeGeneratedReference(record.id);
    const updated = await fetchGeneratedReferences();
    expect(updated.find((r) => r.id === record.id)).toBeUndefined();
  });
});
