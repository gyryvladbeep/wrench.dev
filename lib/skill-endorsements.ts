// ═══════════════════════════════════════════════════════════════
// Чистая логика peer-эндорсементов (roadmap item 2) — группировка
// строк из skill_endorsements по тегу и форматирование списка имён
// эндорсеров. Вынесено из components/profile/SkillEndorsements.tsx по
// тому же принципу, что и lib/salary-report.ts: сетевые вызовы и
// рендер остаются в компоненте, а логику, которую можно проверить без
// браузера/DOM, — сюда, под обычные Playwright-тесты без {page}
// (см. tests/skill-endorsements.spec.ts).
// ═══════════════════════════════════════════════════════════════

export interface EndorsementRow {
  skill_tag:   string;
  endorser_id: string;
}

export function groupEndorsementsByTag(rows: EndorsementRow[]): Map<string, EndorsementRow[]> {
  const map = new Map<string, EndorsementRow[]>();
  for (const row of rows) {
    const list = map.get(row.skill_tag);
    if (list) list.push(row);
    else map.set(row.skill_tag, [row]);
  }
  return map;
}

export function isEndorsedByViewer(rows: EndorsementRow[], viewerId: string | null | undefined): boolean {
  if (!viewerId) return false;
  return rows.some((r) => r.endorser_id === viewerId);
}

// Roadmap item 1 (Skill-badges 2.0) — эти два счётчика идут в
// checkAchievements() (lib/achievements.ts) как "сложнее подделать"
// сигнал: сами эндорсементы уже защищены анти-спам гейтом
// profile_views на уровне RLS (см. supabase/skill-endorsements-migration.sql
// — эндорснуть можно только того, чей профиль реально открывал), так
// что бейдж на их основе нельзя накрутить, прогнав задачи через AI, в
// отличие от "прошёл N задач". distinct, а не rows.length — один и тот
// же человек может эндорснуть несколько разных навыков, это не должно
// считаться как несколько эндорсеров.
export function countDistinctEndorsers(rows: EndorsementRow[]): number {
  return new Set(rows.map((r) => r.endorser_id)).size;
}

export function countDistinctEndorsedSkills(rows: EndorsementRow[]): number {
  return new Set(rows.map((r) => r.skill_tag)).size;
}

// Сколько имён показываем строкой текста, прежде чем свернуть остаток
// в "и ещё N" — тот же потолок, что MAX_PINNED/MAX_STACK_TAGS в
// остальном профиле: витрина конечная, не резиновая.
const MAX_NAMES_SHOWN = 3;

// "и ещё N" по-русски не требует согласования числа с существительным
// (в отличие от formatResponseCount в lib/i18n/format.ts) — "ещё" не
// склоняется, поэтому один и тот же суффикс подходит для любого N.
export function formatEndorserNames(names: string[], isRu: boolean): string {
  if (names.length === 0) return "";
  const shown = names.slice(0, MAX_NAMES_SHOWN);
  const rest = names.length - shown.length;
  const joined = shown.join(", ");
  if (rest <= 0) return joined;
  return isRu ? `${joined} и ещё ${rest}` : `${joined} and ${rest} more`;
}
