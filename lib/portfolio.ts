import type { GameIconId } from "@/components/icons/GameIcons";

// ═══════════════════════════════════════════════════════════════
// Конструктор портфолио — каталог разделов
// ═══════════════════════════════════════════════════════════════
// Чистая логика для вкладки Profile → Портфолио: какие разделы вообще
// существуют, что подставить, если сохранённого выбора ещё нет или он
// повреждён, как включать/выключать раздел, как редактировать списки
// опыта/проектов и как устроены темы оформления. Ничего не знает про
// Supabase/React — та же граница, что и у lib/wrench-score.ts,
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
// поля в БД (пользователь попросил "выбор показывать ли фон и аватар"
// тем же самым списком галочек). "experience" и "projects" — те же
// "классические" резюме-разделы, что и в обычном CV, только со своим
// списком записей (см. PortfolioExperienceEntry/PortfolioProjectEntry
// ниже) вместо простого текста. Единственное, что остаётся обязательным
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
  { id: "experience",         label: "Work experience",     labelRu: "Опыт работы",           icon: "flask" },
  { id: "projects",           label: "Projects",            labelRu: "Проекты",               icon: "gamepad" },
  { id: "score",              label: "Wrench Score",        labelRu: "Wrench Score",          icon: "star" },
  { id: "badges",             label: "Badges",              labelRu: "Награды",               icon: "trophy" },
  { id: "pinned_challenges",  label: "Pinned solutions",    labelRu: "Закреплённые решения",  icon: "target" },
  { id: "endorsements",       label: "Skill endorsements",  labelRu: "Эндорсементы навыков",  icon: "medal" },
  // QR-код на веб-версию портфолио (/u/[username]/portfolio) — виден
  // только если профиль публичный (иначе ссылка мёртвая), см.
  // isPublic в PortfolioPreview.tsx/route.tsx: раздел молча ничего не
  // рисует, если он включён, но профиль не публичный — тот же принцип
  // "нет данных для раздела — раздел не рисуется", что у tech_stack/
  // links при пустом списке.
  { id: "qr_code",            label: "QR code",             labelRu: "QR-код",                icon: "qr" },
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
// toggleStackTag в app/[locale]/profile/page.tsx, но без лимита: разделов
// не так много, ограничивать нечего.
export function togglePortfolioSection(current: readonly string[], id: string): string[] {
  const normalized = normalizePortfolioSections(current);
  return normalized.includes(id)
    ? normalized.filter((s) => s !== id)
    : [...normalized, id];
}

// Полный порядок всех 12 разделов — нормализованный customOrder
// (portfolio_section_order из БД), достроенный до полного списка
// разделами, которых в нём ещё нет (новыми разделами, добавленными в
// каталог уже после того, как пользователь в последний раз что-то
// перетаскивал, или вообще ни разу не трогавший сортировку профилем) —
// они дописываются в конец в порядке каталога. Всегда ровно 12
// элементов, безопасно использовать напрямую как список строк для
// перетаскивания в редакторе (components/profile) — каждый раздел
// в списке ровно один раз.
export function fullSectionOrder(order: readonly string[] | null | undefined): string[] {
  const normalized = normalizePortfolioSections(order);
  const seen = new Set(normalized);
  const rest = PORTFOLIO_SECTIONS.map((s) => s.id).filter((id) => !seen.has(id));
  return [...normalized, ...rest];
}

