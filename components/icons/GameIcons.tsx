// Единый набор простых однострочных SVG-иконок (в духе Lucide — та же
// конвенция, что и в components/CategoryIcon.tsx: viewBox 0 0 16 16,
// currentColor, ОДНА толщина обводки на иконку, без заливок-акцентов).
// Изначально — только для игровой/геймификационной части (уровни в
// lib/wrench-score.ts, достижения в lib/achievements.ts), но набор общий
// и переиспользуется везде, где раньше в данных или разметке был
// эмодзи-символ вместо иконки — например lib/disciplines.ts. Раньше все
// эти места хранили эмодзи прямо в данных (🔧⚙️🚀⭐👑⚡🔥🗡💎🎯🏆🔍🎨💜🧪
// и т.д.) — эмодзи убираем отовсюду, поэтому данные теперь хранят
// строковый id иконки, а рендерят его через <GameIcon id={...} />.
//
// Ревизия 2: первая версия набора всё ещё читалась как эмодзи —
// причины были в непоследовательной толщине обводки внутри одной
// иконки, залитых декоративных точках (target, palette) и слишком
// буквальных пиктограммах (heart, sword). Правки: единая толщина
// обводки 1.4 на каждую иконку (без заливок, кроме StarIcon в
// активном состоянии), убраны все залитые точки, sword → flag,
// heart → medal (более абстрактный "бейдж", не сердечко), sparkle →
// абстрактный астериск вместо двух наложенных "блёсток".
//
// Проверено визуально: рендерил набор в отдельном HTML и смотрел
// скриншотом (headless Chromium) прежде чем сохранять.

interface IconProps {
  className?: string;
  size?: number;
}

export type GameIconId =
  | "wrench" | "gear" | "rocket" | "star" | "sparkle" | "crown"
  | "lightning" | "fire" | "flag" | "diamond" | "target"
  | "trophy" | "magnifier" | "palette" | "medal" | "flask" | "brackets";

const icons: Record<GameIconId, (p: IconProps) => JSX.Element> = {
  wrench: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M9.8 4.2a.9.9 0 000 1.27l1.07 1.06a.9.9 0 001.26 0l2.51-2.5a4 4 0 01-5.3 5.3l-4.6 4.6a1.4 1.4 0 11-2-2l4.6-4.6a4 4 0 015.3-5.3l-2.51 2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  gear: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M8 1.5l5.2 3v7l-5.2 3-5.2-3v-7l5.2-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  rocket: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M8 2c1.4 1.1 2.3 3 2.3 5 0 1.5-.5 3-1.3 4.1L8 12.3l-1-1.2C6.2 10 5.7 8.5 5.7 7c0-2 .9-3.9 2.3-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <circle cx="8" cy="6.6" r="1" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5.7 8.6L4 10v1.6l1.9-1.1M10.3 8.6L12 10v1.6l-1.9-1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  star: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M8 1.6l1.8 3.8 4.1.5-3 2.9.7 4.2L8 11l-3.6 2 .7-4.2-3-2.9 4.1-.5L8 1.6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  sparkle: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M8 1.5V14.5M2.7 4.75L13.3 11.25M13.3 4.75L2.7 11.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  crown: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M2.5 6l2.3 2 3.2-4.5 3.2 4.5L13.5 6 12.3 12H3.7L2.5 6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M3.7 12h8.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  lightning: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M9 1.5L3.5 9h3.2l-1 5.5L11.5 7H8.3l1-5.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  fire: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M8 14c-2.5 0-4.2-1.7-4.2-4 0-1.7 1-3 1.7-4.2.3 1 .9 1.6 1.5 1.9-.2-1.8.3-3.5 1.5-4.7.6 1.6.6 2.6 1.6 3.5.7.6 1.1 1.5 1.1 2.5 0 .5-.1 1-.3 1.4.6-.4 1-1.1 1.1-1.9.9 1 1.2 2.1 1.2 3 0 2.1-1.7 3.5-3.4 3.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  flag: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M4 14V2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M4 2.6h7.2l-2 2.7 2 2.7H4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  diamond: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M4.5 2.5h7l3 4.5-6.5 6.5L1.5 7l3-4.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M1.5 7h11M6 2.5L8 7l-1.5 6.5M10 2.5L8 7l1.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  target: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="8" cy="8" r="3.3" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="8" cy="8" r="0.9" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  trophy: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M4 2.5h8v3a4 4 0 01-8 0v-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M4 3.5H2.2c0 1.8.8 3 1.8 3.4M12 3.5h1.8c0 1.8-.8 3-1.8 3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M8 9.5v2M6 13.5h4M6.5 11.5h3v2h-3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  magnifier: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <circle cx="6.8" cy="6.8" r="4" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M9.8 9.8L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  palette: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M8 1.7a6.3 6.3 0 100 12.6c.9 0 1.5-.6 1.5-1.4 0-.4-.2-.7-.2-1.2 0-.8.6-1.3 1.5-1.3h1.1c1.5 0 2.6-1.2 2.6-2.7A6.3 6.3 0 008 1.7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <circle cx="5.4" cy="6.3" r="0.9" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="9.4" cy="4.6" r="0.9" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  medal: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <circle cx="8" cy="6.3" r="4.3" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5.7 9.8L4.8 14.5l3.2-1.8 3.2 1.8-.9-4.7" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  ),
  flask: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M6.5 1.5v5.3L2.8 12a1.5 1.5 0 001.3 2.3h7.8a1.5 1.5 0 001.3-2.3L9.5 6.8V1.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M5.5 1.5h5M4.5 10h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  // Code brackets — используется для Frontend-дисциплины/бейджа вместо
  // palette: инструменты этой группы (селекторы, форматирование,
  // кодирование) про код, а не про рисование, плюс форма геометричнее
  // и однозначнее на маленьком размере, чем "капля" палитры.
  brackets: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M6 3.5L2 8l4 4.5M10 3.5l4 4.5-4 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

export function GameIcon({ id, className = "", size = 16 }: { id: string; className?: string; size?: number }) {
  const Icon = icons[id as GameIconId];
  if (!Icon) return null;
  return <Icon className={className} size={size} />;
}

// Общая маленькая галочка — используем там, где раньше стоял символ "✓".
export function CheckIcon({ className = "", size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Звезда для «избранного» — outline по умолчанию, filled=true для
// активного состояния. Замена символа "★", который раньше стоял в
// нескольких местах профиля.
export function StarIcon({ className = "", size = 16, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"} className={className} aria-hidden>
      <path d="M8 1.6l1.8 3.8 4.1.5-3 2.9.7 4.2L8 11l-3.6 2 .7-4.2-3-2.9 4.1-.5L8 1.6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
}

// Крестик закрытия/скрытия — замена символа "✕", который раньше стоял
// на кнопках dismiss (например в RoleSelector).
export function CloseIcon({ className = "", size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

// Значок "информация" — замена символа "ℹ" (например в тостах).
export function InfoIcon({ className = "", size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 7.2v4M8 5.3v.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

// Стрелка влево — замена символа "👈" (например в JSON Mutator, пустое
// состояние "выбери поле слева").
export function ArrowLeftIcon({ className = "", size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Лампочка — замена символа "💡" в подсказках/советах ("как использовать").
export function LightbulbIcon({ className = "", size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M8 1.8a4 4 0 00-2 7.5c.5.3.8.9.8 1.5v.2h2.4v-.2c0-.6.3-1.2.8-1.5a4 4 0 00-2-7.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M6.7 13.3h2.6M7.1 14.7h1.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
