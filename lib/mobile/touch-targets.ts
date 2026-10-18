/**
 * Минимальные размеры области нажатия. Источники: Apple Human Interface
 * Guidelines (44x44 pt), Material Design (48x48 dp), WCAG 2.2 SC 2.5.8 (24x24 CSS px,
 * уровень AA, с исключением по расстоянию) и WCAG 2.1 SC 2.5.5 (44x44 CSS px, уровень AAA).
 * Логические единицы dp, pt и CSS px считаются равными: так их сравнивают на практике.
 */
export type RuleId = "apple" | "material" | "wcag-aa" | "wcag-aaa";

export interface Rule {
  id: RuleId;
  label: string;
  labelRu: string;
  min: number;
  unit: string;
}

export const RULES: Rule[] = [
  { id: "apple", label: "Apple HIG", labelRu: "Apple HIG", min: 44, unit: "pt" },
  { id: "material", label: "Material Design", labelRu: "Material Design", min: 48, unit: "dp" },
  { id: "wcag-aa", label: "WCAG 2.2 AA (2.5.8)", labelRu: "WCAG 2.2 AA (2.5.8)", min: 24, unit: "CSS px" },
  { id: "wcag-aaa", label: "WCAG 2.1 AAA (2.5.5)", labelRu: "WCAG 2.1 AAA (2.5.5)", min: 44, unit: "CSS px" },
];

export interface RuleResult {
  rule: Rule;
  pass: boolean;
  /** Сколько логических единиц не хватает до минимума по меньшей стороне (0, если хватает). */
  shortfall: number;
  /** Для WCAG AA: пройдено только благодаря расстоянию до соседей. */
  viaSpacing: boolean;
  /** Сколько добавить отступа с каждой стороны меньшей стороны, чтобы дотянуть до минимума. */
  paddingPerSide: number;
}

export interface TargetInput {
  width: number;
  height: number;
  /** Расстояние до ближайшей соседней цели такого же размера, в логических единицах. */
  gap: number;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Переводит физические пиксели в логические единицы по масштабу плотности. */
export function toLogical(value: number, unit: "logical" | "px", scale: number): number {
  if (unit === "logical") return value;
  return scale > 0 ? value / scale : NaN;
}

export function checkTarget(input: TargetInput): RuleResult[] {
  const side = Math.min(input.width, input.height);
  return RULES.map((rule) => {
    const bySize = side >= rule.min;
    let viaSpacing = false;
    // Исключение WCAG 2.5.8: цель меньше 24 пройдёт, если круг диаметром 24 с центром в её
    // середине не пересекает соседей. Для соседа того же размера в ряду: центры на расстоянии
    // side + gap, а круги не должны касаться: side + gap >= 24.
    if (rule.id === "wcag-aa" && !bySize && side > 0 && side + input.gap >= rule.min) viaSpacing = true;
    const pass = bySize || viaSpacing;
    const shortfall = bySize ? 0 : round1(rule.min - side);
    return { rule, pass, shortfall, viaSpacing, paddingPerSide: bySize ? 0 : round1((rule.min - side) / 2) };
  });
}
