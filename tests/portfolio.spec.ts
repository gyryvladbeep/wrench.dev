import { test, expect } from "@playwright/test";
import {
  PORTFOLIO_SECTIONS,
  DEFAULT_PORTFOLIO_SECTIONS,
  normalizePortfolioSections,
  togglePortfolioSection,
  orderedEnabledSections,
  buildPortfolioFileName,
  resolvePortfolioText,
  PORTFOLIO_THEMES,
  DEFAULT_PORTFOLIO_THEME,
  getPortfolioTheme,
  themeSectionLabel,
  addExperienceEntry,
  removeExperienceEntry,
  addProjectEntry,
  removeProjectEntry,
  MAX_EXPERIENCE_ENTRIES,
  MAX_PROJECT_ENTRIES,
  PortfolioExperienceEntry,
  PortfolioProjectEntry,
} from "@/lib/portfolio";

function makeExperience(id: string): PortfolioExperienceEntry {
  return { id, company: "Acme", position: "QA Engineer", period: "2023 — now", description: "" };
}
function makeProject(id: string): PortfolioProjectEntry {
  return { id, name: "Wrench-Branch", description: "", tech: "Next.js", url: null };
}

test.describe("normalizePortfolioSections", () => {
  test("drops unknown ids and duplicates, keeps input order", () => {
    expect(normalizePortfolioSections(["bio", "not-a-real-section", "bio", "tagline"]))
      .toEqual(["bio", "tagline"]);
  });

  test("treats null/undefined as empty", () => {
    expect(normalizePortfolioSections(null)).toEqual([]);
    expect(normalizePortfolioSections(undefined)).toEqual([]);
  });

  test("every catalog id round-trips", () => {
    const allIds = PORTFOLIO_SECTIONS.map((s) => s.id);
    expect(normalizePortfolioSections(allIds)).toEqual(allIds);
  });
});

test.describe("togglePortfolioSection", () => {
  test("adds a section that isn't present", () => {
    expect(togglePortfolioSection([], "bio")).toEqual(["bio"]);
    expect(togglePortfolioSection(["tagline"], "bio")).toEqual(["tagline", "bio"]);
  });

  test("removes a section that is present", () => {
    expect(togglePortfolioSection(["tagline", "bio"], "bio")).toEqual(["tagline"]);
  });

  test("sanitizes existing garbage before toggling", () => {
    expect(togglePortfolioSection(["bio", "bio", "junk"], "tagline")).toEqual(["bio", "tagline"]);
  });
});

test.describe("orderedEnabledSections", () => {
  test("returns sections in catalog order regardless of storage order", () => {
    const result = orderedEnabledSections(["badges", "tagline", "score"]);
    expect(result.map((s) => s.id)).toEqual(["tagline", "score", "badges"]);
  });

  test("empty/null input yields no sections", () => {
    expect(orderedEnabledSections([])).toEqual([]);
    expect(orderedEnabledSections(null)).toEqual([]);
  });

  test("DEFAULT_PORTFOLIO_SECTIONS enables every catalog section", () => {
    expect(orderedEnabledSections(DEFAULT_PORTFOLIO_SECTIONS)).toEqual(PORTFOLIO_SECTIONS);
  });
});

test.describe("buildPortfolioFileName", () => {
  test("builds a safe lowercase filename", () => {
    expect(buildPortfolioFileName("GyrySeksa", "png")).toBe("wrench-branch-portfolio-gyryseksa.png");
  });

  test("strips characters outside [a-z0-9_-]", () => {
    expect(buildPortfolioFileName("vlad.grekov!!", "pdf")).toBe("wrench-branch-portfolio-vlad-grekov.pdf");
  });

  test("falls back to 'profile' when nothing safe remains", () => {
    expect(buildPortfolioFileName("!!!", "png")).toBe("wrench-branch-portfolio-profile.png");
  });
});

