/** Результат проверки: уровень, стабильный код (для тестов) и текст на двух языках. */
export type FindingLevel = "error" | "warning" | "info";

export interface Finding {
  code: string;
  level: FindingLevel;
  en: string;
  ru: string;
}

export function finding(level: FindingLevel, code: string, en: string, ru: string): Finding {
  return { code, level, en, ru };
}

const ORDER: Record<FindingLevel, number> = { error: 0, warning: 1, info: 2 };

export function sortFindings(list: Finding[]): Finding[] {
  return [...list].sort((a, b) => ORDER[a.level] - ORDER[b.level]);
}