// Разделы для отрисовки — по умолчанию (без customOrder, как и раньше)
// всегда в порядке каталога PORTFOLIO_SECTIONS, а не в порядке хранения
// в portfolio_sections (тот меняется в зависимости от истории кликов):
// иначе один и тот же набор включённых разделов рисовался бы по-разному
// у разных пользователей. Второй необязательный аргумент — сохранённый
// пользователем порядок (portfolio_section_order): когда он задан,
// разделы рисуются в этом порядке вместо порядка каталога. Один и тот же
// вызов и в живом превью (PortfolioPreview.tsx), и на публичной веб-
// странице портфолио, и в экспорте PNG (route.tsx) — расхождения между
// ними исключены тем же приёмом, что и у resolvePortfolioText.
export function orderedEnabledSections(
  enabled: readonly string[] | null | undefined,
  customOrder?: readonly string[] | null
): PortfolioSectionMeta[] {
  const enabledSet = new Set(normalizePortfolioSections(enabled));
  const order = customOrder && customOrder.length > 0 ? fullSectionOrder(customOrder) : PORTFOLIO_SECTIONS.map((s) => s.id);
  return order
    .filter((id) => enabledSet.has(id))
    .map((id) => PORTFOLIO_SECTIONS.find((s) => s.id === id)!);
}

