import { Locale } from "./config";

/** Pluralizes "tool(s)" for a count. English only needs singular/plural;
 *  Russian needs the 1 / 2–4 / 5+ distinction, which a flat dictionary
 *  string can't express, so this is a function instead of a translated
 *  string. */
export function formatToolCount(count: number, locale: Locale): string {
  if (locale === "ru") {
    const mod10 = count % 10;
    const mod100 = count % 100;
    let word = "инструментов";
    if (mod100 >= 11 && mod100 <= 14) word = "инструментов";
    else if (mod10 === 1) word = "инструмент";
    else if (mod10 >= 2 && mod10 <= 4) word = "инструмента";
    return `${count} ${word}`;
  }
  return `${count} tool${count === 1 ? "" : "s"}`;
}

/** "{Category} Tools" reads naturally in English; the literal Russian
 *  word-for-word equivalent doesn't, so the order flips instead of
 *  reusing one template for both locales. */
export function categoryHeading(categoryName: string, locale: Locale): string {
  return locale === "ru" ? `Инструменты: ${categoryName}` : `${categoryName} Tools`;
}
