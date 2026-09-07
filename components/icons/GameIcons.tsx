// Единый набор простых однострочных SVG-иконок (в духе Lucide — та же
// конвенция, что и в components/CategoryIcon.tsx: viewBox 0 0 16 16,
// currentColor, тонкий stroke). Изначально — только для игровой/
// геймификационной части (уровни в lib/wrench-score.ts, достижения в
// lib/achievements.ts), но набор общий и переиспользуется везде, где
// раньше в данных или разметке был эмодзи-символ вместо иконки —
// например lib/disciplines.ts. Раньше все эти места хранили эмодзи
// прямо в данных (🔧⚙️🚀⭐👑⚡🔥🗡💎🎯🏆🔍🎨💜🧪 и т.д.) — эмодзи убираем
// отовсюду, поэтому данные теперь хранят строковый id иконки, а
// рендерят его через <GameIcon id={...} />.
//
// Проверено визуально: рендерил этот набор в отдельном HTML и смотрел
// скриншотом (headless Chromium) прежде чем сохранять — часть путей,
// которые выглядели двусмысленно (шестерёнка читалась как солнце, меч
// как факел), переделаны по факту, а не на глаз в коде.

interface IconProps {
  className?: string;
  size?: number;
}

export type GameIconId =
  | "wrench" | "gear" | "rocket" | "star" | "sparkle" | "crown"
  | "lightning" | "fire" | "sword" | "diamond" | "target"
  | "trophy" | "magnifier" | "palette" | "heart" | "flask";

const icons: Record<GameIconId, (p: IconProps) => JSX.Element> = {
  wrench: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M9.8 4.2a.9.9 0 000 1.27l1.07 1.06a.9.9 0 001.26 0l2.51-2.5a4 4 0 01-5.3 5.3l-4.6 4.6a1.4 1.4 0 11-2-2l4.6-4.6a4 4 0 015.3-5.3l-2.51 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  gear: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M8 1.5l5.2 3v7l-5.2 3-5.2-3v-7l5.2-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  ),
  rocket: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M8 2c1.6 1 2.6 3 2.6 5.3 0 1.6-.5 3.3-1.3 4.4l-1.3 1.6-1.3-1.6C5.9 10.6 5.4 8.9 5.4 7.3 5.4 5 6.4 3 8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <circle cx="8" cy="6.6" r="1" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5.4 9.6L3.6 11v2l2.2-1.3M10.6 9.6L12.4 11v2l-2.2-1.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 13.3l1 1.6 1-1.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  star: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M8 1.6l1.8 3.8 4.1.5-3 2.9.7 4.2L8 11l-3.6 2 .7-4.2-3-2.9 4.1-.5L8 1.6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  sparkle: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M8 1.5c.4 2.6 1.4 4.1 4 4.5-2.6.4-3.6 1.9-4 4.5-.4-2.6-1.4-4.1-4-4.5 2.6-.4 3.6-1.9 4-4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M12.5 10.8c.15 1 .55 1.6 1.5 1.7-.95.15-1.35.7-1.5 1.7-.15-1-.55-1.55-1.5-1.7.95-.1 1.35-.7 1.5-1.7z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
    </svg>
  ),
  crown: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M2.5 6l2.3 2 3.2-4.5 3.2 4.5L13.5 6 12.3 12H3.7L2.5 6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M3.7 12h8.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  lightning: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M9 1.5L3.5 9h3.2l-1 5.5L11.5 7H8.3l1-5.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  fire: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M8 14c-2.5 0-4.2-1.7-4.2-4 0-1.7 1-3 1.7-4.2.3 1 .9 1.6 1.5 1.9-.2-1.8.3-3.5 1.5-4.7.6 1.6.6 2.6 1.6 3.5.7.6 1.1 1.5 1.1 2.5 0 .5-.1 1-.3 1.4.6-.4 1-1.1 1.1-1.9.9 1 1.2 2.1 1.2 3 0 2.1-1.7 3.5-3.4 3.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  sword: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M13 2.5L5.3 10.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M7 8.5L4.2 11.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M4.2 11.3l-1.7 1.7M2.5 11.3l1.7 1.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  diamond: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M4.5 2.5h7l3 4.5-6.5 6.5L1.5 7l3-4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M1.5 7h11M6 2.5L8 7l-1.5 6.5M10 2.5L8 7l1.5 6.5" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
    </svg>
  ),
  target: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="8" cy="8" r="3.3" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="8" cy="8" r="0.9" fill="currentColor"/>
    </svg>
  ),
  trophy: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M4 2.5h8v3a4 4 0 01-8 0v-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M4 3.5H2.2c0 1.8.8 3 1.8 3.4M12 3.5h1.8c0 1.8-.8 3-1.8 3.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M8 9.5v2M6 13.5h4M6.5 11.5h3v2h-3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
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
      <path d="M8 2C4.7 2 2 4.5 2 8.2 2 10.5 3.4 12 5.3 12c.7 0 1-.4 1-1s-.4-.9-.4-1.6c0-.9.9-1.4 1.9-1.4H10c2.2 0 4-1.4 4-3.6C14 2.9 11.3 2 8 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="5.2" cy="6" r="0.8" fill="currentColor"/>
      <circle cx="7.5" cy="4.3" r="0.8" fill="currentColor"/>
      <circle cx="10.2" cy="5.3" r="0.8" fill="currentColor"/>
    </svg>
  ),
  heart: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M8 13.5s-5.2-3.2-5.2-7A2.9 2.9 0 018 4.8 2.9 2.9 0 0113.2 6.5c0 3.8-5.2 7-5.2 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  ),
  flask: ({ className = "", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M6.5 1.5v5.3L2.8 12a1.5 1.5 0 001.3 2.3h7.8a1.5 1.5 0 001.3-2.3L9.5 6.8V1.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M5.5 1.5h5M4.5 10h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
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
      <path d="M8 1.6l1.8 3.8 4.1.5-3 2.9.7 4.2L8 11l-3.6 2 .7-4.2-3-2.9 4.1-.5L8 1.6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
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
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M8 7.2v4M8 5.3v.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