test.describe("resolvePortfolioText", () => {
  test("uses the override when it's non-empty", () => {
    expect(resolvePortfolioText("Custom headline", "Fallback")).toBe("Custom headline");
  });

  test("falls back when override is null/undefined", () => {
    expect(resolvePortfolioText(null, "Fallback")).toBe("Fallback");
    expect(resolvePortfolioText(undefined, "Fallback")).toBe("Fallback");
  });

  test("falls back when override is empty or whitespace-only", () => {
    expect(resolvePortfolioText("", "Fallback")).toBe("Fallback");
    expect(resolvePortfolioText("   ", "Fallback")).toBe("Fallback");
  });

  test("trims surrounding whitespace from a real override", () => {
    expect(resolvePortfolioText("  Custom  ", "Fallback")).toBe("Custom");
  });
});

test.describe("getPortfolioTheme", () => {
  test("returns the matching theme for a known id", () => {
    expect(getPortfolioTheme("matrix")?.id).toBe("matrix");
  });

  test("falls back to the default theme for an unknown/missing id", () => {
    expect(getPortfolioTheme("not-a-real-theme").id).toBe(DEFAULT_PORTFOLIO_THEME);
    expect(getPortfolioTheme(null).id).toBe(DEFAULT_PORTFOLIO_THEME);
    expect(getPortfolioTheme(undefined).id).toBe(DEFAULT_PORTFOLIO_THEME);
  });

  test("every theme has all ten entries with a unique id", () => {
    expect(PORTFOLIO_THEMES).toHaveLength(10);
    expect(new Set(PORTFOLIO_THEMES.map((t) => t.id)).size).toBe(10);
  });
});

test.describe("themeSectionLabel", () => {
  const taglineSection = PORTFOLIO_SECTIONS.find((s) => s.id === "tagline")!;

  test("uses the theme's override when one exists", () => {
    expect(themeSectionLabel("fantasy", taglineSection, true)).toBe("Титул");
    expect(themeSectionLabel("fantasy", taglineSection, false)).toBe("Title");
  });

  test("falls back to the default catalog label when the theme has no override", () => {
    expect(themeSectionLabel("classic", taglineSection, true)).toBe(taglineSection.labelRu);
    expect(themeSectionLabel("minimal", taglineSection, false)).toBe(taglineSection.label);
  });
});

test.describe("addExperienceEntry / removeExperienceEntry", () => {
  test("appends a new entry", () => {
    const result = addExperienceEntry([makeExperience("1")], makeExperience("2"));
    expect(result.map((e) => e.id)).toEqual(["1", "2"]);
  });

  test("stops adding once the cap is reached", () => {
    const full = Array.from({ length: MAX_EXPERIENCE_ENTRIES }, (_, i) => makeExperience(String(i)));
    const result = addExperienceEntry(full, makeExperience("overflow"));
    expect(result).toHaveLength(MAX_EXPERIENCE_ENTRIES);
    expect(result.some((e) => e.id === "overflow")).toBe(false);
  });

  test("removes only the matching entry", () => {
    const result = removeExperienceEntry([makeExperience("1"), makeExperience("2")], "1");
    expect(result.map((e) => e.id)).toEqual(["2"]);
  });
});

test.describe("addProjectEntry / removeProjectEntry", () => {
  test("appends a new entry", () => {
    const result = addProjectEntry([makeProject("1")], makeProject("2"));
    expect(result.map((p) => p.id)).toEqual(["1", "2"]);
  });

  test("stops adding once the cap is reached", () => {
    const full = Array.from({ length: MAX_PROJECT_ENTRIES }, (_, i) => makeProject(String(i)));
    const result = addProjectEntry(full, makeProject("overflow"));
    expect(result).toHaveLength(MAX_PROJECT_ENTRIES);
    expect(result.some((p) => p.id === "overflow")).toBe(false);
  });

  test("removes only the matching entry", () => {
    const result = removeProjectEntry([makeProject("1"), makeProject("2")], "1");
    expect(result.map((p) => p.id)).toEqual(["2"]);
  });
});
