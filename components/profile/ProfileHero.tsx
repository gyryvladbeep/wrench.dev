"use client";
import { AvatarGlyph } from "@/components/profile/AvatarGlyph";
import { GameIcon } from "@/components/icons/GameIcons";
import { ExternalLinkIcon } from "@/components/icons/GameIcons";
import type { WrenchLevel } from "@/lib/wrench-score";
import type { BannerGradient } from "@/lib/profile-banners";

interface ProfileHeroProps {
  displayName:       string;
  username:          string;
  email:             string;
  tagline:           string | null;
  bio:               string;
  avatarColor:       string;
  avatarEmblem:      string | null;
  initials:          string;
  roleLabel:         string | null;
  isPro:             boolean;
  level:             WrenchLevel;
  score:             number;
  // null — пользователь не выбрал пресет в Settings → карточка падает
  // на бесплатный фон по умолчанию (свечение в цвет уровня, см. ниже).
  bannerGradient:    BannerGradient | null;
  publicProfileUrl:  string;
  isRu:              boolean;
  onSignOut:         () => void;
}

// "Карточка персонажа" — заменяет прежнюю тонкую шапку-полоску. Это же
// место — будущий слот под покупные фоны/скины профиля (см. обсуждение
// в чате): сегодня единственный "бесплатный скин" — тот же пресет
// baннера, что уже выбирается в Settings (lib/profile-banners.ts), а при
// его отсутствии — свечение в цвет текущего уровня Wrench Score вместо
// пустой полоски. Когда появятся покупные фоны, они лягут в тот же
// BannerGradient-подобный список и будут рендериться тем же путём —
// менять тут ничего не придётся, только откуда приходит `bannerGradient`.
export function ProfileHero({
  displayName, username, email, tagline, bio, avatarColor, avatarEmblem, initials,
  roleLabel, isPro, level, score, bannerGradient, publicProfileUrl, isRu, onSignOut,
}: ProfileHeroProps) {
  return (
    <div className="relative isolate mb-6 overflow-hidden rounded-2xl border border-border">
      {/* ═══ Фон — см. комментарий у типа выше ═══
          `isolate` на обёртке обязателен: без своего stacking context
          "-z-10" ниже сравнивается не с соседями внутри карточки, а с
          глобальным .cosmic-bg (position:fixed; z-index:-1 на уровне
          layout.tsx) — тогда -10 < -1 и фон карточки прячется ПОД
          непрозрачным звёздным фоном сайта, оставаясь невидимым. Тот же
          баг уже есть в hero на главной (app/[locale]/page.tsx, секция
          с -z-10 без isolate) — там он не в этой задаче, но затронет
          и её, если когда-нибудь у секции появится непрозрачный фон. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-surface" />
        {bannerGradient ? (
          <div className="absolute inset-0 opacity-90" style={{ background: bannerGradient.css }} />
        ) : (
          <>
            <div className="absolute left-[10%] top-[-45%] h-[340px] w-[440px] rounded-full blur-[110px]"
              style={{ background: level.color, opacity: 0.18 }} />
            <div className="absolute right-[-12%] bottom-[-70%] h-[280px] w-[280px] rounded-full bg-indigo-500/10 blur-[100px]" />
          </>
        )}
        {/* Затемнение снизу — имя/теги/чипы лежат в нижней части карточки
            (на мобильной раскладке — вообще весь текстовый блок), а фон
            над ними может быть чем угодно: и будущий покупной скин, и
            (уже сейчас) яркий bannerGradient — например "Amber / Violet"
            почти нечитаем без этого слоя (низкий контраст текста на
            салатовой зоне перехода между цветами). Тёмная растяжка снизу
            держит контраст при любом фоне, ничего не завязывая на
            конкретную палитру пресета. */}
        <div className="absolute inset-0 bg-gradient-to-t from-canvas/85 via-canvas/20 to-transparent" />
      </div>

      <button onClick={onSignOut}
        className="absolute right-4 top-4 rounded border border-red-500/20 bg-canvas/60 px-3 py-1.5 text-xs text-red-400 backdrop-blur transition-colors hover:bg-red-500/10">
        {isRu ? "Выйти" : "Sign out"}
      </button>

      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:p-6">
        {/* Avatar + светящееся "гало" в цвет текущего уровня — тот же
            приём, что у ранговых рамок в играх, только на CSS. */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 -z-10 rounded-full blur-md" style={{ background: level.color, opacity: 0.5 }} />
          <AvatarGlyph
            color={avatarColor}
            emblemId={avatarEmblem}
            initials={initials}
            sizeClass="h-24 w-24 text-4xl"
            className="border-4 border-canvas"
          />
          {isPro && (
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-canvas bg-violet-500 text-xs font-bold text-white">
              P
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary">{displayName}</h1>
            {isPro && (
              <span className="rounded border border-violet-500/30 bg-violet-500/10 px-2 py-px text-xs font-medium text-violet-400">Pro</span>
            )}
          </div>
          {username && <p className="text-sm text-text-muted">@{username}</p>}
          {tagline && <p className="mt-1 text-sm font-medium text-accent">{tagline}</p>}
          {bio && <p className="mt-1 max-w-md text-sm text-text-secondary">{bio}</p>}

          {/* Сводная строка чипов — роль, и новый чип текущего уровня
              Wrench Score (иконка+цвет+очки), которого раньше в шапке
              не было вообще, хотя сама система уровней уже существовала
              (см. WrenchScorePanel) — теперь личность "персонажа" видна
              сразу, а не только внутри одной из карточек ниже. */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
              style={{ borderColor: level.color + "40", background: level.color + "15", color: level.color }}>
              <GameIcon id={level.icon} size={12} />
              {isRu ? level.labelRu : level.label}
              <span className="opacity-70">· {score}</span>
            </span>
            {roleLabel && (
              <span className="rounded border border-border px-2 py-0.5 text-xs text-text-muted">{roleLabel}</span>
            )}
            <span className="text-xs text-text-muted">{email}</span>
            {publicProfileUrl && (
              <a href={publicProfileUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-link hover:underline">
                {isRu ? "Публичный профиль" : "Public profile"} <ExternalLinkIcon size={10} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
