import { KnowledgeRole } from "./content";

// ═══════════════════════════════════════════════════════
// Articles — the actual body content of the knowledge base.
// ═══════════════════════════════════════════════════════
// ROADMAPS (content.ts) are short bullet-point checklists — "what to
// learn, in what order" — and RESOURCES are one-line pointers to other
// people's content. Neither one is actually *content*: there was nothing
// on /knowledge you could read and walk away having learned something.
// This file is that: real, standalone articles written for this site,
// same depth as a good internal wiki page — the general knowledge that
// underpins the tools/challenges/trainer rather than tool-specific howto.
//
// Structure mirrors Roadmap's established inline-`*Ru`-sibling-fields
// convention (see content.ts) rather than introducing markdown/HTML body
// strings: every article is data, not prose-with-markup, so it renders
// through plain, themeable JSX (see components/knowledge/ArticleLayout.tsx)
// with no new rendering pipeline, no dangerouslySetInnerHTML, and no new
// dependency on the `marked` package (that one stays scoped to the
// unrelated Markdown Preview / Markdown-to-HTML dev tools, which render
// arbitrary user-pasted text, not our own authored content).

export interface ArticleSection {
  heading:     string;
  headingRu:   string;
  paragraphs:  string[];
  paragraphsRu: string[];
  bullets?:    string[];
  bulletsRu?:  string[];
}

export interface Article {
  slug:           string;
  role:           KnowledgeRole; // qa | frontend | backend | all ("all" = general, applies everywhere)
  title:          string;
  titleRu:        string;
  summary:        string;
  summaryRu:      string;
  readingMinutes: number;
  tags:           string[];
  sections:       ArticleSection[];
}

