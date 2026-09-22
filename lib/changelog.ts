// ═══════════════════════════════════════════════════════════════
// Контент публичного changelog (roadmap item 24: "при таком темпе
// разработки простое 'что нового' — сигнал доверия и готовый контент
// для Reddit/Telegram/Habr"). Статический массив, курируется
// разработчиком вручную — тот же приём, что у tools-registry.ts и
// TRAINER_EXERCISES: контент решает человек, а не автогенерация из
// git log (сырые commit-сообщения технические и не для читателя сайта,
// плюс не в каждом коммите есть что показать пользователю — правки
// тестов, security-патчи без видимого эффекта и т.п. осознанно не
// попадают в список).
//
// Даты и факт "что было сделано" в этом файле взяты из реальной
// истории git (см. `git log --date=short`) на момент написания — не
// придуманы, — но формулировки переписаны на человеческий язык вместо
// commit-сообщений. При новом релизе достаточно дописать объект в
// начало CHANGELOG_ENTRIES, порядок в массиве не важен — сортирует
// sortChangelogEntries().

export type ChangelogTag = "feature" | "improvement" | "fix";

export interface ChangelogEntry {
  /** YYYY-MM-DD */
  date: string;
  tag: ChangelogTag;
  titleEn: string;
  titleRu: string;
  descriptionEn: string;
  descriptionRu: string;
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    date: "2026-09-20", tag: "feature",
    titleEn: "Trainer: real-project-scale exercises",
    titleRu: "Тренажёр: упражнения в масштабе реального проекта",
    descriptionEn: "A new \"Real project\" category in the Trainer — instead of one function, fix a whole broken mini-app (HTML/CSS/JS) in a live sandbox, with automated checks that simulate clicks and typing.",
    descriptionRu: "Новая категория \"Реальный проект\" в тренажёре — вместо одной функции нужно починить целое сломанное мини-приложение (HTML/CSS/JS) в живой песочнице, с автоматическими проверками, которые симулируют клики и ввод текста.",
  },
  {
    date: "2026-09-20", tag: "improvement",
    titleEn: "Docs: how to install and use the CLI and VS Code extension",
    titleRu: "Документация: как скачать и пользоваться CLI и VS Code-расширением",
    descriptionEn: "The /docs page now explains where to get the command-line tool and the VS Code extension, and how to use both.",
    descriptionRu: "На странице /docs теперь объясняется, где взять консольную утилиту и VS Code-расширение и как ими пользоваться.",
  },
  {
    date: "2026-09-20", tag: "improvement",
    titleEn: "Portfolio: multi-page PDF export",
    titleRu: "Портфолио: печать в несколько страниц PDF",
    descriptionEn: "Longer portfolios now export as a proper multi-page A4 PDF instead of being squeezed onto one page.",
    descriptionRu: "Длинные портфолио теперь экспортируются в PDF на несколько страниц A4, а не втискиваются в одну.",
  },
  {
    date: "2026-09-20", tag: "feature",
    titleEn: "Portfolio: auto-fill projects from solved challenges",
    titleRu: "Портфолио: автозаполнение проектов из решённых челленджей",
    descriptionEn: "Turn any solved challenge directly into a portfolio project entry, instead of typing it up by hand.",
    descriptionRu: "Любой решённый челлендж теперь можно превратить в запись проекта в портфолио одним кликом, не переписывая вручную.",
  },
  {
    date: "2026-09-19", tag: "feature",
    titleEn: "Portfolio builder launched",
    titleRu: "Запущен конструктор портфолио",
    descriptionEn: "A full portfolio builder: toggleable sections, 10 visual themes, a public shareable page with a QR code, PNG/PDF export, and presets for tailoring the same portfolio to different job applications.",
    descriptionRu: "Полноценный конструктор портфолио: включаемые секции, 10 визуальных тем, публичная страница со ссылкой и QR-кодом, экспорт в PNG/PDF и пресеты для подгонки одного портфолио под разные вакансии.",
  },
  {
    date: "2026-09-18", tag: "feature",
    titleEn: "Peer skill endorsements",
    titleRu: "Пир-эндорсементы навыков",
    descriptionEn: "Other members can now vouch for specific skills on your public profile — a lightweight version of LinkedIn endorsements.",
    descriptionRu: "Теперь другие пользователи могут подтверждать конкретные навыки в твоём публичном профиле — облегчённая версия LinkedIn-эндорсементов.",
  },
  {
    date: "2026-09-18", tag: "feature",
    titleEn: "Command-line tool released (npm)",
    titleRu: "Вышла консольная утилита (npm)",
    descriptionEn: "wrench-branch is now on npm — the offline JSON/Base64/JWT/UUID/hash tools, plus a few that call the public API, right from your terminal.",
    descriptionRu: "wrench-branch теперь на npm — офлайн-инструменты JSON/Base64/JWT/UUID/хеши, плюс несколько команд к публичному API, прямо в терминале.",
  },
  {
    date: "2026-09-18", tag: "feature",
    titleEn: "Public salary market snapshot report",
    titleRu: "Публичный отчёт \"срез рынка зарплат\"",
    descriptionEn: "An auto-updating, crowd-sourced report of QA/developer salaries by role, seniority and country, built from the salary calculator's aggregated data.",
    descriptionRu: "Авто-обновляемый отчёт по зарплатам QA-инженеров и разработчиков по роли, грейду и стране — на основе агрегированных данных калькулятора зарплат.",
  },
  {
    date: "2026-09-18", tag: "feature",
    titleEn: "Public Wrench Score leaderboard",
    titleRu: "Публичный лидерборд Wrench Score",
    descriptionEn: "A top-50, hourly-updating leaderboard ranked by Wrench Score — streaks, solved challenges, tools used and badges earned.",
    descriptionRu: "Топ-50 участников по Wrench Score, обновляется каждый час — стрики, решённые челленджи, использованные инструменты и заработанные бейджи.",
  },
  {
    date: "2026-09-18", tag: "feature",
    titleEn: "VS Code extension released",
    titleRu: "Вышло расширение для VS Code",
    descriptionEn: "The same offline tools, now available straight from VS Code's command palette.",
    descriptionRu: "Те же офлайн-инструменты теперь доступны прямо из командной палитры VS Code.",
  },
  {
    date: "2026-09-18", tag: "feature",
    titleEn: "Public tools API, OpenAPI spec and Postman collection",
    titleRu: "Публичное API инструментов, OpenAPI-спецификация и коллекция Postman",
    descriptionEn: "The tools catalog is now reachable over a documented public API, with a ready-made OpenAPI spec and Postman collection.",
    descriptionRu: "Каталог инструментов теперь доступен через документированное публичное API, с готовой OpenAPI-спецификацией и коллекцией Postman.",
  },
  {
    date: "2026-09-17", tag: "feature",
    titleEn: "\"Continue where you left off\" widget",
    titleRu: "Виджет \"Продолжить с того же места\"",
    descriptionEn: "The homepage now picks up right where you stopped — an unfinished trainer exercise or a recent workbench session.",
    descriptionRu: "Главная страница теперь предлагает продолжить с того же места, где ты остановился — недорешённое упражнение тренажёра или недавнюю сессию воркбенча.",
  },
  {
    date: "2026-09-17", tag: "feature",
    titleEn: "Achievements as an equippable status badge",
    titleRu: "Достижения как надеваемый бейдж статуса",
    descriptionEn: "Pick one earned achievement to show off on your public profile, like an equipped badge.",
    descriptionRu: "Можно выбрать одно заработанное достижение и показать его на публичном профиле — как надетый бейдж.",
  },
  {
    date: "2026-09-17", tag: "feature",
    titleEn: "Import Postman/Insomnia collections into Mock API",
    titleRu: "Импорт коллекций Postman/Insomnia в Mock API",
    descriptionEn: "Bring an existing Postman or Insomnia collection straight into the Mock API tool instead of recreating every route by hand.",
    descriptionRu: "Существующую коллекцию Postman или Insomnia теперь можно сразу импортировать в Mock API, не пересоздавая каждый роут вручную.",
  },
  {
    date: "2026-09-16", tag: "improvement",
    titleEn: "Security hardening pass",
    titleRu: "Проход по безопасности",
    descriptionEn: "A dedicated security audit closed several real issues at once — row-level security gaps, SSRF exposure, missing security headers, and outdated dependencies.",
    descriptionRu: "Отдельный аудит безопасности закрыл сразу несколько реальных проблем — дыры в row-level security, SSRF-уязвимость, отсутствующие security-заголовки и устаревшие зависимости.",
  },
  {
    date: "2026-09-16", tag: "feature",
    titleEn: "Guest preview of Workbench without signing in",
    titleRu: "Гостевой предпросмотр Workbench без входа",
    descriptionEn: "You can now try the Workbench canvas before creating an account, instead of hitting a login wall immediately.",
    descriptionRu: "Теперь можно опробовать холст Workbench до регистрации, а не сразу упираться в требование войти.",
  },
  {
    date: "2026-09-15", tag: "feature",
    titleEn: "Daily Digest launched",
    titleRu: "Запущен ежедневный дайджест",
    descriptionEn: "A daily recap page: yesterday's challenges, a featured tool of the day, an industry fact, and the current streak hall of fame.",
    descriptionRu: "Страница ежедневного дайджеста: вчерашние челленджи, инструмент дня, факт из индустрии и зал славы по текущим стрикам.",
  },
  {
    date: "2026-09-15", tag: "feature",
    titleEn: "Webhook Inspector and Signature Verifier",
    titleRu: "Webhook Inspector и проверка подписей",
    descriptionEn: "Capture real incoming HTTP requests at a generated public URL, and verify HMAC webhook signatures (GitHub/Stripe/Shopify/generic).",
    descriptionRu: "Перехват реальных входящих HTTP-запросов по сгенерированному публичному URL, плюс проверка HMAC-подписей вебхуков (GitHub/Stripe/Shopify/generic).",
  },
  {
    date: "2026-09-15", tag: "feature",
    titleEn: "Public Workbench gallery",
    titleRu: "Публичная галерея Workbench",
    descriptionEn: "Browse Workbench boards other people made public, and clone one straight into your own account.",
    descriptionRu: "Можно просматривать публичные доски Workbench других пользователей и клонировать понравившуюся себе в аккаунт.",
  },
  {
    date: "2026-09-14", tag: "feature",
    titleEn: "GitHub README score badge",
    titleRu: "SVG-бейдж Wrench Score для GitHub README",
    descriptionEn: "An embeddable SVG badge showing your Wrench Score, ready to drop into a GitHub README.",
    descriptionRu: "Встраиваемый SVG-бейдж с твоим Wrench Score — можно вставить прямо в GitHub README.",
  },
  {
    date: "2026-09-14", tag: "feature",
    titleEn: "People directory and search",
    titleRu: "Директория людей и поиск",
    descriptionEn: "A searchable directory of public profiles, filterable by tech stack and location.",
    descriptionRu: "Директория публичных профилей с поиском и фильтрами по стеку технологий и локации.",
  },
  {
    date: "2026-09-14", tag: "improvement",
    titleEn: "Profile page redesign",
    titleRu: "Редизайн страницы профиля",
    descriptionEn: "A new bento-style dashboard layout for the profile page, plus a selectable avatar emblem system.",
    descriptionRu: "Новая раскладка страницы профиля в стиле bento-дашборда, плюс система выбираемых эмблем аватара.",
  },
  {
    date: "2026-09-14", tag: "feature",
    titleEn: "Code trainer launched",
    titleRu: "Запущен тренажёр кода",
    descriptionEn: "Short JavaScript exercises with instant, sandboxed test checking — the base the real-project-scale exercises above later built on.",
    descriptionRu: "Короткие упражнения на JavaScript с мгновенной проверкой в песочнице — основа, на которой позже выросли упражнения \"в масштабе реального проекта\" выше.",
  },
  {
    date: "2026-09-13", tag: "feature",
    titleEn: "Crowd-sourced salary calculator",
    titleRu: "Калькулятор зарплат на реальных данных",
    descriptionEn: "Submit your own salary anonymously and see aggregated QA/developer compensation data from the community.",
    descriptionRu: "Можно анонимно отправить свою зарплату и увидеть агрегированные данные по зарплатам QA-инженеров и разработчиков от сообщества.",
  },
  {
    date: "2026-09-13", tag: "feature",
    titleEn: "Public profile pages",
    titleRu: "Публичные страницы профиля",
    descriptionEn: "A shareable public profile with your Wrench Score, banner, links, pinned challenges and tagline.",
    descriptionRu: "Публичная страница профиля со своим Wrench Score, баннером, ссылками, закреплёнными челленджами и тэглайном.",
  },
  {
    date: "2026-09-13", tag: "feature",
    titleEn: "Mock API sandbox",
    titleRu: "Песочница Mock API",
    descriptionEn: "Spin up fake REST endpoints for local testing and prototyping, served anonymously.",
    descriptionRu: "Можно поднять фейковые REST-эндпоинты для локального тестирования и прототипирования — анонимно и без регистрации.",
  },
];

