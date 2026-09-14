"use client";
import { GameIcon, type GameIconId } from "@/components/icons/GameIcons";

export interface StatHudItem {
  id:           string;
  icon:         GameIconId;
  value:        string;
  label:        string;
  // Цвет иконки-чипа — по умолчанию нейтральный text-muted, отдельные
  // статы (сейчас — активная серия) выделяются собственным цветом, чтобы
  // не превращать всю полоску в разноцветную мешанину.
  accentClass?: string;
  // Маленькая пульсирующая точка на чипе — сейчас только для активной
  // серии (current_streak > 0), использует уже существующий .pulse-dot
  // из globals.css (раньше нигде не применялся).
  pulsing?:     boolean;
}

// Замена прежним четырём одинаковым карточкам "Решено/Очки/Серия/AI" —
// плотная горизонтальная HUD-полоска вместо grid из отдельных плиток
// с пустым местом внутри каждой. На мобильном — 2 колонки, на sm+ — все
// 4 в один ряд.
export function StatsHud({ items }: { items: StatHudItem[] }) {
  return (
    <div className="mb-6 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface/60 sm:grid-cols-4 sm:divide-y-0">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
          <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-canvas ${item.accentClass ?? "text-text-muted"}`}>
            <GameIcon id={item.icon} size={15} />
            {item.pulsing && (
              <span className="pulse-dot absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-orange-400 text-orange-400" />
            )}
          </span>
          <div className="min-w-0">
            <p className="font-mono text-lg font-bold leading-none tabular-nums text-text-primary">{item.value}</p>
            <p className="mt-1 truncate text-[11px] leading-none text-text-muted">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
