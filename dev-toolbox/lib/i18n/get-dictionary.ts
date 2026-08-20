import { Locale } from "./config";
import { Dictionary } from "./dictionary-types";
import { en } from "./dictionaries/en";
import { ru } from "./dictionaries/ru";

const dictionaries: Record<Locale, Dictionary> = { en, ru };

/** Plain synchronous lookup — dictionaries are static objects, so this is
 *  safe to call from server components, client components, and metadata
 *  functions alike, with no async/context plumbing needed.
 *  Always falls back to `en` so a missing/invalid locale never throws. */
export function getDictionary(locale: string): Dictionary {
  if (locale === "ru") return dictionaries.ru;
  return dictionaries.en;
}