// Сдвинуть один раздел на позицию вверх/вниз в общем порядке (не только
// среди включённых — порядок хранит позиции ВСЕХ 12 разделов, включая
// выключенные, чтобы выключенный раздел не терял своё место в списке,
// если его снова включат). Чистая функция без UI: кнопки "вверх"/"вниз"
// в редакторе (вместо HTML5 drag-and-drop — так реордер одинаково
// работает и на мобильном, и без риска не собраться в разных браузерах)
// вызывают её и сразу сохраняют результат, тот же принцип мгновенного
// сохранения, что у toggleSectionAndSave. На границе списка (первый
// элемент "вверх" или последний "вниз") или при неизвестном id — просто
// возвращает список без изменений, а не бросает ошибку: кнопка сама
// выглядит disabled в этом случае, но лишняя защита не помешает.
export function moveSectionOrder(
  order: readonly string[] | null | undefined,
  id: string,
  direction: "up" | "down"
): string[] {
  const full = fullSectionOrder(order);
  const idx = full.indexOf(id);
  if (idx === -1) return full;
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= full.length) return full;
  const next = [...full];
  [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
  return next;
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

// ═══════════════════════════════════════════════════════════════
// Опыт работы и проекты — списки записей, не простой текст
// ═══════════════════════════════════════════════════════════════
// Свободный текст (как bio/tagline) не подходит для "классических"
// резюме-разделов — опыт и проекты состоят из отдельных карточек со
// своими полями, которые нужно добавлять/удалять по одной. Хранятся как
// jsonb в profiles (portfolio_experience/portfolio_projects, см.
// supabase/portfolio-migration.sql) — id каждой записи генерируется на
// клиенте (crypto.randomUUID(), см. app/[locale]/profile/page.tsx) и
// нужен только для React key/удаления одной конкретной записи, не для
// связей с другими таблицами, поэтому отдельная SQL-таблица тут была бы
// избыточной (тот же выбор json-поля вместо таблицы, что уже оправдан
// комментарием в самой миграции).
export interface PortfolioExperienceEntry {
  id:          string;
  company:     string;
  position:    string;
  // Свободный текст ("2023 — настоящее время", "Март 2022 – Июнь 2023")
  // — умышленно без пары date-полей: у резюме период почти никогда не
  // укладывается в два простых поля (учёба + стажировка + фриланс), а
  // строить under UI для этого не стоит ради одной строки в карточке.
  period:      string;
  description: string;
}

export interface PortfolioProjectEntry {
  id:          string;
  name:        string;
  description: string;
  // Тоже свободный текст ("React, TypeScript, Playwright"), а не
  // массив id из STACK_TAGS (lib/profile-stack.ts) — проект может
  // использовать технологию, которой нет в общем справочнике профиля
  // (конкретную библиотеку, внутренний инструмент), и заставлять
  // подбирать ближайший тег из общего списка было бы более узким
  // редактором, а не более гибким.
  tech:        string;
  url:         string | null;
}

// Сколько записей помещается в постер без переполнения — тот же принцип
// конечной витрины, что у MAX_PINNED/MAX_STACK_TAGS в
// app/[locale]/profile/page.tsx.
export const MAX_EXPERIENCE_ENTRIES = 6;
export const MAX_PROJECT_ENTRIES    = 6;

export function addExperienceEntry(
  entries: readonly PortfolioExperienceEntry[],
  entry: PortfolioExperienceEntry
): PortfolioExperienceEntry[] {
  if (entries.length >= MAX_EXPERIENCE_ENTRIES) return [...entries];
  return [...entries, entry];
}

export function removeExperienceEntry(entries: readonly PortfolioExperienceEntry[], id: string): PortfolioExperienceEntry[] {
  return entries.filter((e) => e.id !== id);
}

export function addProjectEntry(
  entries: readonly PortfolioProjectEntry[],
  entry: PortfolioProjectEntry
): PortfolioProjectEntry[] {
  if (entries.length >= MAX_PROJECT_ENTRIES) return [...entries];
  return [...entries, entry];
}

export function removeProjectEntry(entries: readonly PortfolioProjectEntry[], id: string): PortfolioProjectEntry[] {
  return entries.filter((e) => e.id !== id);
}

// Автоподстановка проекта из решённой задачи (roadmap: "кнопка 'подтянуть
// из пройденных челленджей' при добавлении проекта, чтобы не переписывать
// вручную то, что уже есть в профиле") — только те поля решённой задачи,
// которых достаточно для одной карточки проекта: не весь SolvedChallenge
// (app/[locale]/profile/page.tsx), а уже готовые текстовые метки
// роли/сложности (ROLE_META/DIFFICULTY_META, lib/challenges/types.ts),
// чтобы этот файл не тянул за собой ещё один модуль ради двух строк.
export interface PortfolioChallengeSource {
  title:           string;
  titleRu:         string | null;
  roleLabel:       string;
  difficultyLabel: string;
  points:          number;
}

// Без id — id для новой записи генерируется на клиенте (crypto.randomUUID(),
// тот же приём, что уже применён к addExperience/addProject в
// app/[locale]/profile/page.tsx), эта функция только собирает содержимое.
//
// Сознательно НЕ заполняет:
// — tech: роль задачи ("QA-инженер") — это не стек технологий, а
//   категория задачи, подставлять её в поле "Стек, напр. React, TS" было
//   бы больше похоже на догадку, чем на подстановку; проще оставить
//   пустым и дать заполнить вручную, чем писать туда что-то неверное.
// — url: у отдельной решённой задачи нет своей постоянной страницы
//   (/challenges/[role] — общий список по роли, не карточка одной
//   задачи), ссылку класть некуда — тоже оставляем пустым.
export function projectEntryFromChallenge(
  source: PortfolioChallengeSource,
  isRu: boolean
): Omit<PortfolioProjectEntry, "id"> {
  const name = isRu && source.titleRu ? source.titleRu : source.title;
  const description = isRu
    ? `Решённая задача Wrench-Branch: ${source.roleLabel}, уровень «${source.difficultyLabel}» (${source.points} баллов).`
    : `Solved Wrench-Branch challenge: ${source.roleLabel}, ${source.difficultyLabel} difficulty (${source.points} points).`;
  return { name, description, tech: "", url: null };
}

// ═══════════════════════════════════════════════════════════════
// Темы оформления
// ═══════════════════════════════════════════════════════════════
// Десять тем, которые пользователь перечислил явно (полная тематизация,
// не только палитра — см. обсуждение). Один и тот же макет карточки
// (PortfolioPreview.tsx / route.tsx) рендерится по-разному в зависимости
// от токенов темы: палитра, пара шрифтов, "угловой" декоративный символ
// и переопределения подписей разделов — а не десять отдельных вручную
// нарисованных карточек. Так добавление одиннадцатой темы в будущем —
// это только новая запись в PORTFOLIO_THEMES, а не новый компонент.
//
// displayFont/bodyFont — названия семейств Google Fonts, которые
// PortfolioPreview.tsx подключает одним общим <link> на все темы сразу
// (см. PORTFOLIO_GOOGLE_FONTS_HREF ниже). В экспортированный PNG
// (route.tsx, next/og ImageResponse на движке Satori) собственные шрифты
// НЕ грузятся — Satori умеет рисовать текст только теми шрифтами, чьи
// файлы ему явно передали байтами через опцию fonts, а не по названию
// семейства, и сеть до Google Fonts из serverless-функции — лишняя точка
// отказа ради того, что на экспортированном постере всё равно менее
// заметно, чем в интерактивном превью. Поэтому в PNG темы отличаются
// палитрой, обводкой, угловым символом и подписями разделов, а шрифт
// везде дефолтный (см. комментарий в route.tsx).
export type PortfolioThemeId =
  | "classic" | "fantasy" | "space" | "anime" | "matrix"
  | "medieval" | "minimal" | "nature" | "conspiracy" | "horror";

export interface PortfolioThemeTokens {
  id:           PortfolioThemeId;
  name:         string;
  nameRu:       string;
  bg:           string;
  surface:      string;
  border:       string;
  textPrimary:  string;
  textSecondary:string;
  textMuted:    string;
  accent:       string;
  accent2:      string;
  displayFont:  string;
  bodyFont:     string;
  // Один символ юникода в углах карточки — самый дешёвый способ дать
  // теме узнаваемую деталь, которая одинаково рисуется и в браузере
  // (обычный текст), и в Satori (тоже просто текст, никаких SVG/иконок).
  cornerGlyph:  string;
  // Ключ декоративного фона ЖИВОГО превью (CSS-паттерн — звёзды,
  // сканлайны, зерно и т.п., см. THEME_BG_PATTERN_CLASS в
  // PortfolioPreview.tsx). В PNG-экспорте не используется — см. комментарий
  // выше про ограничения Satori.
  bgPattern:    "none" | "stars" | "scanlines" | "grain" | "parchment" | "leaves" | "corkboard" | "ink";
  // Радиус углов карточки — часть личности темы не меньше, чем цвет
  // (острые углы у минимализма/матрицы, скруглённые у аниме и природы).
  radius:       number;
}

// Переопределения подписей разделов по темам — только там, где слово
// РЕАЛЬНО меняется; отсутствующий ключ означает "как в PORTFOLIO_SECTIONS"
// (см. themeSectionLabel ниже). Так не нужно повторять все 12 разделов
// для всех 10 тем — только то, что тема осмысленно переименовывает.
const THEME_LABELS: Partial<Record<PortfolioThemeId, Partial<Record<string, { label: string; labelRu: string }>>>> = {
  fantasy: {
    tagline: { label: "Title", labelRu: "Титул" },
    bio: { label: "Backstory", labelRu: "Предыстория" },
    links: { label: "Ways of contact", labelRu: "Пути связи" },
    tech_stack: { label: "Abilities", labelRu: "Характеристики" },
    experience: { label: "Guilds served", labelRu: "Гильдии" },
    projects: { label: "Artifacts forged", labelRu: "Артефакты" },
    score: { label: "Power level", labelRu: "Уровень силы" },
    badges: { label: "Trophies", labelRu: "Трофеи" },
    pinned_challenges: { label: "Legendary quests", labelRu: "Легендарные подвиги" },
    endorsements: { label: "Renown among guilds", labelRu: "Слава в гильдиях" },
  },
  space: {
    tagline: { label: "Callsign", labelRu: "Позывной" },
    bio: { label: "Dossier", labelRu: "Досье" },
    links: { label: "Comm channels", labelRu: "Каналы связи" },
    tech_stack: { label: "Ship systems", labelRu: "Системы" },
    experience: { label: "Service record", labelRu: "Служба" },
    projects: { label: "Expeditions", labelRu: "Экспедиции" },
    score: { label: "Pilot rank", labelRu: "Ранг пилота" },
    badges: { label: "Medals", labelRu: "Медали" },
    pinned_challenges: { label: "Missions", labelRu: "Миссии" },
    endorsements: { label: "Crew recommendations", labelRu: "Рекомендации экипажа" },
  },
  anime: {
    tagline: { label: "Motto", labelRu: "Девиз" },
    bio: { label: "Hero's story", labelRu: "История героя" },
    links: { label: "Contacts", labelRu: "Контакты" },
    tech_stack: { label: "Techniques", labelRu: "Техники" },
    experience: { label: "Path", labelRu: "Путь" },
    projects: { label: "Missions", labelRu: "Миссии" },
    score: { label: "Power level", labelRu: "Сила духа" },
    badges: { label: "Achievements", labelRu: "Достижения" },
    pinned_challenges: { label: "Legendary battles", labelRu: "Легендарные бои" },
    endorsements: { label: "Recognized by allies", labelRu: "Признание союзников" },
  },
  matrix: {
    tagline: { label: "Status", labelRu: "Статус" },
    bio: { label: "Operator file", labelRu: "Досье оператора" },
    links: { label: "Entry points", labelRu: "Точки входа" },
    tech_stack: { label: "Protocols", labelRu: "Протоколы" },
    experience: { label: "Connection log", labelRu: "Лог подключений" },
    projects: { label: "Scripts", labelRu: "Скрипты" },
    score: { label: "Access level", labelRu: "Уровень доступа" },
    badges: { label: "Certificates", labelRu: "Сертификаты" },
    pinned_challenges: { label: "Systems breached", labelRu: "Взломанные системы" },
    endorsements: { label: "Verified by operators", labelRu: "Подтверждено оператором" },
  },
  medieval: {
    tagline: { label: "Motto", labelRu: "Девиз" },
    bio: { label: "About the craftsman", labelRu: "О мастере" },
    links: { label: "Contacts", labelRu: "Контакты" },
    tech_stack: { label: "Crafts", labelRu: "Ремёсла" },
    experience: { label: "Service", labelRu: "Служба" },
    projects: { label: "Works", labelRu: "Работы" },
    score: { label: "Mastery", labelRu: "Мастерство" },
    badges: { label: "Charters", labelRu: "Грамоты" },
    pinned_challenges: { label: "Finest works", labelRu: "Лучшие работы" },
    endorsements: { label: "Guild recommendations", labelRu: "Рекомендации цеха" },
  },
  nature: {
    tagline: { label: "Motto", labelRu: "Девиз" },
    bio: { label: "Roots", labelRu: "Корни" },
    links: { label: "Trails", labelRu: "Тропы" },
    tech_stack: { label: "Ecosystem of skills", labelRu: "Экосистема навыков" },
    experience: { label: "Seasons", labelRu: "Сезоны" },
    projects: { label: "Plantings", labelRu: "Посевы" },
    score: { label: "Growth", labelRu: "Рост" },
    badges: { label: "Fruits", labelRu: "Плоды" },
    pinned_challenges: { label: "Best sprouts", labelRu: "Лучшие всходы" },
    endorsements: { label: "Flock's word", labelRu: "Отзывы стаи" },
  },
  conspiracy: {
    tagline: { label: "Codename", labelRu: "Кодовое имя" },
    bio: { label: "Case file", labelRu: "Материалы дела" },
    links: { label: "Sources", labelRu: "Источники" },
    tech_stack: { label: "Evidence", labelRu: "Улики" },
    experience: { label: "Timeline", labelRu: "Хронология" },
    projects: { label: "Investigations", labelRu: "Расследования" },
    score: { label: "Clearance level", labelRu: "Уровень допуска" },
    badges: { label: "Declassified", labelRu: "Рассекречено" },
    pinned_challenges: { label: "Cases cracked", labelRu: "Раскрытые дела" },
    endorsements: { label: "Witness testimony", labelRu: "Показания свидетелей" },
  },
  horror: {
    tagline: { label: "Epitaph", labelRu: "Эпитафия" },
    bio: { label: "Story", labelRu: "История" },
    links: { label: "Traces", labelRu: "Следы" },
    tech_stack: { label: "Rituals", labelRu: "Ритуалы" },
    experience: { label: "Chronicles", labelRu: "Хроники" },
    projects: { label: "Experiments", labelRu: "Эксперименты" },
    score: { label: "Dread level", labelRu: "Уровень ужаса" },
    badges: { label: "Relics", labelRu: "Реликвии" },
    pinned_challenges: { label: "Nightmares survived", labelRu: "Выжитые кошмары" },
    endorsements: { label: "Survivor testimony", labelRu: "Свидетельства выживших" },
  },
  // classic и minimal намеренно без переопределений — используют
  // подписи из PORTFOLIO_SECTIONS как есть (для minimal это ровно
  // задуманный эффект: строгие стандартные слова, без игровой лексики).
};

export const PORTFOLIO_THEMES: PortfolioThemeTokens[] = [
  {
    id: "classic", name: "Classic", nameRu: "Обычная",
    bg: "#0a0a10", surface: "#131319", border: "#232330",
    textPrimary: "#f8f8fb", textSecondary: "#a4a4b1", textMuted: "#76767f",
    accent: "#f59e0b", accent2: "#8b5cf6",
    displayFont: "Unbounded", bodyFont: "Manrope",
    cornerGlyph: "", bgPattern: "none", radius: 16,
  },
  {
    id: "fantasy", name: "Fantasy (DnD / Diablo)", nameRu: "Средневековое фэнтези (DnD/Diablo)",
    bg: "#160f0a", surface: "#241a10", border: "#5c4423",
    textPrimary: "#f3e3c4", textSecondary: "#cbab74", textMuted: "#8a7350",
    accent: "#c8952a", accent2: "#8a1f1f",
    displayFont: "Cinzel", bodyFont: "EB Garamond",
    cornerGlyph: "⚔", bgPattern: "parchment", radius: 6,
  },
  {
    id: "space", name: "Space", nameRu: "Космическая",
    bg: "#05060f", surface: "#0d1024", border: "#2a3163",
    textPrimary: "#eef1ff", textSecondary: "#9aa4e8", textMuted: "#5c649c",
    accent: "#5ce1ff", accent2: "#a855f7",
    displayFont: "Orbitron", bodyFont: "Space Mono",
    cornerGlyph: "✦", bgPattern: "stars", radius: 12,
  },
  {
    id: "anime", name: "Anime", nameRu: "Аниме",
    bg: "#160b1c", surface: "#241130", border: "#5c2a6e",
    textPrimary: "#fff0fb", textSecondary: "#f0a8e0", textMuted: "#a870a0",
    accent: "#ff4fa3", accent2: "#3fd1ff",
    displayFont: "Baloo 2", bodyFont: "Nunito",
    cornerGlyph: "✨", bgPattern: "none", radius: 24,
  },
  {
    id: "matrix", name: "Matrix", nameRu: "Матрица",
    bg: "#000502", surface: "#001a0a", border: "#0d5c2e",
    textPrimary: "#b6ffcb", textSecondary: "#39ff6a", textMuted: "#1c8a3e",
    accent: "#39ff6a", accent2: "#0d5c2e",
    displayFont: "Share Tech Mono", bodyFont: "Share Tech Mono",
    cornerGlyph: "〒", bgPattern: "scanlines", radius: 2,
  },
  {
    id: "medieval", name: "Medieval (realistic)", nameRu: "Средневековое (реалистичное)",
    bg: "#1a1712", surface: "#26221a", border: "#4a4230",
    textPrimary: "#e9e2d0", textSecondary: "#b6ab8c", textMuted: "#83795f",
    accent: "#9c7a3c", accent2: "#5a2e2e",
    displayFont: "Cormorant Garamond", bodyFont: "EB Garamond",
    cornerGlyph: "❦", bgPattern: "parchment", radius: 4,
  },
  {
    id: "minimal", name: "Minimal", nameRu: "Строгая минималистическая",
    bg: "#ffffff", surface: "#f4f4f5", border: "#e4e4e7",
    textPrimary: "#0a0a0a", textSecondary: "#52525b", textMuted: "#a1a1aa",
    accent: "#0a0a0a", accent2: "#71717a",
    displayFont: "Inter", bodyFont: "Inter",
    cornerGlyph: "", bgPattern: "none", radius: 0,
  },
  {
    id: "nature", name: "Nature", nameRu: "Природная",
    bg: "#0f1a10", surface: "#182818", border: "#3a5a3a",
    textPrimary: "#eaf5e8", textSecondary: "#a8cba0", textMuted: "#6f8f6a",
    accent: "#7fc95c", accent2: "#c9a25c",
    displayFont: "Playfair Display", bodyFont: "Quicksand",
    cornerGlyph: "⚘", bgPattern: "leaves", radius: 20,
  },
  {
    id: "conspiracy", name: "Conspiracy board", nameRu: "Теория заговора",
    bg: "#1c1712", surface: "#2a2119", border: "#7a1f1f",
    textPrimary: "#f0e6d2", textSecondary: "#d0c4a4", textMuted: "#8c8066",
    accent: "#c81e1e", accent2: "#c8b56a",
    displayFont: "Special Elite", bodyFont: "Special Elite",
    cornerGlyph: "✱", bgPattern: "corkboard", radius: 2,
  },
  {
    id: "horror", name: "Horror", nameRu: "Хоррор",
    bg: "#050505", surface: "#120808", border: "#4a0f0f",
    textPrimary: "#e8dcdc", textSecondary: "#a87878", textMuted: "#5c3f3f",
    accent: "#8a0000", accent2: "#3a3a3a",
    displayFont: "Nosifer", bodyFont: "Crimson Text",
    cornerGlyph: "†", bgPattern: "grain", radius: 3,
  },
];

const PORTFOLIO_THEME_MAP = new Map(PORTFOLIO_THEMES.map((t) => [t.id, t]));

export const DEFAULT_PORTFOLIO_THEME: PortfolioThemeId = "classic";

// Неизвестный/битый id (тема, сохранённая до того, как её добавили в
// каталог, или руками испорченное значение в БД без CHECK) — тихо
// откатываемся на classic, а не падаем и не показываем пустую карточку.
export function getPortfolioTheme(id: string | null | undefined): PortfolioThemeTokens {
  return (id && PORTFOLIO_THEME_MAP.get(id as PortfolioThemeId)) || PORTFOLIO_THEME_MAP.get(DEFAULT_PORTFOLIO_THEME)!;
}

// Подпись раздела с учётом темы — переопределение из THEME_LABELS, если
// оно есть у этой темы для этого раздела, иначе обычная подпись из
// PORTFOLIO_SECTIONS. Единая функция для превью и экспорта — тот же
// принцип "одна функция решает, что показать", что у resolvePortfolioText.
export function themeSectionLabel(themeId: PortfolioThemeId, section: PortfolioSectionMeta, isRu: boolean): string {
  const override = THEME_LABELS[themeId]?.[section.id];
  if (override) return isRu ? override.labelRu : override.label;
  return isRu ? section.labelRu : section.label;
}

// Google Fonts, подключаемые одним общим запросом для живого превью —
// по одному display+body шрифту на каждую тему, без дублей (у Fantasy и
// Medieval общий EB Garamond, например). Собран из PORTFOLIO_THEMES
// программно, чтобы при добавлении новой темы не пришлось отдельно
// помнить про обновление этой строки.
export const PORTFOLIO_GOOGLE_FONTS_HREF = (() => {
  const families = Array.from(new Set(PORTFOLIO_THEMES.flatMap((t) => [t.displayFont, t.bodyFont])))
    .filter((f) => f !== "Inter") // Inter уже используется системным стеком по умолчанию — не грузим второй раз
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;600;700`);
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
})();

// ═══════════════════════════════════════════════════════════════
// Пресеты — сохранённые наборы настроек портфолио
// ═══════════════════════════════════════════════════════════════
// roadmap: "несколько сохранённых пресетов портфолио под разные вакансии/
// компании (свой набор разделов, тема, ручные тексты) с переключением".
// Пресет — снимок "презентационных" настроек: какие разделы включены и в
// каком порядке, тема оформления и четыре текстовых переопределения из
// ручного редактора. Сознательно НЕ включает portfolio_experience/
// portfolio_projects — это содержимое самого резюме, а не то, как оно
// показано, и оно одно и то же независимо от того, под какую вакансию
// сейчас настроено портфолио (у presets нет собственного "какие записи
// опыта показывать" — это была бы отдельная, более крупная фича).
//
// Модель — "слоты сохранения", не параллельные публичные ссылки: в любой
// момент активна ровно ОДНА конфигурация (те же portfolio_sections/
// portfolio_theme/... колонки, что и раньше), пресет просто позволяет
// сохранить её под именем и одним кликом вернуться к ней позже,
// перезаписав текущую активную конфигурацию. lib/portfolio.ts не хранит
// "какой пресет сейчас применён" — применение пресета копирует его
// значения в активные колонки и на этом всё, дальнейшее редактирование
// активной конфигурации никак не помечает исходный пресет как
// "устаревший" (это сознательное упрощение, не отслеживаем dirty-state).
export interface PortfolioPreset {
  id:           string;
  name:         string;
  sections:     string[];
  sectionOrder: string[];
  theme:        PortfolioThemeId;
  title:        string | null;
  tagline:      string | null;
  bio:          string | null;
  footer:       string | null;
}

// Столько пресетов помещается в список без превращения вкладки
// Портфолио в отдельный экран управления — та же логика конечной
// витрины, что у MAX_EXPERIENCE_ENTRIES/MAX_PROJECT_ENTRIES выше.
export const MAX_PORTFOLIO_PRESETS = 5;

export function addPortfolioPreset(presets: readonly PortfolioPreset[], preset: PortfolioPreset): PortfolioPreset[] {
  if (presets.length >= MAX_PORTFOLIO_PRESETS) return [...presets];
  return [...presets, preset];
}

export function removePortfolioPreset(presets: readonly PortfolioPreset[], id: string): PortfolioPreset[] {
  return presets.filter((p) => p.id !== id);
}

// Пустое/пробельное имя не сохраняем — тот же принцип, что у
// resolvePortfolioText: молча ничего не меняем, а не пишем в БД пустую
// строку, которая потом нечитаемо отображалась бы в списке.
export function renamePortfolioPreset(presets: readonly PortfolioPreset[], id: string, name: string): PortfolioPreset[] {
  const trimmed = name.trim();
  if (!trimmed) return [...presets];
  return presets.map((p) => (p.id === id ? { ...p, name: trimmed } : p));
}

// Перезаписать презентационные настройки уже существующего пресета
// текущими активными (кнопка "Обновить" у пресета в редакторе) — имя и
// id пресета не трогаем, снимок — всё остальное.
export function updatePortfolioPresetSnapshot(
  presets: readonly PortfolioPreset[],
  id: string,
  snapshot: Omit<PortfolioPreset, "id" | "name">
): PortfolioPreset[] {
  return presets.map((p) => (p.id === id ? { ...p, ...snapshot } : p));
}
