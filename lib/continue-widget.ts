import { ChallengeRole } from "@/lib/challenges/types";
import { TRAINER_EXERCISES, TRAINER_CATEGORIES, TrainerCategory } from "@/lib/trainer/exercises";

// ═══════════════════════════════════════════════════════════════
// «Продолжить с места» — чистая логика выбора, отдельно от
// ContinueWidget.tsx (components не могут быть протестированы без
// браузера — эта функция может, тем же приёмом, что уже у
// checkAchievements() в lib/achievements.ts и parseCollectionFile() в
// lib/mock-api/parse-collection.ts). Компонент только достаёт сырые
// строки из Supabase и строит href/иконку/текст вокруг результата.
//
// Порядок приоритета — из самой идеи (ROADMAP-BRAINSTORM.md, пункт про
// retention): недорешённый челлендж → недопройденный трек Trainer →
// давно не открытый Workbench. Источники не сопоставимы по "свежести"
// напрямую (время попытки челленджа, время решения упражнения и время
// правки Workbench — разные шкалы), поэтому вместо общего ранжирования
// по дате берём первый непустой источник в этом фиксированном порядке.

export const WORKBENCH_STALE_DAYS = 14;

export interface TrainerProgressRow {
  exercise_id: string;
  solved_at: string;
}

export interface LatestWorkbenchRow {
  name: string;
  tool_slugs: string[];
  updated_at: string;
}

export type ContinueCandidate =
  | { kind: "challenge"; role: ChallengeRole }
  | { kind: "trainer"; category: TrainerCategory; categoryLabel: string; categoryLabelRu: string; solved: number; total: number }
  | { kind: "workbench"; name: string; toolCount: number };

export function pickContinueCandidate(opts: {
  // null — либо нет ни одной незакрытой попытки, либо она есть, но без
  // читаемой роли (сломанный join) — оба случая просто пропускаем этот
  // источник, не роняя всю функцию.
  unsolvedChallengeRole: ChallengeRole | null;
  trainerProgress: TrainerProgressRow[];
  // null — у пользователя вообще нет ни одного Workbench.
  latestWorkbench: LatestWorkbenchRow | null;
  now?: number; // для тестов — по умолчанию текущее время
  staleDays?: number; // для тестов — по умолчанию WORKBENCH_STALE_DAYS
}): ContinueCandidate | null {
  const now = opts.now ?? Date.now();
  const staleDays = opts.staleDays ?? WORKBENCH_STALE_DAYS;

  // 1) Недорешённый челлендж — самый сильный сигнал: человек уже
  // пробовал и не сдался.
  if (opts.unsolvedChallengeRole) {
    return { kind: "challenge", role: opts.unsolvedChallengeRole };
  }

  // 2) Недопройденный трек Trainer — категория, где решена хотя бы одна
  // задача, но не все. Среди таких берём ту, что трогали позже всего
  // (по solved_at самого свежего решённого упражнения в категории), а
  // не первую по списку — так подсказка совпадает с тем, чем человек
  // реально занимался последним.
  if (opts.trainerProgress.length > 0) {
    const solvedIds = new Set(opts.trainerProgress.map((r) => r.exercise_id));
    const lastSolvedAt = new Map(opts.trainerProgress.map((r) => [r.exercise_id, r.solved_at]));
    let best: { category: TrainerCategory; solved: number; total: number; lastTouch: string } | null = null;
    for (const cat of TRAINER_CATEGORIES) {
      const inCat = TRAINER_EXERCISES.filter((e) => e.category === cat.id);
      const solvedInCat = inCat.filter((e) => solvedIds.has(e.id));
      if (solvedInCat.length === 0 || solvedInCat.length >= inCat.length) continue; // не начат или уже весь пройден
      const lastTouch = solvedInCat.reduce((max, e) => {
        const t = lastSolvedAt.get(e.id) ?? "";
        return t > max ? t : max;
      }, "");
      if (!best || lastTouch > best.lastTouch) best = { category: cat.id, solved: solvedInCat.length, total: inCat.length, lastTouch };
    }
    if (best) {
      const meta = TRAINER_CATEGORIES.find((c) => c.id === best!.category)!;
      return { kind: "trainer", category: best.category, categoryLabel: meta.label, categoryLabelRu: meta.labelRu, solved: best.solved, total: best.total };
    }
  }

  // 3) Давно не открытый Workbench — самый слабый сигнал, поэтому
  // последний в очереди. Нет отдельной колонки "когда открывали" (см.
  // supabase/workbench-schema.sql) — updated_at используется как
  // приближение ("давно не правили" ~ "давно не открывали"), и
  // смотрим только на САМЫЙ свежий workbench: если даже он не правился
  // staleDays дней, остальные и подавно, сравнивать все ради этого
  // смысла нет (вызывающий код уже отдаёт сюда только самый свежий).
  const wb = opts.latestWorkbench;
  if (wb && wb.tool_slugs.length > 0) {
    const daysSince = (now - new Date(wb.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince >= staleDays) {
      return { kind: "workbench", name: wb.name, toolCount: wb.tool_slugs.length };
    }
  }

  return null;
}
