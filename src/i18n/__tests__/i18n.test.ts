import { en } from "../en";
import { ta } from "../ta";
import { getTranslation } from "../index";

describe("Bilingual Localization System (English & Tamil)", () => {
  it("should have identical key parity between English and Tamil dictionaries", () => {
    const enTools = Object.keys(en.tools);
    const taTools = Object.keys(ta.tools);
    expect(taTools.sort()).toEqual(enTools.sort());
    expect(enTools.length).toBe(25);
  });

  it("should return English translation by default", () => {
    const t = getTranslation("en");
    expect(t.app.title).toBe("ARTISTRY AI");
    expect(t.modes.beginner).toBe("Beginner Mode");
  });

  it("should return Tamil translation when requested", () => {
    const t = getTranslation("ta");
    expect(t.app.title).toBe("ஆர்ட்டிஸ்ட்ரி AI");
    expect(t.modes.beginner).toBe("தொடக்க நிலை முறை");
  });
});