export const ARTICLES: Article[] = [
  // ─────────────────────────── QA ───────────────────────────
  {
    slug: "bug-report-that-gets-fixed",
    role: "qa",
    title: "How to Write a Bug Report That Actually Gets Fixed",
    titleRu: "Как писать баг-репорты, которые реально чинят",
    summary: "Most bug reports stall not because the bug isn't real, but because the report doesn't give a developer enough to act on. Here's the structure that fixes that.",
    summaryRu: "Большинство баг-репортов застревают не потому, что баг ненастоящий, а потому что репорт не даёт разработчику зацепиться. Вот структура, которая это решает.",
    readingMinutes: 5,
    tags: ["bug reports", "qa process", "communication", "triage"],
    sections: [
      {
        heading: "Why \"it doesn't work\" isn't a bug report",
        headingRu: "Почему «не работает» — это не баг-репорт",
        paragraphs: [
          "A one-line bug report forces the developer to do your investigation before they can do theirs: reconstruct the environment, guess the steps, guess the expected behavior. Every guess is a chance for the ticket to get closed as \"can't reproduce.\"",
          "The fix isn't writing more, it's writing the right five things: steps to reproduce, expected result, actual result, environment, and severity. A report with those five sections in three sentences beats a paragraph of prose without them.",
        ],
        paragraphsRu: [
          "Репорт в одну строку заставляет разработчика сначала провести твоё расследование, прежде чем начать своё: восстановить окружение, угадать шаги, угадать ожидаемое поведение. Каждая догадка — шанс, что тикет закроют как «не воспроизводится».",
          "Дело не в том, чтобы писать больше, а в том, чтобы писать правильные пять пунктов: шаги воспроизведения, ожидаемый результат, фактический результат, окружение и серьёзность. Репорт с этими пятью пунктами в трёх предложениях побеждает абзац прозы без них.",
        ],
      },
      {
        heading: "Steps to reproduce: write them for a stranger",
        headingRu: "Шаги воспроизведения: пиши их для незнакомца",
        paragraphs: [
          "Number every step and make each one a single action: \"1. Open /checkout. 2. Add item to cart. 3. Click Apply Coupon with an empty field.\" A developer should be able to follow your steps without asking a single clarifying question.",
          "Include the exact input you used, not a description of it — \"entered SAVE10\" beats \"entered a coupon code.\" If the bug only shows up with specific data (a long name, a negative number, a second browser tab), that data is part of the steps, not a footnote.",
        ],
        paragraphsRu: [
          "Нумеруй каждый шаг, и пусть каждый шаг будет одним действием: «1. Открыть /checkout. 2. Добавить товар в корзину. 3. Нажать «Применить купон» с пустым полем». Разработчик должен пройти по твоим шагам, не задав ни одного уточняющего вопроса.",
          "Указывай точные данные, которые использовал, а не их описание — «ввёл SAVE10» лучше, чем «ввёл код купона». Если баг проявляется только на определённых данных (длинное имя, отрицательное число, вторая вкладка браузера), эти данные — часть шагов воспроизведения, а не сноска.",
        ],
      },
      {
        heading: "Severity is not the same as your frustration",
        headingRu: "Серьёзность — это не то же самое, что твоё раздражение",
        paragraphs: [
          "Severity describes impact on the system (crashes, data loss, blocks a core flow); priority describes how soon it should be fixed. A typo in a tooltip and a checkout button that silently double-charges a card are both \"bugs,\" but confusing their severity either buries a critical issue or burns trust in your reports.",
          "Attach evidence proportional to the bug: a screenshot with the relevant area highlighted for a UI issue, a full network request/response and console log for an API issue, a screen recording for anything involving timing or a sequence of actions.",
        ],
        paragraphsRu: [
          "Серьёзность описывает влияние на систему (краши, потеря данных, блокировка ключевого сценария); приоритет — насколько срочно это чинить. Опечатка в тултипе и кнопка оплаты, которая тихо списывает деньги дважды, — обе «баги», но перепутать их серьёзность либо похоронит критическую проблему, либо подорвёт доверие к твоим репортам.",
          "Прикладывай доказательства соразмерно багу: скриншот с выделенной областью для UI-проблемы, полный запрос/ответ сети и консольный лог для API-проблемы, запись экрана для всего, что связано с таймингом или последовательностью действий.",
        ],
        bullets: [
          "Steps, expected, actual, environment, severity — every report, no exceptions",
          "Exact input data, not a paraphrase of it",
          "Evidence that matches the bug: screenshot, network log, or recording",
          "One bug per report — bundling issues slows down triage and fixes",
        ],
        bulletsRu: [
          "Шаги, ожидаемое, фактическое, окружение, серьёзность — в каждом репорте, без исключений",
          "Точные входные данные, а не их пересказ",
          "Доказательства по масштабу бага: скриншот, сетевой лог или запись",
          "Один баг — один репорт: объединение проблем замедляет разбор и починку",
        ],
      },
    ],
  },
  {
    slug: "test-case-design-techniques",
    role: "qa",
    title: "Test Case Design: Equivalence Partitioning and Boundary Values",
    titleRu: "Проектирование тест-кейсов: классы эквивалентности и граничные значения",
    summary: "You can't test every possible input. These two techniques tell you which small set of inputs actually covers all of them.",
    summaryRu: "Протестировать все возможные входные данные невозможно. Эти две техники подсказывают, какой небольшой набор данных реально покрывает их все.",
    readingMinutes: 6,
    tags: ["test design", "equivalence partitioning", "boundary value analysis", "qa fundamentals"],
    sections: [
      {
        heading: "The problem: infinite inputs, finite time",
        headingRu: "Проблема: бесконечность входных данных, конечность времени",
        paragraphs: [
          "An age field that accepts 0–120 has 121 valid values and an unbounded number of invalid ones. Testing every single one is impossible, and testing three random ones is guessing. Equivalence partitioning and boundary value analysis exist to turn \"guessing\" into a repeatable method.",
          "Both techniques rest on the same insight: inputs cluster into groups that the system is very likely to treat the same way. If age 45 is valid, age 46 is almost certainly handled by the same code path — so you don't need to test both, you need one representative from each group.",
        ],
        paragraphsRu: [
          "Поле возраста, принимающее 0–120, — это 121 валидное значение и неограниченное число невалидных. Проверить каждое отдельно невозможно, а проверить три случайных — это угадывание. Классы эквивалентности и граничные значения превращают «угадывание» в повторяемый метод.",
          "Обе техники опираются на одну идею: входные данные группируются в кластеры, которые система, скорее всего, обработает одинаково. Если возраст 45 валиден, возраст 46 почти наверняка проходит по тому же пути кода — значит, тестировать нужно не оба, а по одному представителю от каждой группы.",
        ],
      },
      {
        heading: "Equivalence partitioning: one representative per group",
        headingRu: "Классы эквивалентности: один представитель на группу",
        paragraphs: [
          "Split the input space into partitions where every value in a partition should produce the same kind of result. For the age field: invalid-too-low (negative numbers), valid (0–120), invalid-too-high (121+), and invalid-format (letters, empty, decimals) are four partitions — test one value from each, not twenty.",
          "The discipline is deciding the partitions before picking values, not after. Picking 5, 50, and 200 and calling it \"coverage\" without first naming the partitions is how edge cases like an empty string or a negative number quietly never get tested.",
        ],
        paragraphsRu: [
          "Раздели пространство входных данных на классы так, чтобы каждое значение внутри класса давало один и тот же тип результата. Для поля возраста: невалидно-слишком-мало (отрицательные числа), валидно (0–120), невалидно-слишком-много (121+) и невалидно-по-формату (буквы, пустота, дробные) — четыре класса, из каждого нужно одно значение, а не двадцать.",
          "Дисциплина в том, чтобы определить классы до выбора значений, а не после. Взять 5, 50 и 200 и назвать это «покрытием», не назвав сначала классы, — именно так пустая строка или отрицательное число тихо остаются непротестированными.",
        ],
      },
      {
        heading: "Boundary value analysis: bugs live on the edges",
        headingRu: "Граничные значения: баги живут на границах",
        paragraphs: [
          "Off-by-one errors are the most common bug class in software, and they only show up exactly at a boundary — which is why boundary value analysis tests the edge of each partition, not its middle. For a 0–120 range: test -1, 0, 1, 119, 120, 121, not 60.",
          "Combine both techniques and the age field goes from an untestable infinity to six concrete, justified test cases — small enough to actually run every time, and precise enough to catch the class of bug that a midpoint value like 45 will never reveal.",
        ],
        paragraphsRu: [
          "Ошибки на единицу (off-by-one) — самый частый класс багов в софте, и они проявляются именно на границе, поэтому анализ граничных значений тестирует край каждого класса, а не его середину. Для диапазона 0–120: проверяем -1, 0, 1, 119, 120, 121, а не 60.",
          "Комбинация обеих техник превращает поле возраста из непроверяемой бесконечности в шесть конкретных, обоснованных тест-кейсов — достаточно мало, чтобы реально прогонять их каждый раз, и достаточно точно, чтобы поймать класс бага, который срединное значение вроде 45 никогда не покажет.",
        ],
        bullets: [
          "Name the partitions first, then pick one value per partition",
          "Always test the boundary itself, one below it, and one above it",
          "A midpoint value (like age 45) almost never finds a real bug",
          "Six well-chosen values beat sixty random ones",
        ],
        bulletsRu: [
          "Сначала назови классы, потом выбери по одному значению из каждого",
          "Всегда проверяй саму границу, значение ниже и значение выше неё",
          "Срединное значение (вроде возраста 45) почти никогда не находит реальный баг",
          "Шесть удачно выбранных значений лучше шестидесяти случайных",
        ],
      },
    ],
  },
  {
    slug: "test-pyramid-explained",
    role: "qa",
    title: "The Test Pyramid: Why Most of Your Tests Shouldn't Be End-to-End",
    titleRu: "Пирамида тестирования: почему большинство тестов не должны быть end-to-end",
    summary: "E2E tests catch the most realistic bugs and are the slowest, flakiest, and most expensive to maintain. The pyramid is the shape that keeps that trade-off under control.",
    summaryRu: "E2E-тесты находят самые реалистичные баги и при этом самые медленные, нестабильные и дорогие в поддержке. Пирамида — это форма, которая держит этот компромисс под контролем.",
    readingMinutes: 5,
    tags: ["test pyramid", "e2e testing", "unit testing", "test strategy"],
    sections: [
      {
        heading: "Three layers, three different jobs",
        headingRu: "Три слоя, три разные задачи",
        paragraphs: [
          "Unit tests check one function or component in isolation, with everything around it mocked — fast (milliseconds), cheap to write, and precise about what broke when they fail. Integration tests check that two or more real pieces work together (a service and a real database, for instance) — slower, and they catch the bugs unit tests structurally cannot: wiring problems.",
          "End-to-end tests drive the real application through a real browser against something close to production — they're the only layer that proves a user can actually complete a flow, and also the slowest, most environment-sensitive, and most likely to fail for reasons that have nothing to do with the code being wrong.",
        ],
        paragraphsRu: [
          "Юнит-тесты проверяют одну функцию или компонент в изоляции, с замоканным окружением — быстрые (миллисекунды), дёшево пишутся и точно показывают, что именно сломалось. Интеграционные тесты проверяют, что несколько реальных частей работают вместе (например, сервис и настоящая база данных) — медленнее, зато ловят баги, которые юнит-тесты структурно не могут найти: проблемы стыковки.",
          "End-to-end тесты гоняют настоящее приложение через настоящий браузер к чему-то, близкому к продакшену — это единственный слой, который доказывает, что пользователь реально может пройти сценарий, и одновременно самый медленный, самый чувствительный к окружению и самый склонный падать по причинам, не связанным с багом в коде.",
        ],
      },
      {
        heading: "Why the shape is a pyramid, not a rectangle",
        headingRu: "Почему форма — пирамида, а не прямоугольник",
        paragraphs: [
          "The classic guidance is: many unit tests, fewer integration tests, and a small number of E2E tests covering only the critical paths (login, checkout, the core action your product exists for) — not every possible click sequence. Inverting that shape (an \"ice cream cone\": mostly E2E, few unit tests) is a common real-world failure mode, not a strawman.",
          "An ice-cream-cone suite is slow to run, flaky in CI (a UI test can fail because an animation took 50ms longer, not because anything is broken), and painful to debug — a failing E2E test tells you a flow broke, not which line. The pyramid isn't dogma about ratios; it's a reminder that cheaper, faster, more precise layers should catch what they can before the expensive layer has to.",
        ],
        paragraphsRu: [
          "Классическая рекомендация: много юнит-тестов, меньше интеграционных, и небольшое число E2E-тестов, покрывающих только критические пути (логин, оформление заказа, ключевое действие продукта), а не каждую возможную последовательность кликов. Перевёрнутая форма («мороженое»: в основном E2E, мало юнит-тестов) — реальный, а не выдуманный провальный паттерн.",
          "Набор в форме мороженого медленно прогоняется, нестабилен в CI (UI-тест может упасть из-за того, что анимация заняла на 50мс дольше, а не потому что что-то реально сломано), и его больно отлаживать — упавший E2E-тест говорит, что сценарий сломан, но не в какой строке. Пирамида — не догма о пропорциях, а напоминание, что более дешёвые, быстрые и точные слои должны ловить то, что могут, прежде чем это дойдёт до дорогого слоя.",
        ],
      },
      {
        heading: "Deciding which layer a new test belongs in",
        headingRu: "Как выбрать, в какой слой поместить новый тест",
        paragraphs: [
          "Ask what would actually break the thing you're testing. Pure logic (a discount calculation, a validation rule) belongs in a unit test — spinning up a browser to check that 10% off $50 equals $45 is testing the browser, not the logic. A flow that only fails when real systems interact (auth redirect, a webhook, a third-party payment callback) needs an integration or E2E test, because a unit test with everything mocked can't see that kind of bug by construction.",
          "In practice this means most bugs should be caught before a PR ever reaches an E2E suite — a healthy pyramid isn't one where E2E tests never fail, it's one where they fail rarely, and specifically about things only they could have caught.",
        ],
        paragraphsRu: [
          "Спроси, что реально может сломать проверяемую вещь. Чистая логика (расчёт скидки, правило валидации) — это юнит-тест: поднимать браузер, чтобы проверить, что 10% от $50 равно $45, значит тестировать браузер, а не логику. Сценарий, который ломается только при взаимодействии реальных систем (редирект авторизации, вебхук, коллбэк платёжной системы), требует интеграционного или E2E теста, потому что юнит-тест с замоканным всем структурно не может увидеть такой баг.",
          "На практике это означает, что большинство багов должны отлавливаться до того, как PR вообще дойдёт до E2E-набора — здоровая пирамида не та, где E2E-тесты никогда не падают, а та, где они падают редко и именно по тем причинам, которые больше никто не мог поймать.",
        ],
        bullets: [
          "Unit: pure logic, one unit, everything else mocked, milliseconds",
          "Integration: two or more real pieces wired together",
          "E2E: critical user flows only, through a real browser",
          "If a unit test could have caught it, it shouldn't need an E2E test to",
        ],
        bulletsRu: [
          "Юнит: чистая логика, один модуль, всё остальное замокано, миллисекунды",
          "Интеграционный: несколько реальных частей, состыкованных вместе",
          "E2E: только критические пользовательские сценарии, через настоящий браузер",
          "Если баг мог поймать юнит-тест, для этого не должен быть нужен E2E-тест",
        ],
      },
    ],
  },
  {
    slug: "flaky-tests-why-and-how-to-fix",
    role: "qa",
    title: "Flaky Tests: Why They Happen and How to Actually Fix Them",
    titleRu: "Нестабильные тесты: почему они возникают и как их реально починить",
    summary: "A test that passes and fails without any code changing isn't a mystery — it almost always has one of a handful of specific causes.",
    summaryRu: "Тест, который то проходит, то падает без изменений в коде, — это не загадка. Почти всегда за этим стоит одна из нескольких конкретных причин.",
    readingMinutes: 5,
    tags: ["flaky tests", "test automation", "ci", "debugging"],
    sections: [
      {
        heading: "\"Just re-run it\" is how flaky suites are born",
        headingRu: "«Просто перезапусти» — вот как рождаются нестабильные наборы",
        paragraphs: [
          "Re-running a failed test until it passes feels harmless once. Done as a habit, it trains the whole team to stop trusting red builds, which is the actual damage flaky tests do — not the individual failure, but the erosion of \"CI failed\" meaning \"something is actually wrong.\" Once that trust is gone, real regressions start slipping through a suite nobody believes anymore.",
          "The fix starts with treating flakiness as a bug in the test (or the thing it's testing), not as noise to route around — which means the re-run has to be followed by an investigation, not replace one.",
        ],
        paragraphsRu: [
          "Перезапустить упавший тест до зелёного один раз кажется безобидным. Как привычка это отучает всю команду доверять красным билдам — и это реальный вред от нестабильных тестов, не сам факт падения, а то, что «CI упал» перестаёт значить «что-то реально не так». Когда это доверие потеряно, настоящие регрессии начинают проходить сквозь набор, в который уже никто не верит.",
          "Починка начинается с того, чтобы считать нестабильность багом (в тесте или в том, что он тестирует), а не шумом, который можно объехать перезапуском — то есть перезапуск должен сопровождаться расследованием, а не заменять его.",
        ],
      },
      {
        heading: "The four causes that cover almost every flaky test",
        headingRu: "Четыре причины, которые покрывают почти все нестабильные тесты",
        paragraphs: [
          "Race conditions: the test asserts on something before the app finished producing it — clicking a button and immediately checking for a result that renders 100ms later. Shared state: two tests write to the same database row, mock server, or global variable and interfere with each other when run in parallel or in a different order.",
          "Hardcoded waits and timing assumptions: a fixed sleep(2000) that's usually enough but not on a slower CI runner. External dependencies: a real third-party API, a real clock (a test that breaks every year on December 31st), or network flakiness that has nothing to do with the code under test.",
        ],
        paragraphsRu: [
          "Гонки состояний: тест проверяет результат до того, как приложение успело его произвести — клик по кнопке и мгновенная проверка результата, который отрисовывается через 100мс. Общее состояние: два теста пишут в одну и ту же строку БД, мок-сервер или глобальную переменную и мешают друг другу при параллельном запуске или в другом порядке.",
          "Захардкоженные ожидания и предположения о тайминге: фиксированный sleep(2000), которого обычно хватает, но не на более медленном CI-раннере. Внешние зависимости: реальный сторонний API, реальные часы (тест, который ломается каждый год 31 декабря), или нестабильность сети, вообще не связанная с тестируемым кодом.",
        ],
      },
      {
        heading: "Fix the cause, not the symptom",
        headingRu: "Чини причину, а не симптом",
        paragraphs: [
          "Race conditions get fixed with explicit waits for a condition (\"wait until this element is visible\"), never a fixed sleep — a sleep just picks a number you hope is big enough. Shared state gets fixed with test isolation: a fresh database transaction per test, a unique identifier per test run instead of a shared fixture.",
          "External dependencies get fixed by mocking them at the boundary you don't own — you're testing your code's handling of the payment provider's response, not the payment provider's uptime. If a test still fails intermittently after this, log everything on failure (network calls, timestamps, state snapshots) so the next failure is a five-minute diagnosis instead of another guess.",
        ],
        paragraphsRu: [
          "Гонки состояний чинятся явным ожиданием условия («ждать, пока элемент не станет видимым»), а не фиксированным sleep — sleep просто подбирает число, на которое надеешься. Общее состояние чинится изоляцией тестов: отдельная транзакция БД на тест, уникальный идентификатор на прогон вместо общей фикстуры.",
          "Внешние зависимости чинятся моком на границе, которую ты не контролируешь — ты тестируешь, как твой код обрабатывает ответ платёжного провайдера, а не аптайм самого провайдера. Если тест всё равно иногда падает после этого, логируй всё при падении (сетевые вызовы, таймстемпы, снепшоты состояния), чтобы следующее падение было пятиминутной диагностикой, а не очередной догадкой.",
        ],
        bullets: [
          "Never silence a flaky test by deleting or skipping it without understanding why",
          "Replace fixed sleeps with waits on an actual condition",
          "Give every test its own isolated data, never a shared fixture",
          "Mock third-party systems at the boundary; don't depend on their uptime",
        ],
        bulletsRu: [
          "Никогда не глуши нестабильный тест удалением или skip без понимания причины",
          "Заменяй фиксированные sleep на ожидание реального условия",
          "Давай каждому тесту свои изолированные данные, а не общую фикстуру",
          "Мокай сторонние системы на границе; не завись от их аптайма",
        ],
      },
    ],
  },

  // ─────────────────────────── Frontend ───────────────────────────
  {
    slug: "web-accessibility-basics",
    role: "frontend",
    title: "Web Accessibility Basics for Developers Who Aren't Designers",
    titleRu: "Основы доступности (a11y) для разработчиков, которые не дизайнеры",
    summary: "Most accessibility problems aren't exotic — they're a handful of habits that are just as easy to get right as to get wrong, once you know what to check.",
    summaryRu: "Большинство проблем с доступностью не экзотика — это горстка привычек, которые так же легко делать правильно, как и неправильно, если знать, что проверять.",
    readingMinutes: 6,
    tags: ["accessibility", "a11y", "semantic html", "frontend"],
    sections: [
      {
        heading: "Accessibility is a correctness bug, not a nice-to-have",
        headingRu: "Доступность — это баг корректности, а не приятный бонус",
        paragraphs: [
          "A button that only works with a mouse click, with no keyboard equivalent, doesn't work for a screen-reader user or anyone navigating by keyboard — that's not a missing feature, it's the same class of problem as a button that only works in Chrome. Roughly one in six people has some form of disability that can affect how they use the web, which makes this a mainstream compatibility concern, not an edge case.",
          "It's also cheaper to build in than to retrofit — the fixes below are mostly about using the right HTML element from the start, which costs nothing extra once it's habit.",
        ],
        paragraphsRu: [
          "Кнопка, которая работает только по клику мышью, без клавиатурного эквивалента, не работает для пользователя скринридера или любого, кто навигирует с клавиатуры — это не недостающая фича, а та же категория проблемы, что кнопка, работающая только в Chrome. Примерно у каждого шестого человека есть та или иная форма инвалидности, влияющая на использование веба, — это массовая проблема совместимости, а не краевой случай.",
          "Заложить доступность изначально дешевле, чем переделывать потом — приведённые ниже исправления в основном сводятся к использованию правильного HTML-элемента с самого начала, что не стоит ничего лишнего, если это уже привычка.",
        ],
      },
      {
        heading: "Semantic HTML solves most of it for free",
        headingRu: "Семантический HTML решает большую часть проблем бесплатно",
        paragraphs: [
          "A <button> gets keyboard focus, Enter/Space activation, and the correct screen-reader announcement automatically. A <div onClick> gets none of that — you'd have to hand-implement tabindex, a keydown handler, and an ARIA role just to match what <button> already does. The rule of thumb: reach for a semantic element (button, a, nav, header, label) before reaching for a generic div or span with a click handler bolted on.",
          "Images need an alt attribute that describes what the image conveys, not what it depicts pixel-for-pixel — alt=\"Submit\" on an icon button is more useful than alt=\"a blue arrow icon\". Purely decorative images get alt=\"\" so a screen reader skips them instead of reading a meaningless filename.",
        ],
        paragraphsRu: [
          "У <button> автоматически есть фокус по клавиатуре, активация по Enter/Space и корректное озвучивание скринридером. У <div onClick> ничего из этого нет — пришлось бы вручную реализовывать tabindex, обработчик keydown и ARIA-роль, просто чтобы сравняться с тем, что <button> уже умеет. Правило: тянуться к семантическому элементу (button, a, nav, header, label) раньше, чем к обычному div или span с навешанным onClick.",
          "У картинок должен быть атрибут alt, описывающий смысл изображения, а не его пиксели — alt=\"Отправить\" на иконке-кнопке полезнее, чем alt=\"иконка синей стрелки\". Чисто декоративные изображения получают alt=\"\", чтобы скринридер их пропускал, а не зачитывал бессмысленное имя файла.",
        ],
      },
      {
        heading: "Two checks anyone can run in five minutes",
        headingRu: "Две проверки, которые любой может сделать за пять минут",
        paragraphs: [
          "Unplug your mouse and try to complete your main user flow using only Tab, Shift+Tab, and Enter. If you can't reach a control, can't tell which element is focused, or get trapped inside a modal with no way out, a keyboard user hits the exact same wall.",
          "Run an automated checker (axe DevTools or Lighthouse's accessibility audit, both free browser extensions) on your page. Automated tools only catch roughly a third of real issues — they're excellent at flagging missing alt text and low color contrast, but they can't tell you if your alt text is actually a good description, so the keyboard check above still matters.",
        ],
        paragraphsRu: [
          "Отключи мышь и попробуй пройти основной пользовательский сценарий, используя только Tab, Shift+Tab и Enter. Если не можешь добраться до контрола, не понимаешь, какой элемент в фокусе, или застреваешь внутри модалки без выхода — пользователь с клавиатурой упирается ровно в ту же стену.",
          "Прогони автоматический чекер (axe DevTools или аудит доступности в Lighthouse, оба — бесплатные расширения браузера) по странице. Автоматические инструменты ловят примерно треть реальных проблем — они отлично находят отсутствующий alt и низкий контраст, но не могут сказать, хорошее ли у тебя описание в alt, поэтому проверка клавиатурой выше всё равно важна.",
        ],
        bullets: [
          "Prefer semantic elements over a div/span with a click handler",
          "Every interactive element must be reachable and usable by keyboard alone",
          "alt describes meaning, not pixels; decorative images get alt=\"\"",
          "Automated checkers catch ~30% of issues — a manual keyboard pass catches the rest",
        ],
        bulletsRu: [
          "Предпочитай семантические элементы div/span с навешанным onClick",
          "Каждый интерактивный элемент должен быть достижим и управляем только клавиатурой",
          "alt описывает смысл, а не пиксели; у декоративных изображений alt=\"\"",
          "Автоматические чекеры ловят ~30% проблем — ручной прогон клавиатурой ловит остальное",
        ],
      },
    ],
  },
  {
    slug: "rendering-patterns-csr-ssr-ssg",
    role: "frontend",
    title: "CSR vs SSR vs SSG: What's Actually Different and When It Matters",
    titleRu: "CSR vs SSR vs SSG: в чём реальная разница и когда она важна",
    summary: "The three-letter acronyms describe one thing: where and when your HTML actually gets built. That choice changes load speed, SEO, and server cost.",
    summaryRu: "Эти аббревиатуры описывают одно: где и когда на самом деле собирается HTML. От этого выбора зависят скорость загрузки, SEO и стоимость сервера.",
    readingMinutes: 6,
    tags: ["ssr", "csr", "ssg", "rendering", "frontend performance"],
    sections: [
      {
        heading: "The one question that separates all three",
        headingRu: "Один вопрос, который различает все три подхода",
        paragraphs: [
          "Every rendering strategy answers the same question differently: when is the HTML for this page generated — once at build time, fresh on every request, or in the visitor's browser after the page loads? That single decision cascades into everything else: how fast the first pixel appears, whether a search engine crawler sees real content, and how much your servers have to do per visit.",
          "Client-Side Rendering (CSR) ships a nearly empty HTML shell plus a JavaScript bundle; the browser builds the actual page after downloading and running that bundle. It's simple to reason about and cheap to host (the server just serves static files), but the visitor sees a blank page until the JavaScript finishes loading and running.",
        ],
        paragraphsRu: [
          "Каждая стратегия рендеринга отвечает на один и тот же вопрос по-разному: когда генерируется HTML этой страницы — один раз при сборке, заново при каждом запросе, или в браузере посетителя после загрузки страницы? Это единственное решение определяет всё остальное: как быстро появится первый пиксель, увидит ли поисковый краулер реальный контент, и сколько работы серверу нужно делать на каждый визит.",
          "Client-Side Rendering (CSR) отдаёт почти пустую HTML-оболочку и JS-бандл; браузер собирает реальную страницу после загрузки и выполнения этого бандла. Это просто в понимании и дёшево в хостинге (сервер просто отдаёт статику), но посетитель видит пустую страницу, пока JS не загрузится и не выполнится.",
        ],
      },
      {
        heading: "SSR: fresh HTML, built on every request",
        headingRu: "SSR: свежий HTML, собираемый на каждый запрос",
        paragraphs: [
          "Server-Side Rendering runs your component code on the server for every request and sends back complete HTML — the visitor sees real content immediately, and a search engine crawler doesn't need to execute JavaScript to read the page. This matters most for pages where content changes per-request: a logged-in dashboard, search results, anything personalized.",
          "The cost is exactly what the benefit implies: the server does real work (rendering, and usually a data fetch) on every single request, which is slower and more expensive to run at scale than serving a pre-built file.",
        ],
        paragraphsRu: [
          "Server-Side Rendering выполняет код компонентов на сервере при каждом запросе и отдаёт готовый HTML — посетитель сразу видит реальный контент, а поисковому краулеру не нужно выполнять JavaScript, чтобы прочитать страницу. Это важнее всего для страниц, где контент меняется от запроса к запросу: личный кабинет, результаты поиска, всё персонализированное.",
          "Цена — ровно то, что подразумевает выгода: сервер выполняет реальную работу (рендеринг и обычно запрос данных) на каждый отдельный запрос, что медленнее и дороже в масштабе, чем отдать заранее собранный файл.",
        ],
      },
      {
        heading: "SSG: built once, served forever (until the next deploy)",
        headingRu: "SSG: собран один раз, отдаётся вечно (до следующего деплоя)",
        paragraphs: [
          "Static Site Generation builds every page's HTML once, at build/deploy time, and serves the identical pre-built file to every visitor — the fastest possible response, since there's no per-request work at all, and it's trivially cacheable on a CDN. It only fits content that's the same for everyone and doesn't need to change between deploys: a blog post, documentation, a marketing page.",
          "The practical decision rule: does this page's content depend on who's asking or when they ask? If no, SSG. If yes but SEO and first-paint speed matter, SSR. If it's behind a login and SEO is irrelevant, CSR is often the simplest and cheapest choice. Most real apps mix all three across different routes rather than picking one for the whole site.",
        ],
        paragraphsRu: [
          "Static Site Generation собирает HTML каждой страницы один раз, во время сборки/деплоя, и отдаёт идентичный заранее собранный файл каждому посетителю — максимально быстрый ответ, поскольку работы на запрос вообще нет, и это тривиально кешируется на CDN. Подходит только для контента, одинакового для всех и не меняющегося между деплоями: статья блога, документация, маркетинговая страница.",
          "Практическое правило выбора: зависит ли контент страницы от того, кто спрашивает, или от момента запроса? Если нет — SSG. Если да, но важны SEO и скорость первой отрисовки — SSR. Если страница за логином и SEO не важен, CSR часто самый простой и дешёвый выбор. Большинство реальных приложений комбинируют все три подхода на разных маршрутах, а не выбирают один на весь сайт.",
        ],
        bullets: [
          "CSR: empty shell + JS, page builds in the browser — cheap to host, slow first paint",
          "SSR: HTML built on the server per request — fast first paint, real server cost",
          "SSG: HTML built once at deploy time — fastest possible, only fits non-personalized content",
          "Pick per-route based on whether content depends on who's asking, not once for the whole site",
        ],
        bulletsRu: [
          "CSR: пустая оболочка + JS, страница собирается в браузере — дёшево в хостинге, медленная первая отрисовка",
          "SSR: HTML собирается на сервере на каждый запрос — быстрая отрисовка, реальная нагрузка на сервер",
          "SSG: HTML собран один раз при деплое — максимально быстро, подходит только неперсонализированному контенту",
          "Выбирай на уровне маршрута по тому, зависит ли контент от того, кто спрашивает, а не одним решением на весь сайт",
        ],
      },
    ],
  },
  {
    slug: "browser-caching-explained",
    role: "frontend",
    title: "Browser Caching Explained: Cache-Control, ETags, and Why Your Update Didn't Show Up",
    titleRu: "Кеширование в браузере: Cache-Control, ETag и почему обновление не появилось",
    summary: "\"It works after a hard refresh\" is almost always a caching header problem, not a bug in your code. Here's what's actually deciding what gets cached.",
    summaryRu: "«Работает после жёсткого обновления» — это почти всегда проблема заголовков кеширования, а не баг в коде. Вот что на самом деле решает, что кешируется.",
    readingMinutes: 5,
    tags: ["caching", "cache-control", "etag", "http headers", "performance"],
    sections: [
      {
        heading: "Cache-Control is the instruction, not a suggestion",
        headingRu: "Cache-Control — это инструкция, а не пожелание",
        paragraphs: [
          "The Cache-Control response header tells the browser exactly how to treat a file: max-age=31536000 means \"reuse this for up to a year without even asking the server,\" while no-store means \"never cache this, full stop.\" When a deployed change doesn't show up for a user, the first thing to check is this header on the changed file, not the code itself.",
          "This is also why cache-busting file names exist: main.a3f9c1.js instead of main.js. Since the browser won't re-check a long-max-age file at all, the only reliable way to force a genuinely new version to load is to give it a genuinely new URL — the hash in the filename changes automatically whenever the file's contents change.",
        ],
        paragraphsRu: [
          "Заголовок ответа Cache-Control точно указывает браузеру, как обращаться с файлом: max-age=31536000 значит «переиспользуй это до года, даже не спрашивая сервер», а no-store — «никогда не кешируй, точка». Когда задеплоенное изменение не появляется у пользователя, первое, что стоит проверить, — этот заголовок на изменённом файле, а не сам код.",
          "Именно поэтому существуют имена файлов с cache-busting: main.a3f9c1.js вместо main.js. Раз браузер вообще не будет перепроверять файл с большим max-age, единственный надёжный способ заставить загрузиться реально новую версию — дать ей реально новый URL; хеш в имени файла меняется автоматически при изменении содержимого.",
        ],
      },
      {
        heading: "ETags: cheaper re-validation instead of a fresh download",
        headingRu: "ETag: дешёвая ревалидация вместо повторной загрузки",
        paragraphs: [
          "An ETag is a fingerprint of the file's content. When a cached file's max-age expires, the browser doesn't necessarily re-download it — it sends the stored ETag back to the server (If-None-Match). If the file hasn't changed, the server replies 304 Not Modified with no body at all, and the browser keeps using its cached copy.",
          "This is why a 304 in your network tab isn't an error — it's the caching system working exactly as designed, saving the full download while still confirming freshness. It only becomes a bug when a file that did change keeps returning 304, which means the server is computing the ETag from something that doesn't actually reflect the new content.",
        ],
        paragraphsRu: [
          "ETag — это отпечаток содержимого файла. Когда max-age кешированного файла истекает, браузер не обязательно скачивает его заново — он отправляет сохранённый ETag серверу (If-None-Match). Если файл не изменился, сервер отвечает 304 Not Modified без тела вообще, и браузер продолжает использовать кешированную копию.",
          "Поэтому 304 в сетевой вкладке — не ошибка, а система кеширования, работающая ровно так, как задумано: экономит полную загрузку, при этом подтверждая актуальность. Багом это становится только тогда, когда изменившийся файл продолжает возвращать 304 — значит, сервер вычисляет ETag из чего-то, что не отражает новое содержимое.",
        ],
      },
      {
        heading: "A practical policy for two kinds of assets",
        headingRu: "Практическая политика для двух видов файлов",
        paragraphs: [
          "Hashed, versioned assets (main.a3f9c1.js, logo.b7e2.png) can safely take an aggressive Cache-Control: max-age=31536000, immutable — they'll never change under that URL, since a content change produces a new hash and a new URL. The HTML document that references them should generally do the opposite: Cache-Control: no-cache (which, confusingly, still allows caching, but forces revalidation on every load) so visitors always get the reference to the latest hashed assets.",
          "Get this pairing backwards — long caching on the HTML, no caching on the hashed assets — and you get exactly the symptom that sends people searching for this topic: a page that looks stale for some users and fine for others, with nothing in the code to explain the difference.",
        ],
        paragraphsRu: [
          "Хешированные, версионированные файлы (main.a3f9c1.js, logo.b7e2.png) можно безопасно кешировать агрессивно — Cache-Control: max-age=31536000, immutable — они никогда не изменятся под этим URL, поскольку изменение содержимого даёт новый хеш и новый URL. HTML-документ, который на них ссылается, обычно должен получать обратное: Cache-Control: no-cache (что, как ни странно, всё ещё разрешает кеширование, но требует ревалидации при каждой загрузке), чтобы посетители всегда получали ссылку на актуальные хешированные файлы.",
          "Перепутать эту пару — долгое кеширование HTML, отсутствие кеширования хешированных файлов — и получаешь ровно тот симптом, из-за которого люди ищут эту тему: страница выглядит устаревшей у одних пользователей и нормальной у других, и в коде ничего не объясняет разницу.",
        ],
        bullets: [
          "Cache-Control decides caching behavior; check it before suspecting a code bug",
          "A 304 response is the cache working correctly, not an error",
          "Hashed assets: cache aggressively — the URL changes when the content does",
          "The HTML that references those assets: cache lightly, so it always points at the latest hash",
        ],
        bulletsRu: [
          "Cache-Control определяет поведение кеша; проверяй его прежде, чем подозревать баг в коде",
          "Ответ 304 — это кеш, работающий правильно, а не ошибка",
          "Хешированные файлы: кешируй агрессивно — URL меняется вместе с содержимым",
          "HTML, ссылающийся на эти файлы: кешируй слабо, чтобы он всегда указывал на актуальный хеш",
        ],
      },
    ],
  },

  // ─────────────────────────── Backend ───────────────────────────
  {
    slug: "database-indexing-basics",
    role: "backend",
    title: "Database Indexing: Why Your Query Is Slow and What to Do About It",
    titleRu: "Индексы в базах данных: почему запрос медленный и что с этим делать",
    summary: "An index turns \"scan every row\" into \"look it up directly.\" Most slow-query problems come down to a missing one, or the wrong one.",
    summaryRu: "Индекс превращает «просканировать каждую строку» в «найти напрямую». Большинство проблем с медленными запросами сводится к отсутствующему или неправильному индексу.",
    readingMinutes: 6,
    tags: ["database", "indexing", "sql performance", "backend"],
    sections: [
      {
        heading: "Without an index, every WHERE is a full scan",
        headingRu: "Без индекса каждый WHERE — это полное сканирование",
        paragraphs: [
          "SELECT * FROM users WHERE email = 'x@example.com' with no index on email forces the database to check every single row in the table, in order, to find matches — this is called a sequential scan. On a table with a hundred rows that's instant; on a table with fifty million rows, it's the query that's timing out your API.",
          "An index is a separate, pre-sorted data structure (typically a B-tree) that maps values in a column to the location of their rows, letting the database jump almost directly to matching rows instead of checking every one — the same reason a book's index lets you find a topic without reading every page.",
        ],
        paragraphsRu: [
          "SELECT * FROM users WHERE email = 'x@example.com' без индекса на email заставляет базу проверить каждую строку таблицы по порядку в поисках совпадений — это называется последовательным сканированием. На таблице в сотню строк это мгновенно; на таблице в пятьдесят миллионов — это тот самый запрос, из-за которого таймаутится API.",
          "Индекс — это отдельная, заранее отсортированная структура данных (обычно B-дерево), которая сопоставляет значения колонки с расположением их строк, позволяя базе почти напрямую перейти к нужным строкам вместо проверки каждой — так же индекс в книге позволяет найти тему, не читая каждую страницу.",
        ],
      },
      {
        heading: "Indexes aren't free — they cost writes and disk",
        headingRu: "Индексы не бесплатны — они стоят записей и диска",
        paragraphs: [
          "Every index has to be updated on every INSERT, UPDATE, and DELETE that touches its column, so an over-indexed table trades slow reads for slow writes and extra disk space. This is why the answer to slow queries is never \"index every column\" — it's \"index the columns that actually appear in WHERE, JOIN, and ORDER BY clauses on your slow, frequently-run queries.\"",
          "A composite index (covering multiple columns, like (user_id, created_at)) is generally more useful than two separate single-column indexes if your queries consistently filter or sort by that same combination — but column order in a composite index matters: it's efficient for WHERE user_id = X AND created_at > Y, and much less useful for a query that only filters on created_at alone.",
        ],
        paragraphsRu: [
          "Каждый индекс приходится обновлять при каждом INSERT, UPDATE и DELETE, затрагивающем его колонку, поэтому переиндексированная таблица меняет медленное чтение на медленную запись и лишнее место на диске. Поэтому ответ на медленные запросы никогда не «индексируй каждую колонку» — это «индексируй те колонки, что реально встречаются в WHERE, JOIN и ORDER BY твоих медленных, часто выполняемых запросов».",
          "Составной индекс (покрывающий несколько колонок, например (user_id, created_at)) обычно полезнее двух отдельных однoколоночных индексов, если запросы стабильно фильтруют или сортируют по этой же комбинации — но порядок колонок в составном индексе важен: он эффективен для WHERE user_id = X AND created_at > Y, и куда менее полезен для запроса, фильтрующего только по created_at.",
        ],
      },
      {
        heading: "Finding the actual problem: EXPLAIN, not guessing",
        headingRu: "Найти реальную проблему: EXPLAIN, а не догадки",
        paragraphs: [
          "Every major SQL database has an EXPLAIN (or EXPLAIN ANALYZE) command that shows exactly how it plans to execute a query — whether it's using an index or falling back to a sequential scan, and roughly how many rows it expects to touch. Run it on the actual slow query before adding any index; adding an index blind is how tables end up with five unused ones that only slow down writes.",
          "A sequential scan isn't automatically wrong, either — on a small table, or a query that legitimately needs most of the rows anyway, a scan can be faster than the overhead of using an index. The database's query planner already makes this call automatically; EXPLAIN just lets you see and verify its reasoning instead of guessing at it.",
        ],
        paragraphsRu: [
          "В каждой крупной SQL-базе есть команда EXPLAIN (или EXPLAIN ANALYZE), которая точно показывает, как она планирует выполнить запрос — использует ли индекс или откатывается к последовательному сканированию, и примерно сколько строк ожидает затронуть. Прогоняй её на реальном медленном запросе перед добавлением любого индекса; добавление индекса вслепую — вот как таблицы обрастают пятью неиспользуемыми индексами, которые только замедляют запись.",
          "Последовательное сканирование не всегда автоматически плохо — на маленькой таблице или запросе, которому и так нужна большая часть строк, скан может быть быстрее, чем накладные расходы на использование индекса. Планировщик запросов базы уже принимает это решение автоматически; EXPLAIN просто даёт увидеть и проверить его логику, а не гадать.",
        ],
        bullets: [
          "No index on a WHERE/JOIN/ORDER BY column means a full table scan",
          "Every index speeds up reads but slows down writes — index deliberately, not everywhere",
          "Composite index column order matters: match your actual query's filter order",
          "Run EXPLAIN on the real slow query before adding an index, not after guessing",
        ],
        bulletsRu: [
          "Отсутствие индекса на колонке из WHERE/JOIN/ORDER BY значит полное сканирование таблицы",
          "Каждый индекс ускоряет чтение, но замедляет запись — индексируй осознанно, а не везде",
          "Порядок колонок в составном индексе важен: он должен совпадать с реальным порядком фильтрации в запросе",
          "Прогоняй EXPLAIN на реальном медленном запросе до добавления индекса, а не после угадывания",
        ],
      },
    ],
  },
  {
    slug: "safe-database-migrations",
    role: "backend",
    title: "Designing Database Migrations That Don't Take Your App Down",
    titleRu: "Как проектировать миграции БД, которые не роняют приложение",
    summary: "A migration that works fine on your laptop can lock a production table for minutes and take the whole app down with it. The difference is almost always about ordering.",
    summaryRu: "Миграция, которая прекрасно работает на ноутбуке, может заблокировать таблицу в продакшене на минуты и уронить всё приложение. Разница почти всегда в порядке действий.",
    readingMinutes: 6,
    tags: ["database migrations", "backend", "deployment", "zero downtime"],
    sections: [
      {
        heading: "Why a migration that works locally can break production",
        headingRu: "Почему миграция, работающая локально, может сломать продакшен",
        paragraphs: [
          "ALTER TABLE users ADD COLUMN role text NOT NULL DEFAULT 'user' runs instantly on a local table with a hundred rows. On a production table with fifty million rows, older database versions have to rewrite every existing row to add the default value, holding a lock on the table for the entire operation — during which every read and write to that table queues up and your app effectively goes down.",
          "The core problem isn't the SQL being wrong, it's that a migration and a code deploy are two separate events, but the schema change and the code that depends on it are usually written as if they happen atomically together. They don't — there's always a window, however small, where old code and new schema (or new code and old schema) coexist.",
        ],
        paragraphsRu: [
          "ALTER TABLE users ADD COLUMN role text NOT NULL DEFAULT 'user' выполняется мгновенно на локальной таблице из сотни строк. На продакшен-таблице из пятидесяти миллионов строк старые версии баз данных вынуждены переписать каждую существующую строку, чтобы добавить значение по умолчанию, удерживая блокировку таблицы на всё время операции — в течение которой каждое чтение и запись в эту таблицу встают в очередь, и приложение фактически падает.",
          "Основная проблема не в том, что SQL неправильный, а в том, что миграция и деплой кода — это два отдельных события, но изменение схемы и код, который от него зависит, обычно пишутся так, будто происходят атомарно вместе. Это не так — всегда есть окно, пусть и маленькое, где старый код и новая схема (или новый код и старая схема) сосуществуют.",
        ],
      },
      {
        heading: "The expand-and-contract pattern",
        headingRu: "Паттерн expand-and-contract (расширение и сжатие)",
        paragraphs: [
          "Renaming a column looks like a single migration but is actually three separate deploys if you want zero downtime. Expand: add the new column alongside the old one, and deploy code that writes to both but still reads from the old one — nothing breaks, because the old column is untouched. Migrate: backfill the new column from the old one in small batches (never one giant UPDATE on the whole table, for the same locking reason as above), then deploy code that reads from the new column.",
          "Contract: only once you've confirmed nothing depends on the old column anymore, drop it in a final migration. Splitting one \"rename a column\" change into expand → migrate → contract feels slower, but each individual step is small, reversible, and never requires old code and new schema to disagree about what a column means.",
        ],
        paragraphsRu: [
          "Переименование колонки выглядит как одна миграция, а на деле — три отдельных деплоя, если нужен нулевой даунтайм. Расширение: добавить новую колонку рядом со старой и задеплоить код, который пишет в обе, но всё ещё читает из старой — ничего не ломается, старая колонка не тронута. Миграция данных: перенести данные из старой колонки в новую небольшими батчами (никогда не одним гигантским UPDATE по всей таблице — по той же причине с блокировками), затем задеплоить код, читающий из новой колонки.",
          "Сжатие: только убедившись, что ничто больше не зависит от старой колонки, удалить её финальной миграцией. Разбить одно изменение «переименовать колонку» на расширение → миграцию → сжатие кажется медленнее, но каждый отдельный шаг маленький, обратимый и никогда не требует, чтобы старый код и новая схема расходились в понимании смысла колонки.",
        ],
      },
      {
        heading: "Rules that prevent most migration incidents",
        headingRu: "Правила, предотвращающие большинство инцидентов с миграциями",
        paragraphs: [
          "Never add a NOT NULL column without a default in one step on a table that already has rows — either add it nullable first and backfill, or check whether your database version can add it with a default without a full rewrite (modern Postgres can; don't assume older versions or other engines can). Never run a migration and the code that depends on it in the same deploy — the schema change should always be safe for both the old and new code to see, for at least one deploy cycle.",
          "Always test a migration's actual run time against a realistic copy of the production data size, not against a nearly-empty local database — a migration that takes 4ms locally and 4 minutes in production is the single most common cause of \"why did the migration take down the site\" incidents.",
        ],
        paragraphsRu: [
          "Никогда не добавляй NOT NULL колонку без значения по умолчанию одним шагом на таблице, где уже есть строки — либо добавь её nullable и заполни задним числом, либо проверь, может ли твоя версия базы добавить колонку со значением по умолчанию без полной перезаписи (современный Postgres может; не считай это само собой разумеющимся для старых версий или других СУБД). Никогда не выполняй миграцию и код, который от неё зависит, в одном деплое — изменение схемы всегда должно быть безопасным и для старого, и для нового кода, минимум один цикл деплоя.",
          "Всегда проверяй реальное время выполнения миграции на реалистичной копии продакшен-объёма данных, а не на почти пустой локальной базе — миграция, которая занимает 4мс локально и 4 минуты в продакшене, — самая частая причина инцидентов «почему миграция уронила сайт».",
        ],
        bullets: [
          "Rewrite the whole table under a NOT NULL default? Add nullable, backfill in batches, then constrain",
          "Rename/change a column via expand → migrate → contract, across separate deploys",
          "Never deploy a migration and the code depending on it as one atomic event",
          "Test migration run time against production-sized data, not a near-empty local database",
        ],
        bulletsRu: [
          "Полная перезапись таблицы из-за NOT NULL со значением по умолчанию? Добавь nullable, заполни батчами, потом наложи ограничение",
          "Переименование/изменение колонки через expand → migrate → contract, отдельными деплоями",
          "Никогда не деплой миграцию и зависящий от неё код как одно атомарное событие",
          "Проверяй время выполнения миграции на данных продакшен-объёма, а не на почти пустой локальной базе",
        ],
      },
    ],
  },
  {
    slug: "rest-api-design-basics",
    role: "backend",
    title: "REST API Design: Idempotency, Pagination, and Versioning",
    titleRu: "Проектирование REST API: идемпотентность, пагинация и версионирование",
    summary: "Three unglamorous decisions determine whether an API is pleasant to build against or a source of constant surprises: what happens on retry, how large result sets are handled, and how the API changes over time.",
    summaryRu: "Три неэффектных решения определяют, приятно ли работать с API или он станет источником постоянных сюрпризов: что происходит при повторе запроса, как обрабатываются большие выборки и как API меняется со временем.",
    readingMinutes: 6,
    tags: ["rest api", "api design", "idempotency", "pagination", "backend"],
    sections: [
      {
        heading: "Idempotency: what happens when the same request arrives twice",
        headingRu: "Идемпотентность: что происходит, когда один и тот же запрос приходит дважды",
        paragraphs: [
          "A request is idempotent if making it once and making it five times leaves the system in the same state. GET, PUT, and DELETE are supposed to be idempotent by convention — deleting the same resource twice should leave it deleted, not error on the second call or delete something else. POST is not idempotent by convention, which is precisely the dangerous case: a mobile client on a flaky connection retries a POST /orders that actually succeeded the first time, and now there are two orders.",
          "The standard fix is a client-generated idempotency key sent as a header on the request; the server stores which keys it has already processed and, on a repeat, returns the original result instead of executing the action again. This is exactly how real payment APIs prevent a network retry from double-charging a card.",
        ],
        paragraphsRu: [
          "Запрос идемпотентен, если выполнение его один раз и пять раз оставляет систему в одном и том же состоянии. GET, PUT и DELETE по соглашению должны быть идемпотентны — удаление одного и того же ресурса дважды должно оставлять его удалённым, а не выдавать ошибку на второй вызов или удалять что-то другое. POST по соглашению не идемпотентен, и это как раз опасный случай: мобильный клиент на нестабильном соединении повторяет POST /orders, который на самом деле успешно выполнился с первого раза, — и теперь заказов два.",
          "Стандартное решение — сгенерированный клиентом ключ идемпотентности, отправляемый заголовком запроса; сервер хранит, какие ключи уже обработал, и при повторе возвращает исходный результат вместо повторного выполнения действия. Именно так реальные платёжные API предотвращают двойное списание при повторе запроса из-за сети.",
        ],
      },
      {
        heading: "Pagination: never return \"all of them\"",
        headingRu: "Пагинация: никогда не возвращай «всё сразу»",
        paragraphs: [
          "GET /users with no limit is fine when there are 40 users and a production incident when there are 4 million — an unpaginated endpoint's response time and payload size are directly tied to how much data exists, which only grows. Offset-based pagination (?page=3&limit=20) is simple and familiar but gets slower on large tables (the database still has to count past all the skipped rows) and can skip or duplicate items if rows are inserted or deleted between page requests.",
          "Cursor-based pagination (?after=eyJpZCI6MTIzfQ, an opaque pointer to the last item seen) stays fast regardless of table size and is stable against concurrent inserts/deletes, at the cost of not being able to jump straight to \"page 7.\" Most APIs that need to scale past a small dataset use cursors; offset pagination is fine for smaller, mostly-static lists like an admin panel.",
        ],
        paragraphsRu: [
          "GET /users без лимита — это нормально при 40 пользователях и продакшен-инцидент при 4 миллионах — время ответа и размер payload у непагинированного эндпоинта напрямую связаны с объёмом данных, который только растёт. Пагинация по смещению (?page=3&limit=20) проста и привычна, но замедляется на больших таблицах (базе всё равно нужно посчитать все пропущенные строки) и может пропускать или дублировать элементы, если строки добавляются или удаляются между запросами страниц.",
          "Пагинация по курсору (?after=eyJpZCI6MTIzfQ, непрозрачный указатель на последний увиденный элемент) остаётся быстрой независимо от размера таблицы и устойчива к параллельным вставкам/удалениям, ценой невозможности сразу перейти на «страницу 7». Большинство API, которым нужно масштабироваться за пределы небольшого набора данных, используют курсоры; пагинация по смещению подходит для меньших, в основном статичных списков вроде админ-панели.",
        ],
      },
      {
        heading: "Versioning: how the API changes without breaking existing clients",
        headingRu: "Версионирование: как API меняется, не ломая существующих клиентов",
        paragraphs: [
          "Once an API has external consumers, you can't just change a field's type or remove an endpoint — some client, somewhere, is depending on the current shape. Versioning is the mechanism that lets the API evolve anyway: a version in the URL path (/v1/users, /v2/users) is the most common and most visible approach, while a version header is less visible in logs and URLs but keeps URLs stable.",
          "The real discipline isn't picking a versioning scheme, it's defining what counts as a breaking change up front (removing a field, renaming a field, changing a field's type or meaning) versus what doesn't (adding a new optional field) — and committing to a deprecation window (\"v1 will be removed six months after v2 ships\") so existing clients have time to migrate instead of breaking without warning.",
        ],
        paragraphsRu: [
          "Как только у API появляются внешние потребители, нельзя просто поменять тип поля или удалить эндпоинт — какой-то клиент где-то зависит от текущей формы. Версионирование — это механизм, позволяющий API эволюционировать всё равно: версия в пути URL (/v1/users, /v2/users) — самый распространённый и заметный подход, а версия в заголовке менее заметна в логах и URL, но сохраняет URL стабильными.",
          "Настоящая дисциплина не в выборе схемы версионирования, а в том, чтобы заранее определить, что считается breaking change (удаление поля, переименование поля, изменение типа или смысла поля), а что нет (добавление нового опционального поля) — и придерживаться окна устаревания («v1 будет удалён через шесть месяцев после выхода v2»), чтобы у существующих клиентов было время на миграцию, а не внезапная поломка.",
        ],
        bullets: [
          "Idempotency keys prevent a network retry from executing POST twice",
          "Never ship an unpaginated list endpoint — it will break at scale, not at launch",
          "Cursor pagination scales better and stays stable; offset pagination is simpler for small lists",
          "Define breaking vs. non-breaking changes and a deprecation window before you need one",
        ],
        bulletsRu: [
          "Ключи идемпотентности предотвращают повторное выполнение POST при сетевом ретрае",
          "Никогда не выпускай непагинированный листинг-эндпоинт — он сломается при масштабе, не при запуске",
          "Курсорная пагинация лучше масштабируется и стабильнее; пагинация по смещению проще для небольших списков",
          "Определи breaking и non-breaking изменения и окно устаревания до того, как это понадобится",
        ],
      },
    ],
  },

  // ─────────────────────────── General ───────────────────────────
  {
    slug: "git-workflows-practical-guide",
    role: "all",
    title: "Git Workflows: A Practical Guide to Branching, Rebasing, and Not Losing Work",
    titleRu: "Git-воркфлоу: практическое руководство по веткам, rebase и как не потерять работу",
    summary: "Git rarely loses work — most \"I lost my commits\" panics have a specific, recoverable cause. Here's what merge vs. rebase actually changes, and the commands that get you out of trouble.",
    summaryRu: "Git редко реально теряет работу — за большинством паник «я потерял коммиты» стоит конкретная, восстановимая причина. Вот что на самом деле меняют merge и rebase, и команды, которые вытащат из беды.",
    readingMinutes: 6,
    tags: ["git", "version control", "branching", "rebase"],
    sections: [
      {
        heading: "Merge vs. rebase: same end result, different history",
        headingRu: "Merge vs. rebase: одинаковый результат, разная история",
        paragraphs: [
          "git merge combines two branches by creating a new merge commit with two parents — it preserves the exact history of what actually happened, including every intermediate commit, but that history can get noisy with a tangle of merge commits on a busy branch. git rebase replays your branch's commits one by one on top of the target branch, producing a clean, linear history as if you'd started your work after the latest changes — but it rewrites commit hashes, which is the source of almost every rebase-related disaster.",
          "The rule that prevents that disaster: never rebase a branch that other people have already pulled and are basing their own work on. Rewriting history that only exists locally, on your own feature branch, is safe. Rewriting history that's already shared forces everyone else to reconcile their own work against commits that no longer exist under their old hashes.",
        ],
        paragraphsRu: [
          "git merge объединяет две ветки, создавая коммит слияния с двумя родителями — он сохраняет точную историю того, что реально произошло, включая каждый промежуточный коммит, но эта история может зарасти клубком merge-коммитов на активной ветке. git rebase переигрывает коммиты твоей ветки один за другим поверх целевой ветки, давая чистую линейную историю, будто работа началась после последних изменений — но он переписывает хеши коммитов, и это источник почти всех катастроф с rebase.",
          "Правило, предотвращающее эту катастрофу: никогда не делай rebase ветки, которую уже забрали другие люди и на которой строят свою работу. Переписывание истории, которая существует только локально, в твоей собственной feature-ветке, безопасно. Переписывание уже общей истории заставляет всех остальных согласовывать свою работу с коммитами, которые больше не существуют под старыми хешами.",
        ],
      },
      {
        heading: "\"I lost my commits\" is almost always reflog territory",
        headingRu: "«Я потерял коммиты» — это почти всегда территория reflog",
        paragraphs: [
          "Git essentially never deletes a commit the instant you stop pointing at it — it keeps unreferenced commits around for weeks before garbage collection, and git reflog shows a log of every place HEAD has pointed, including commits from before a reset --hard, a bad rebase, or a branch you deleted by accident. Find the commit hash in the reflog output and git checkout <hash> (or git branch recovery-branch <hash>) gets it back.",
          "git reset --hard is the command most likely to cause the panic in the first place, because it silently discards uncommitted changes with no confirmation — it doesn't touch already-committed work (that's recoverable via reflog), but uncommitted changes it throws away are genuinely gone. Get in the habit of git stash before running reset --hard on anything you're not certain about.",
        ],
        paragraphsRu: [
          "Git практически никогда не удаляет коммит в момент, когда на него перестают указывать, — недостижимые коммиты хранятся неделями до сборки мусора, а git reflog показывает лог каждого места, куда указывал HEAD, включая коммиты до reset --hard, неудачного rebase или случайно удалённой ветки. Найди хеш коммита в выводе reflog, и git checkout <хеш> (или git branch recovery-branch <хеш>) вернёт его.",
          "git reset --hard — команда, которая чаще всего и вызывает панику, потому что она тихо отбрасывает незакоммиченные изменения без подтверждения — уже закоммиченную работу она не трогает (она восстановима через reflog), а вот отброшенные незакоммиченные изменения реально пропадают. Возьми за привычку git stash перед reset --hard на всём, в чём не уверен.",
        ],
      },
      {
        heading: "A workflow that scales from solo to team",
        headingRu: "Воркфлоу, который масштабируется от соло до команды",
        paragraphs: [
          "Trunk-based development with short-lived feature branches covers most teams' needs without the ceremony of a heavier model: branch off main for one focused change, keep the branch alive for hours or a few days (not weeks — the longer a branch lives, the more it diverges and the worse the eventual merge conflict gets), open a PR, merge, delete the branch.",
          "Before opening a PR, git fetch and rebase your feature branch onto the latest main (this is the safe case — it's still only your own local branch) so the PR diff shows only your actual changes, not a tangle with everyone else's merged work in between. Commit messages matter more than their length suggests: a message describing why a change was made, not just what changed, is what future-you (or a teammate) actually needs when git blame points at a line six months from now.",
        ],
        paragraphsRu: [
          "Trunk-based разработка с короткоживущими feature-ветками покрывает потребности большинства команд без церемоний более тяжёлой модели: ветка от main на одно сфокусированное изменение, ветка живёт часы или пару дней (не недели — чем дольше живёт ветка, тем сильнее расходится и тем хуже итоговый конфликт слияния), открывается PR, вливается, ветка удаляется.",
          "Перед открытием PR сделай git fetch и rebase своей feature-ветки на актуальный main (это безопасный случай — это всё ещё только твоя локальная ветка), чтобы diff в PR показывал только реальные изменения, а не клубок с чужой влитой работой между ними. Сообщения коммитов важнее, чем кажется по их длине: сообщение, описывающее почему сделано изменение, а не только что изменилось, — вот что реально нужно тебе в будущем (или коллеге), когда git blame укажет на строку через полгода.",
        ],
        bullets: [
          "Rebase only branches nobody else has pulled from; merge (or force-with-lease, carefully) otherwise",
          "git reflog recovers commits after a reset --hard, bad rebase, or deleted branch",
          "git stash before any reset --hard you're not fully sure about",
          "Short-lived feature branches, rebased onto main before opening a PR, keep diffs and conflicts small",
        ],
        bulletsRu: [
          "Делай rebase только веток, которые никто больше не забирал; иначе merge (или осторожный force-with-lease)",
          "git reflog восстанавливает коммиты после reset --hard, неудачного rebase или удалённой ветки",
          "git stash перед любым reset --hard, в котором не до конца уверен",
          "Короткоживущие feature-ветки, ребейзнутые на main перед открытием PR, держат диффы и конфликты маленькими",
        ],
      },
    ],
  },
  {
    slug: "how-to-read-a-stack-trace",
    role: "all",
    title: "How to Read a Stack Trace Instead of Just Screenshotting It",
    titleRu: "Как читать stack trace, а не просто делать его скриншот",
    summary: "A stack trace already tells you where the error happened and the exact chain of calls that led there. Most of the information people ask for in a bug report is already sitting in the trace they pasted.",
    summaryRu: "Stack trace уже говорит, где произошла ошибка, и показывает точную цепочку вызовов, приведших к ней. Большая часть информации, которую спрашивают в баг-репорте, уже есть в приложенном трейсе.",
    readingMinutes: 5,
    tags: ["debugging", "stack trace", "error handling", "fundamentals"],
    sections: [
      {
        heading: "Read it top to bottom as \"how we got here\"",
        headingRu: "Читай сверху вниз как «как мы сюда попали»",
        paragraphs: [
          "A stack trace lists function calls, most recent (innermost) call first. The top line is where the error actually happened; each line below it is the function that called the one above — so reading top to bottom traces the exact chain of calls from the crash back to wherever the request or script started.",
          "The error type and message on the first line matter as much as the trace itself: TypeError: Cannot read properties of undefined (reading 'name') tells you specifically that something you expected to be an object was undefined when you tried to access .name on it — that's already most of the diagnosis, before looking at a single line number.",
        ],
        paragraphsRu: [
          "Stack trace перечисляет вызовы функций, начиная с самого недавнего (внутреннего) вызова. Верхняя строка — где ошибка реально произошла; каждая строка под ней — функция, вызвавшая ту, что выше, — поэтому чтение сверху вниз прослеживает точную цепочку вызовов от краша назад к тому месту, где начался запрос или скрипт.",
          "Тип и сообщение ошибки в первой строке важны не меньше самого трейса: TypeError: Cannot read properties of undefined (reading 'name') конкретно говорит, что нечто, ожидавшееся объектом, оказалось undefined в момент обращения к .name — это уже большая часть диагностики, ещё до взгляда на номер строки.",
        ],
      },
      {
        heading: "Find \"your\" frame, not just the first line",
        headingRu: "Найди «свой» фрейм, а не только первую строку",
        paragraphs: [
          "The very top frame is often inside a library or framework, not your own code — the real bug is usually one frame further down, at the first line that points into your own codebase, because that's where your code called the library with something it couldn't handle. Skimming for the first file path that matches your project's own folders is often faster than reading every frame in order.",
          "Async code and Promise chains make traces harder to read because they can lose the original call stack across an await boundary — this is one concrete reason to always await async calls and use try/catch around them (or .catch()) rather than letting a rejection surface bare, since a caught error can be re-thrown with context (which operation, which input) that the raw trace alone won't have.",
        ],
        paragraphsRu: [
          "Самый верхний фрейм часто находится внутри библиотеки или фреймворка, а не в твоём коде — реальный баг обычно на фрейм ниже, в первой строке, указывающей в твой собственный кодбейз, потому что именно там твой код вызвал библиотеку с чем-то, что она не смогла обработать. Просмотр в поисках первого пути файла, совпадающего с папками твоего проекта, часто быстрее, чем чтение каждого фрейма по порядку.",
          "Асинхронный код и цепочки Promise усложняют чтение трейсов, потому что могут терять исходный стек вызовов на границе await — это конкретная причина всегда делать await у асинхронных вызовов и оборачивать их в try/catch (или .catch()), а не давать отклонению всплыть голым, поскольку пойманную ошибку можно перебросить с контекстом (какая операция, какие данные), которого в сыром трейсе может не быть.",
        ],
      },
      {
        heading: "What to actually paste into a bug report or a chat message",
        headingRu: "Что реально вставлять в баг-репорт или сообщение в чат",
        paragraphs: [
          "Paste the whole trace, not just the error message — \"it says Cannot read properties of undefined\" without the trace throws away the exact file, line, and call chain that would have let someone fix it in thirty seconds instead of asking you three follow-up questions. If the trace is long, the first error and the first few frames pointing into your own code are the important part; framework internals below that rarely add information.",
          "Pair the trace with what you were doing when it happened — the same input-and-steps discipline as any bug report. \"Stack trace attached\" with no context still leaves someone reconstructing how to reproduce it; \"stack trace attached, happens when submitting the form with an empty email field\" turns a debugging session into a five-minute fix.",
        ],
        paragraphsRu: [
          "Вставляй весь трейс, а не только сообщение об ошибке — «пишет Cannot read properties of undefined» без трейса выбрасывает точный файл, строку и цепочку вызовов, которые позволили бы починить за тридцать секунд вместо трёх уточняющих вопросов. Если трейс длинный, важна первая ошибка и первые несколько фреймов, указывающих в твой собственный код; внутренности фреймворка ниже редко добавляют информации.",
          "Сопровождай трейс тем, что ты делал в момент ошибки — та же дисциплина входных данных и шагов, что и в любом баг-репорте. «Прикладываю stack trace» без контекста всё равно заставляет кого-то восстанавливать шаги воспроизведения; «прикладываю stack trace, происходит при отправке формы с пустым полем email» превращает сессию отладки в пятиминутную починку.",
        ],
        bullets: [
          "Top of the trace = where it crashed; read downward to trace the call chain backward",
          "The error type and message are often most of the diagnosis by themselves",
          "Skip to the first frame pointing into your own code, not just the very top one",
          "Paste the full trace plus what you were doing — never just the error message alone",
        ],
        bulletsRu: [
          "Верх трейса = где случился краш; читай вниз, чтобы проследить цепочку вызовов назад",
          "Тип и сообщение ошибки сами по себе часто уже большая часть диагностики",
          "Ищи первый фрейм, указывающий в твой код, а не только самый верхний",
          "Вставляй полный трейс плюс что ты делал — никогда только сообщение об ошибке отдельно",
        ],
      },
    ],
  },
  {
    slug: "jwt-explained",
    role: "all",
    title: "JWT Explained: What's Actually Inside a Token",
    titleRu: "JWT простыми словами: что на самом деле внутри токена",
    summary: "A JWT isn't encrypted, isn't a session, and isn't automatically safe just because it's signed. Here's what each of the three parts actually does.",
    summaryRu: "JWT не зашифрован, не является сессией и не безопасен автоматически только потому, что подписан. Вот что на самом деле делает каждая из трёх частей.",
    readingMinutes: 5,
    tags: ["jwt", "authentication", "security", "web fundamentals"],
    sections: [
      {
        heading: "Three parts, separated by dots, and only one is protected",
        headingRu: "Три части, разделённые точками, и защищена только одна",
        paragraphs: [
          "A JWT is three Base64URL-encoded segments joined by dots: header.payload.signature. The header names the algorithm used to sign the token; the payload holds the actual claims — user ID, role, expiry time, whatever the issuer decided to include; the signature is a cryptographic proof that the header and payload haven't been tampered with since the issuer signed them.",
          "The part almost everyone gets wrong at first: Base64URL encoding is not encryption. Anyone can decode a JWT's payload with nothing more than a text editor — paste any token into jwt.io and the claims are right there in plain text. If the payload contains a password, a secret, or anything sensitive, that data is exposed to anyone holding the token, full stop.",
        ],
        paragraphsRu: [
          "JWT — это три сегмента в кодировке Base64URL, соединённые точками: header.payload.signature. Header называет алгоритм, которым подписан токен; payload содержит реальные claims (утверждения) — ID пользователя, роль, время истечения, всё, что издатель решил включить; signature — криптографическое доказательство, что header и payload не были изменены с момента подписи издателем.",
          "Момент, который почти все путают сначала: кодировка Base64URL — это не шифрование. Любой может декодировать payload JWT обычным текстовым редактором — вставь любой токен на jwt.io, и claims окажутся прямо там открытым текстом. Если payload содержит пароль, секрет или что-то чувствительное, эти данные доступны любому, у кого есть токен, точка.",
        ],
      },
      {
        heading: "What the signature actually guarantees",
        headingRu: "Что signature на самом деле гарантирует",
        paragraphs: [
          "The signature proves integrity and authenticity — that the token was issued by someone holding the secret (for HMAC algorithms like HS256) or private key (for RSA/ECDSA algorithms like RS256), and that the header and payload haven't been altered since. It does not provide confidentiality, and it says nothing about whether the token has been revoked since it was issued.",
          "This is why validating a JWT means re-computing the signature from the received header and payload using the known secret/public key and comparing it to the signature in the token — not just checking that a signature exists, and never trusting the algorithm named in the token's own header (a known attack sends a token with \"alg\": \"none\" hoping a lazy verifier skips signature checking entirely).",
        ],
        paragraphsRu: [
          "Signature доказывает целостность и подлинность — что токен выпущен тем, кто владеет секретом (для HMAC-алгоритмов вроде HS256) или приватным ключом (для RSA/ECDSA вроде RS256), и что header и payload не изменялись с момента выпуска. Она не обеспечивает конфиденциальность и ничего не говорит о том, был ли токен отозван после выпуска.",
          "Поэтому валидация JWT означает пересчёт подписи из полученных header и payload с использованием известного секрета/публичного ключа и сравнение с подписью в токене — а не просто проверку, что подпись вообще есть, и никогда не доверие алгоритму, указанному в собственном header токена (известная атака отправляет токен с \"alg\": \"none\" в надежде, что ленивый валидатор вообще пропустит проверку подписи).",
        ],
      },
      {
        heading: "Why \"revoking\" a JWT is harder than revoking a session",
        headingRu: "Почему «отозвать» JWT сложнее, чем отозвать сессию",
        paragraphs: [
          "A traditional server-side session can be invalidated instantly — delete the session record, and the next request with that session ID is rejected. A JWT is self-contained and stateless by design: the server verifies it using only the signature and the token's own expiry claim, without checking a database, which is exactly what makes JWTs fast and scalable, and exactly why there's no built-in way to invalidate one before it expires.",
          "The practical fix is keeping expiry times short (minutes, not weeks) paired with a separate, revocable refresh token, or maintaining a server-side denylist of revoked token IDs for the rare cases that need immediate revocation (a logout, a compromised account) — either approach reintroduces some server-side state specifically to solve the one problem stateless tokens don't solve on their own.",
        ],
        paragraphsRu: [
          "Традиционную серверную сессию можно инвалидировать мгновенно — удалить запись сессии, и следующий запрос с этим ID сессии будет отклонён. JWT самодостаточен и stateless по design: сервер проверяет его только по подписи и собственному claim истечения токена, не обращаясь к базе, — именно это делает JWT быстрыми и масштабируемыми, и именно поэтому нет встроенного способа инвалидировать токен до его истечения.",
          "Практическое решение — держать короткое время жизни (минуты, не недели) в паре с отдельным, отзываемым refresh-токеном, либо вести серверный список отозванных ID токенов для редких случаев, требующих немедленного отзыва (логаут, скомпрометированный аккаунт) — оба подхода возвращают немного серверного состояния специально для решения той единственной проблемы, которую stateless-токены сами по себе не решают.",
        ],
        bullets: [
          "The payload is readable by anyone with the token — never put secrets in it",
          "The signature proves integrity and origin, not confidentiality",
          "Always re-verify the signature yourself; never trust the algorithm named in the token",
          "Short expiry + refresh tokens (or a denylist) is how JWTs get revocation back",
        ],
        bulletsRu: [
          "Payload может прочитать любой, у кого есть токен, — никогда не клади туда секреты",
          "Signature доказывает целостность и происхождение, а не конфиденциальность",
          "Всегда перепроверяй подпись сам; никогда не доверяй алгоритму, указанному в самом токене",
          "Короткое время жизни + refresh-токены (или denylist) — вот как JWT возвращают себе отзыв",
        ],
      },
    ],
  },
  {
    slug: "semantic-versioning-explained",
    role: "all",
    title: "Semantic Versioning: What Actually Changes Between 1.2.3 and 2.0.0",
    titleRu: "Семантическое версионирование: что реально меняется между 1.2.3 и 2.0.0",
    summary: "MAJOR.MINOR.PATCH is a promise about compatibility, not just a counter — and most of the pain people blame on semver is actually a package that didn't follow it.",
    summaryRu: "MAJOR.MINOR.PATCH — это обещание о совместимости, а не просто счётчик, и большая часть боли, которую вешают на semver, на деле — пакет, который ему не следовал.",
    readingMinutes: 4,
    tags: ["semver", "versioning", "npm", "dependency management"],
    sections: [
      {
        heading: "Each number answers a different question",
        headingRu: "Каждое число отвечает на свой вопрос",
        paragraphs: [
          "In MAJOR.MINOR.PATCH, PATCH (the 3 in 1.2.3) means backward-compatible bug fixes only — nothing about how you use the library changed, something just works correctly now. MINOR (the 2) means new functionality was added in a backward-compatible way — new features, new optional parameters, but nothing that was working before stops working.",
          "MAJOR (the 1) means a breaking change — something that could make existing code that depends on this package stop working: a function was removed, a parameter's meaning changed, a default behavior flipped. Going from 1.2.3 to 2.0.0 is a promise, not just a bump: \"reading the changelog before you upgrade is not optional this time.\"",
        ],
        paragraphsRu: [
          "В MAJOR.MINOR.PATCH, PATCH (тройка в 1.2.3) означает только обратно-совместимые исправления багов — ничего в том, как ты используешь библиотеку, не изменилось, просто что-то теперь работает правильно. MINOR (двойка) означает, что добавлен новый функционал обратно-совместимым способом — новые фичи, новые опциональные параметры, но ничто из работавшего раньше не перестаёт работать.",
          "MAJOR (единица) означает breaking change — что-то, из-за чего существующий код, зависящий от пакета, может перестать работать: удалена функция, изменился смысл параметра, изменилось поведение по умолчанию. Переход с 1.2.3 на 2.0.0 — это обещание, а не просто счётчик: «прочитать changelog перед обновлением на этот раз не опционально».",
        ],
      },
      {
        heading: "Why version ranges in package.json look the way they do",
        headingRu: "Почему диапазоны версий в package.json выглядят именно так",
        paragraphs: [
          "A caret range like ^1.2.3 means \"anything compatible with 1.2.3\" — npm will automatically install newer patch and minor versions (1.2.4, 1.3.0) but never 2.0.0, because semver's whole promise is that only a major bump can break you. A tilde range ~1.2.3 is narrower: it allows patch updates (1.2.4) but not minor ones (1.3.0), for teams that want new features to be an explicit, deliberate choice.",
          "This system only works if package authors actually follow it — a maintainer who ships a breaking change as a patch release (\"1.2.4\" that secretly removes a function) breaks the entire promise that lets automated dependency updates be safe, which is the real cause behind most \"I upgraded a patch version and everything broke\" incidents, not a flaw in semver itself.",
        ],
        paragraphsRu: [
          "Диапазон с каретой вроде ^1.2.3 означает «всё совместимое с 1.2.3» — npm автоматически установит более новые patch- и minor-версии (1.2.4, 1.3.0), но никогда 2.0.0, потому что всё обещание semver в том, что сломать может только major. Диапазон с тильдой ~1.2.3 уже: разрешает patch-обновления (1.2.4), но не minor (1.3.0) — для команд, которые хотят, чтобы новые фичи были явным, осознанным выбором.",
          "Эта система работает только если авторы пакетов реально ей следуют — мейнтейнер, выпустивший breaking change как patch-релиз («1.2.4», тайно удаляющий функцию), ломает всё обещание, которое делает автоматические обновления зависимостей безопасными, — и это реальная причина большинства инцидентов «обновил patch-версию, и всё сломалось», а не изъян самого semver.",
        ],
        bullets: [
          "PATCH: bug fixes only, nothing about usage changes",
          "MINOR: new backward-compatible functionality added",
          "MAJOR: breaking change — read the changelog before upgrading",
          "^1.2.3 allows minor+patch updates; ~1.2.3 allows only patch updates",
        ],
        bulletsRu: [
          "PATCH: только исправления багов, использование не меняется",
          "MINOR: добавлен новый функционал, обратно совместимый",
          "MAJOR: breaking change — прочитай changelog перед обновлением",
          "^1.2.3 разрешает minor+patch обновления; ~1.2.3 разрешает только patch",
        ],
      },
    ],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  const sameRole = ARTICLES.filter((a) => a.slug !== article.slug && a.role === article.role);
  const rest = ARTICLES.filter((a) => a.slug !== article.slug && a.role !== article.role);
  return [...sameRole, ...rest].slice(0, limit);
}