// Чистая сортировка — без DOM/сети, тестируется без {page} (см.
// tests/changelog.spec.ts). Не полагается на порядок объявления
// объектов в CHANGELOG_ENTRIES выше — новую запись можно дописать куда
// угодно в массив, сортировка всё равно расставит по дате.
export function sortChangelogEntries(entries: ChangelogEntry[]): ChangelogEntry[] {
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export interface ChangelogMonthGroup {
  /** YYYY-MM */
  monthKey: string;
  entries: ChangelogEntry[];
}

// Группирует уже отсортированные (по убыванию даты) записи по месяцу —
// используется вместо ручного .reduce() прямо в компоненте, чтобы
// группировку можно было проверить без рендера страницы.
export function groupChangelogByMonth(sortedEntries: ChangelogEntry[]): ChangelogMonthGroup[] {
  const groups: ChangelogMonthGroup[] = [];
  for (const entry of sortedEntries) {
    const monthKey = entry.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.monthKey === monthKey) {
      last.entries.push(entry);
    } else {
      groups.push({ monthKey, entries: [entry] });
    }
  }
  return groups;
}

const MONTH_NAMES_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
// Именительный падеж ("Сентябрь 2026"), не родительный ("20 сентября") —
// это заголовок месяца сам по себе, а не часть даты.
const MONTH_NAMES_RU = ["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"];

/** "2026-09" -> "September 2026" / "Сентябрь 2026" */
export function formatChangelogMonthLabel(monthKey: string, isRu: boolean): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const monthIndex = Number(monthStr) - 1;
  if (Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return monthKey;
  if (isRu) {
    const name = MONTH_NAMES_RU[monthIndex];
    return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${yearStr}`;
  }
  return `${MONTH_NAMES_EN[monthIndex]} ${yearStr}`;
}
