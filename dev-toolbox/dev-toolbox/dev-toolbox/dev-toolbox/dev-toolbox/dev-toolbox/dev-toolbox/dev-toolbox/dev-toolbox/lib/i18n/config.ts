export const locales = ["en", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: string | undefined | null): value is Locale {
  if (!value) return false;
  return (locales as readonly string[]).includes(value);
}

/** Builds a URL path for a given locale.
 *  English (default) stays at the root with no prefix — /tools/json-formatter
 *  Russian lives under /ru — /ru/tools/json-formatter */
export function localePath(locale: Locale, path: string): string {
  const normalized = path === "/" ? "" : path;
  return locale === defaultLocale ? normalized || "/" : `/ru${normalized}`;
}
