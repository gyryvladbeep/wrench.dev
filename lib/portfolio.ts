import type { GameIconId } from "@/components/icons/GameIcons";

// ═══════════════════════════════════════════════════════════════
// Конструктор портфолио — каталог разделов
// ═══════════════════════════════════════════════════════════════
// Чистая логика для новой вкладки Profile → Портфолио: какие разделы
// вообще существуют, что подставить, если сохранённого выбора ещё нет
// или он повреждён, и как включать/выключать один раздел. Ничего не
// знает про Supabase/React — та же граница, что и у lib/wrench-score.ts,
// lib/achievements.ts, lib/skill-endorsements.ts, протестирована без
// браузера (см. tests/portfolio.spec.ts).

export interface PortfolioSectionMeta {
  id: string;
  label: string;
  labelRu: string;
  icon: GameIconId;
}

// Порядок в этом массиве — порядок отрисовки и в живом превью
// (components/portfolio/PortfolioPreview.tsx), и в экспортированной
// картинке (app/api/portfolio/[username]/route.tsx): пользователь может
// только включить/выключить раздел, не переставить его местами — тот же
// принцип "включаемого, но не перетаскиваемого" набора, что уже есть у
// tech_stack/pinned_challenge_ids в app/[locale]/profile/page.tsx.
//
// "avatar" и "banner" — тоже переключаемые разделы, не отдельные булевы
// поля в БД: пользователь явно попросил "выбор показывать ли фон и
// аватар" тем же самым списком галочек, что и остальные разделы, а не
// отдельным блоком настроек. Единственное, что остаётся обязательным
// (не входит в каталог, отключить нельзя) — сама строка имя/юзернейм/
// роль/локация: без неё портфолио превратилось бы в карточку без
// единой опознавательной детали, чьё это портфолио вообще.
export const PORTFOLIO_SECTIONS: PortfolioSectionMeta[] = [
  { id: "banner",            label: "Background banner",  labelRu: "Фон (баннер)",          icon: "palette" },
  { id: "avatar",            label: "Avatar",              labelRu: "Аватар",                icon: "diamond" },
  { id: "tagline",           label: "Tagline",             labelRu: "Слоган",                icon: "sparkle" },
  { id: "bio",                label: "Bio",                 labelRu: "О себе",                icon: "wrench" },
  { id: "links",              label: "Links",               labelRu: "Ссылки",                icon: "flag" },
  { id: "tech_stack",         label: "Tech stack",          labelRu: "Технологии",            icon: "brackets" },
  { id: "score",              label: "Wrench Score",        labelRu: "Wrench Score",          icon: "star" },
  { id: "badges",             label: "Badges",              labelRu: "Награды",               icon: "trophy" },
  { id: "pinned_challenges",  label: "Pinned solutions",    labelRu: "Закреплённые решения",  icon: "target" },
  { id: "endorsements",       label: "Skill endorsements",  labelRu: "Эндорсементы навыков",  icon: "medal" },
];

const KNOWN_SECTION_IDS = new Set(PORTFOLIO_SECTIONS.map((s) => s.id));

// Набор по умолчанию для профиля, который ещё ни разу не сохранял свой
// выбор — всё включено, тот же принцип "лучшее из возможного по
// умолчанию", что у is_public: true в исходной схеме profiles. Должен
// совпадать с DEFAULT в supabase/portfolio-migration.sql; при
// расхождении источником истины считать миграцию — этот массив только
// клиентский фолбэк на случай null/undefined с сервера (профиль,
// сохранённый до того, как эта миграция была выполнена).
export const DEFAULT_PORTFOLIO_SECTIONS: string[] = PORTFOLIO_SECTIONS.map((s) => s.id);

// Отфильтровывает неизвестные id и дубликаты. Нужна в трёх местах:
// при загрузке профиля (старые/битые данные), перед каждым переключением
// раздела и на сервере при разборе query-параметра ?sections= в роуте
// экспорта — везде один и тот же риск: text[]-поле без CHECK на уровне
// БД (тот же справочник-в-приложении-а-не-в-базе принцип, что и у
// tech_stack, см. supabase/profile-stack-location-migration.sql).
export function normalizePortfolioSections(ids: readonly string[] | null | undefined): string[] {
  if (!ids) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (KNOWN_SECTION_IDS.has(id) && !seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
}

// Включить/выключить один раздел — та же логика, что togglePinned/
// toggleStackTag в app/[locale]/profile/page.tsx, но без лимита:
// разделов всего восемь, ограничивать нечего.
export function togglePortfolioSection(current: readonly string[], id: string): string[] {
  const normalized = normalizePortfolioSections(current);
  return normalized.includes(id)
    ? normalized.filter((s) => s !== id)
    : [...normalized, id];
}

// Разделы для отрисовки — всегда в порядке каталога PORTFOLIO_SECTIONS,
// а не в порядке хранения в portfolio_sections (тот меняется в
// зависимости от истории кликов): иначе один и тот же набор включённых
// разделов рисовался бы по-разному у разных пользователей.
export function orderedEnabledSections(enabled: readonly string[] | null | undefined): PortfolioSectionMeta[] {
  const set = new Set(normalizePortfolioSections(enabled));
  return PORTFOLIO_SECTIONS.filter((s) => set.has(s.id));
}

// Имя файла экспорта — вынесено отдельно, чтобы UI (кнопки "Скачать
// PNG/PDF") и тесты не дублировали формат руками. Юзернеймы в этом
// проекте не гарантированно url/filename-safe (см. отсутствие CHECK на
// username в profile-schema.sql), поэтому подчищаем до безопасного
// набора символов, как это уже делает slugify-подобная логика в других
// частях кодовой базы для произвольного пользовательского текста.
export function buildPortfolioFileName(username: string, ext: "png" | "pdf"): string {
  const safe = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `wrench-branch-portfolio-${safe || "profile"}.${ext}`;
}

// ═══════════════════════════════════════════════════════════════
// Ручной редактор — текстовые переопределения только для портфолио
// ═══════════════════════════════════════════════════════════════
// portfolio_title/tagline/bio/footer в БД (supabase/portfolio-migration.sql)
// — необязательные text-поля, независимые от настоящих profile.tagline/
// profile.bio: пустое/null поле = "показывать как в самом профиле",
// заполненное = "показывать вот это вместо него". Так portfolio-вкладка
// становится настоящим ручным редактором содержимого карточки, а не
// просто переключателем видимости уже существующих полей профиля —
// можно, например, написать для портфолио более "продающий" слоган, не
// трогая тот, что видят посетители обычного публичного профиля.
//
// resolvePortfolioText — единственное место, которое решает "что реально
// показать": и живой предпросмотр (PortfolioPreview.tsx), и серверный
// рендер PNG (route.tsx) вызывают ровно эту функцию с одинаковыми
// аргументами, чтобы предпросмотр не мог разойтись с экспортом. Пустая
// строка/только пробелы в override считаются "не задано" — иначе случайно
// стёртый пробелами текст молча скрывал бы реальные данные профиля.
export function resolvePortfolioText(override: string | null | undefined, fallback: string): string {
  const trimmed = override?.trim();
  return trimmed ? trimmed : fallback;
}
