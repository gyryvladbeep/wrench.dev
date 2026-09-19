import { test, expect } from "@playwright/test";
import {
  PORTFOLIO_SECTIONS,
  DEFAULT_PORTFOLIO_SECTIONS,
  normalizePortfolioSections,
  togglePortfolioSection,
  orderedEnabledSections,
  buildPortfolioFileName,
  resolvePortfolioText,
} from "@/lib/portfolio";

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
