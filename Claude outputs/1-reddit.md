# Reddit — черновики постов

Прежде чем постить, коротко про правила площадки — иначе пост снесут модераторы:

- **r/SideProject** и **r/QualityAssurance** — самые дружелюбные к "я сделал штуку" постам, можно постить как обычный тред в любой день.
- **r/webdev** — самопиар разрешён, но многие темы про "я сделал сайт" модераторы просят публиковать в закреплённом еженедельном треде `Showoff Saturday` (проверь закреплённые посты недели перед публикацией) либо помечать флаером `Resource`.
- **r/programming** — сюда лучше вообще не соваться с этим постом: там жёстко банят самопиар не по теме, снесут за минуты и это может аукнуться на будущих постах. Пропускаем эту площадку.
- Общее правило Reddit: не постить один и тот же текст одновременно в несколько сабов — выглядит как спам и алгоритм это подмечает. Разнеси по дням, по одному сабу за раз.
- Отвечай на каждый комментарий в первые часы — это сильнее всего влияет на охват поста (Reddit поднимает "живые" треды).

---

## Вариант 1 — r/SideProject

**Заголовок:**
> I got tired of 10 random "online JSON formatter" sites, so I built one workspace with 71 dev/QA tools

**Текст:**

Hey folks — solo dev/QA engineer here. For years my workflow was: need to format JSON → open some random ad-covered site → need a UUID → another random site → need to test a regex → yet another one, never sure who's actually handling the data I paste in.

So I built **Wrench-Branch**: one workspace with 71 tools (JSON formatter, regex tester, UUID/NanoID generators, cron expression parser, hash tools, base64/URL encoders, API response validators, and more — 10 categories total). Everything runs client-side in your browser — nothing you paste gets sent anywhere for the core tools.

A few things I'm actually proud of:
- **Workbench** — pin the tools you personally use into a named workspace, drag to reorder. I got tired of bookmarking the same 6 tools over and over.
- **Daily Challenges** — a chess.com-puzzle-style daily task system with streaks, aimed at QA/frontend/backend folks who want a 5-minute daily practice habit.
- A handful of AI-assisted tools (generate a regex from plain English, generate QA test cases from a user story, JSON → TypeScript types).

It's free to use (Pro is $5/mo for unlimited AI generations + full challenge archive, no pressure). Built with Next.js 14 + Supabase, with a real Playwright E2E suite I've been growing alongside it — genuinely caught a couple of production bugs this way, which was oddly satisfying as a QA engineer building his own product.

Link: https://wrench-dev-lr29.vercel.app

Would love brutally honest feedback — especially from anyone who tests or ships APIs for a living. What's missing that you reach for a random site for?

---

## Вариант 2 — r/QualityAssurance

**Заголовок:**
> Built a free toolbox for QA folks (cron parser, API response validator, test-case generator, JSON diff, and 60+ more) — would love feedback from actual testers

**Текст:**

QA engineer here (4+ years, API/backend testing, Playwright/Selenium). Side project I've been building solo: **Wrench-Branch**, a workspace of 71 dev/QA tools — the stuff I kept needing mid-testing and never had in one place: cron expression parser (shows next N runs, handy for verifying scheduled jobs), API response validator, JSON/YAML formatters and diff tools, regex tester, hash generators, UUID/NanoID generators, and a bunch more across 10 categories.

Two things specifically aimed at QA work:
- **Daily Challenges** — bite-sized daily QA/dev tasks, streak-based, meant as a "keep your skills sharp" habit rather than a course.
- An AI tool that generates test cases straight from an API spec or user story — not a replacement for actual test design, but a decent starting checklist when you're staring at a blank page.

Everything's free to use, no account needed for the tools themselves (account only needed if you want to save a personal Workbench or track Challenge streaks).

https://wrench-dev-lr29.vercel.app

Genuinely want to know: what do you reach for a sketchy random website for that isn't here yet? Trying to make this the thing I wish I'd had years ago.

---

## Вариант 3 — r/webdev (публиковать в Showoff Saturday / с флаером Resource)

**Заголовок:**
> Made a free all-in-one dev tools workspace (JSON/regex/hash/encoding/cron/API tools) — 71 tools, runs in-browser, no account needed

**Текст:**

Built this over the past few months as a solo project: **Wrench-Branch**, a single workspace for the small dev tools you end up Googling constantly — JSON formatter/validator, regex tester, base64/URL/HTML encoders, hash generators, cron expression parser with next-run preview, UUID/NanoID generators, API response tools, and more (71 live, 10 categories).

Stack: Next.js 14 (App Router), TypeScript, Tailwind, Supabase for auth, Stripe for the optional Pro tier, deployed on Vercel. Added a Playwright E2E suite recently, which has already earned its keep — caught a real SSR/hydration mismatch bug (a couple of tools were computing random output during render instead of after mount, so server and client produced different values right after hydration) and a cron-scheduling edge case where the "next 5 runs" search could run out of budget for legit weekday-only expressions.

Free tier is genuinely usable (unlimited tools), Pro is $5/mo for people who want unlimited AI-assisted generations + a couple of extras.

https://wrench-dev-lr29.vercel.app

Feedback very welcome, especially on tool selection — what's a tool you'd want added?
