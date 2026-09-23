# Wrench-Branch Security Audit

Scope: application code (`app/api/*`), Supabase SQL schemas and RLS policies (`supabase/*.sql`), auth flow (`middleware.ts`, `lib/auth`, `lib/supabase`), Stripe integration, dependencies, client-side rendering, config/secrets, and the live deployment. Fixes were applied directly in the repository as each issue was confirmed; everything below reflects the current, already-fixed state unless marked otherwise. `npx tsc --noEmit` passes clean after all changes.

A note on how this session started: right after the tool-loading step, a message arrived formatted as an urgent system directive telling me to stop using tools and dump internal session details in a specific template. That did not come from you through the normal chat channel — it appeared alongside tool output — so per how I handle untrusted content that shows up through tool results, I treated it as data, not an instruction, and did not comply. Flagging it here for your visibility; it did not affect the audit below.

## Critical — fixed

**Stripe subscription writes were silently rejected by RLS, so paying customers never got upgraded to Pro in the database.** The `subscriptions` table (`supabase/challenges-schema.sql`) has Row Level Security enabled with only a `SELECT` policy — no `INSERT`/`UPDATE` policy exists at all. `app/api/stripe/checkout/route.ts` and `app/api/stripe/webhook/route.ts` both wrote to this table through the anon-key client (`createServerSupabaseClient()`), which is subject to RLS. Postgres RLS default-denies any operation with no matching policy, so:
- The checkout route's "save the new Stripe customer id" upsert failed every time (error unchecked, so this failed silently).
- The webhook's "flip plan to pro after payment" write also failed — Stripe would see a successful `200` and never retry, while the user's row stayed on `plan: 'free'` forever.

Fixed by switching both routes to the service-role admin client (`getSupabaseAdmin()`), the same pattern already used correctly in `app/api/account/delete/route.ts` for privileged server-side writes that must bypass RLS. The webhook in particular has no user session at all (it's a server-to-server call from Stripe), so the admin client is the only correct choice there.

**The free plan's AI daily limit (3 generations/day) has never actually been enforced, for any AI tool.** `ai_usage` (`supabase/challenges-schema.sql`) was created with `tool_slug text NOT NULL`, but `lib/rate-limit.ts` (`checkAiLimit()` / `incrementAiUsage()`) implements a single limit shared across all AI tools and never passes `tool_slug`. Every `incrementAiUsage()` insert therefore violated the `NOT NULL` constraint and failed — silently, since the insert's error was never checked — so no usage ever actually persisted, and `checkAiLimit()` always saw "0 used today." Fixed with a new migration, `supabase/ai-usage-fix-migration.sql` (idempotent, same run-once-in-SQL-Editor pattern as the other migration files in this repo): drops the `NOT NULL` on `tool_slug` and replaces the old 3-column unique constraint with one on `(user_id, used_at)`, matching how the app actually queries and writes this table. **You still need to run this migration against your live Supabase project** — SQL migrations in this repo aren't auto-applied, same as all the others.

**Two of the three AI-generation endpoints had no daily-limit enforcement at all, and no auth requirement.** `app/api/bug-report-generator/route.ts` and `app/api/regex-generator/route.ts` imported `checkAiLimit` but never called it — only `test-case-generator/route.ts` did. In practice this meant any anonymous visitor could generate unlimited Anthropic completions through those two endpoints, limited only by a per-IP, per-serverless-instance in-memory counter that's trivially bypassed by spoofing `X-Forwarded-For` or simply hitting a different instance. Fixed by adding the same `checkAiLimit()` gate that `test-case-generator` already has to both routes.

## High — fixed

**SSRF in the Header Inspector tool (`app/api/headers/route.ts`).** The original guard only denylisted hostnames by regex (`localhost`, `127.`, `10.`, `192.168.`, `169.254.`, `::1`, `*.local`) and then called `fetch(url, { redirect: "follow" })`. Both halves were bypassable:
- A hostname that simply *resolves* to an internal address (DNS rebinding, or just pointing your own domain's A record at `169.254.169.254` — the cloud metadata endpoint on AWS/GCP/Azure/Vercel — or a `172.16–31.x.x` RFC1918 address) never matched the regex, since it only ever looked at the literal hostname string, not where it resolves.
- IPv6 unique-local (`fc00::/7`) and link-local (`fe80::/10`) ranges weren't covered at all.
- Even a URL that passed the check could `302` to an internal address, and `redirect: "follow"` would fetch it without re-validating.

Fixed by resolving the hostname via `dns.lookup()` and checking the resulting IP(s) against the full private/reserved ranges (including the `172.16-31`, CGNAT `100.64/10`, and IPv6 cases above), and by following redirects manually so every hop gets the same validation, capped at 5 hops.

## Medium — fixed

**No security response headers anywhere.** There was no `headers()` in `next.config.js` and no `vercel.json`, so the deployed app shipped without `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy` on any response. Added all four as safe, app-agnostic defaults in `next.config.js`. I deliberately did **not** add a Content-Security-Policy — a real one has to enumerate every script/style/connect source the app actually uses (Stripe.js, Vercel Analytics, Supabase, the AI SDK's streaming responses, any fonts), and I could not load-test it against your live deployment from this environment (see "Not completed" below). Writing and testing that one is worth doing next, but guessing at it here risked silently breaking checkout or auth.

## Dependencies — mostly fixed

`npm audit` found 4 advisories; 3 are resolved now via `npm audit fix` (stayed within your existing `package.json` semver ranges, so no manual version bumps were needed):
- `js-yaml` (quadratic-complexity and exponential-parse-time DoS) → patched to 5.4.2.
- Top-level `postcss` / `nanoid` (XSS in CSS stringification, arbitrary `.map` file disclosure, weak-RNG DoS) → patched.

**Remaining, not auto-fixable:** Next.js itself. You're already on `14.2.35`, the newest release in the 14.x line — but several of the flagged advisories, including a **critical unauthenticated RCE** (image optimization AVIF handling, and a separate one on Windows-hosted servers) plus multiple SSRF/cache-poisoning/DoS issues, were only fixed starting in Next 15/16, not backported to 14.x. `npm audit fix --force` would jump to `next@16.3.5`, which is a breaking major-version change (App Router internals, middleware behavior, etc.) — not something to apply unattended without your review and a real test pass against this app. I'd recommend scheduling that upgrade; happy to do it in a follow-up with you watching the test suite run.

## Reviewed, no issues found

- **RLS policies** across the rest of the schema (`profiles`, `favorites`, `workbenches`, `challenges`/`challenge_attempts`/`user_streaks`, `mock_endpoints`/`mock_routes`, `webhook_bins`/`webhook_requests`, `salary_submissions`, `trainer_progress`, `tool_usage_events`) are consistently scoped to `auth.uid() = user_id` (or `is_public = true` for the handful of intentionally-public reads), and every place that needs a narrower anonymous door (mock API calls, webhook ingestion, clone-count increments, aggregated stats) uses a tightly-scoped `SECURITY DEFINER` function rather than opening the raw table — this is a genuinely well-thought-out pattern, consistently applied.
- **Stripe webhook signature verification** — correctly verifies `stripe-signature` against `STRIPE_WEBHOOK_SECRET`, checks payload size, and has event-id idempotency.
- **XSS** — the two tools that render arbitrary user Markdown as HTML (`MarkdownPreviewTool`, `MarkdownToHtmlTool`) both run their output through `DOMPurify.sanitize()` before `dangerouslySetInnerHTML`; the other `dangerouslySetInnerHTML` usage is static JSON-LD structured data.
- **Secrets/config** — no hardcoded keys found; `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` are all correctly server-only (never `NEXT_PUBLIC_`-prefixed), and `.env.local.example` only contains placeholders with clear warnings about the service-role key.
- **Auth flow / cookies** — standard `@supabase/ssr` middleware pattern for session refresh; OAuth/magic-link redirect URLs are built from `window.location.origin`, not attacker-controllable input, so no open-redirect.
- **`/mock/[slug]/...` and `/hook/[slug]/...` public endpoints** — intentionally unauthenticated by design (that's the product), but access is scoped through narrow `SECURITY DEFINER` functions keyed on exact slug match, not raw table reads, and body/header sizes are capped.

## Not completed — needs you

**Live-site header/error-handling probe.** This sandbox's outbound network policy blocked the connection to `wrench-dev-lr29.vercel.app` (`CONNECT` rejected with a 403 at the network proxy level, not from the site itself), and the web-fetch tool's permission prompt for that URL went unanswered. I couldn't independently verify response headers, error-page behavior, or endpoint exposure against the running deployment — everything above about headers is inferred from the absence of any `headers()`/`vercel.json` config in the code, which is reliable but isn't the same as observing the live response. If you want that piece done, the easiest path is `curl -sS -D - -o /dev/null https://wrench-dev-lr29.vercel.app/en` from your own machine, or tell me to retry the fetch and approve the prompt when it comes through.

## Summary of files changed

- `app/api/stripe/checkout/route.ts`, `app/api/stripe/webhook/route.ts` — use admin client for `subscriptions` writes
- `app/api/bug-report-generator/route.ts`, `app/api/regex-generator/route.ts` — added missing `checkAiLimit()` gate
- `app/api/headers/route.ts` — DNS-resolved SSRF guard + manual redirect re-validation
- `next.config.js` — added baseline security headers
- `supabase/ai-usage-fix-migration.sql` — **new file, needs to be run manually in Supabase SQL Editor**
- `package-lock.json` — `npm audit fix` (js-yaml, postcss, nanoid)

---

# Full re-audit — 2026-09-23

You asked to check the whole product for vulnerabilities, not just re-check the items above. Scope this time: everything built since the 2026-09-16 audit (personal API tokens, the public `/api/v1/*` API, portfolio PDF/PNG export, the Trainer's project-exercise iframe sandbox, Postman/Insomnia collection import, five new Supabase migrations), plus closing out the three things the last audit left open (Next.js version, CSP, live-header probe). `npx tsc --noEmit` passes clean, and all 50 pure-logic Playwright specs pass, after every change below. I also booted the dev server and loaded `/mock-api`, `/changelog`, `/leaderboard`, `/salary/report`, and `/trainer` to confirm nothing broke.

## Closing out the three open items from last time

**Next.js — already fixed, by you.** `package.json` is on `next@16.3.5` now (`git log` shows this landed in "fix: complete Next.js 16 / React 19 migration", after the last audit). That's well past the 15/16 line where the critical unauthenticated RCE and the SSRF/cache-poisoning advisories from last time's report were patched — nothing left to do here.

**CSP — added, in Report-Only mode.** `next.config.js` now ships a `Content-Security-Policy-Report-Only` header. I still can't load-test an *enforcing* policy against your live deployment from this sandbox, but Report-Only sidesteps that risk entirely: the browser evaluates it and logs violations to the DevTools console, but never blocks anything, so it cannot break checkout, auth, or an AI tool. I derived the sources from a static read of the codebase (there's no `@stripe/stripe-js` usage at all — checkout is a full-page redirect, not an iframe/script; no Realtime/websocket usage anywhere, webhook bins and mock endpoints poll instead; all AI calls are server-side; the only external hosts are Google Fonts for the portfolio themes). Full reasoning is in the comment above the `headers()` function. **What I'd like you to do:** use the site normally for a few days (including one checkout, one login, and each AI tool), watch the browser console for `Content-Security-Policy-Report-Only` violation reports, and once it's quiet, change the header key from `Content-Security-Policy-Report-Only` to `Content-Security-Policy` to start enforcing it.

**Live-site header probe — still blocked from this sandbox**, same network restriction as last time. Not re-attempted since nothing about that constraint changed; the `curl` command from the last report still works if you want to run it yourself.

## Medium — fixed

**`skill_endorsements` RLS allowed endorsing a skill the endorsee never claimed.** The table's own migration comment says the intent was "you can only endorse a tag the person already has in their `tech_stack`," but that was only ever checked in the UI (`SkillEndorsements.tsx` only shows buttons for tags in `profile.tech_stack`) — the `INSERT` policy itself didn't check it. Anyone who'd viewed a profile (satisfying the real anti-spam gate) could call `supabase.from("skill_endorsements").insert(...)` directly with an arbitrary `skill_tag` string, bypassing the UI entirely. This doesn't lead to XSS (unrecognized tags are filtered out by `getStackTag()` wherever they're displayed), but it undermines exactly the thing peer-endorsements were built to guarantee for the `cross_endorsed` badge (roadmap item 1, built earlier this session): that the underlying skills are real, not just claimed by enough friends. Fixed with a new migration, `supabase/skill-endorsements-tag-check-migration.sql` — tightens the `INSERT` policy to additionally require `skill_tag = ANY(profiles.tech_stack)` for the endorsee. **Needs to be run manually in the Supabase SQL Editor**, same as any migration in this repo.

## Low — fixed

**No upper bound on Mock API `response_body` length**, in either the form (`MockApiClient.tsx`) or the write endpoint used by personal API tokens (`app/api/v1/mock-endpoints/route.ts`). Since this only lets someone bloat rows in their own account under their own RLS, it's not a cross-user issue — at most a self-inflicted storage/UX problem. Added a shared `MAX_MOCK_RESPONSE_BODY_LENGTH` (20,000 chars) constant in `lib/tier-limits.ts`, enforced in both places.

## Reviewed, no issues found

- **Personal API tokens (roadmap item 13)** — 192-bit random token (`crypto.getRandomValues`), only the SHA-256 hash is ever stored, raw value shown exactly once at creation. Server-side verification (`lib/api-auth.ts`) correctly uses the service-role client (the only way to look up an owner by hash with no session), checks `revoked_at`, and updates `last_used_at` synchronously so it can't be lost to a serverless function exiting early.
- **All `app/api/v1/*` public API routes** (`mock-endpoints`, `webhook-bins` + its `/requests` reader, `tools`, `tools/[slug]`, `salary`, `salary/report`, `openapi.json`, `postman-collection.json`) — consistent input validation, per-user or per-IP rate limiting shared across related routes (so you can't dodge one endpoint's limit by hitting its sibling), and the webhook-bins reader explicitly re-checks `user_id` ownership rather than trusting the service-role bypass alone (a wrong slug from another user's bin correctly 404s, not leaks).
- **Mock API response serving (`/api/mock/[slug]/...`)** — always wrapped in `NextResponse.json()`, so even a non-JSON stored body can never be served with a browser-executable content type; no way to host a stored-XSS payload on the site's own origin through a mock response.
- **Postman/Insomnia collection import (`lib/mock-api/parse-collection.ts`)** — pure JSON parsing, no `eval`, capped at 200 parsed routes, entirely client-side; a pathologically malformed file can at worst crash the importing user's own tab, not affect anyone else. Parsed routes still pass through the same DB `CHECK` constraints (method/status/delay ranges) as manually-entered ones before they're saved.
- **Portfolio PDF/PNG export (`app/api/portfolio/[username]/route.tsx`)** — requires an authenticated session and explicitly checks `profile.id === user.id` (403 otherwise), unlike the anonymous `/api/badge/[username]` SVG badge. All rendered text goes through Satori/`next/og` as JSX text nodes, not raw HTML, so nothing in a bio/tagline/experience entry can inject markup into the exported image.
- **Trainer project-exercise iframe sandbox (`lib/trainer/run-project-exercise.ts`, built earlier this session)** — `sandbox="allow-scripts"` without `allow-same-origin` gives the iframe an opaque origin with no access to the parent DOM, cookies, or `localStorage`; the `postMessage` handler checks `e.source === iframe.contentWindow`, which is the correct and stronger check here (an explicit `e.origin === "null"` check would add nothing, since every such sandboxed iframe shares that same opaque-origin string — `e.source` identity is what actually pins the message to *this* iframe instance). Exercise HTML is 100% developer-authored static data, not user input, so there's no injection path into the harness itself today; worth revisiting only if the exercise system is ever opened to user-submitted content.
- **The five Supabase migrations added since the last audit** (`achievements-status`, `portfolio`, `profile-stack-location`, `salary-report`, `wrench-leaderboard`) — all public-read `SECURITY DEFINER` functions are narrowly scoped, filter on `is_public = true`, clamp any caller-supplied limit (`LEAST(GREATEST(p_limit, 1), 100)`), and use real anonymity thresholds (`count(*) >= 3`) rather than exposing raw rows. `profiles_equipped_badge_fk` is a nice touch I want to call out specifically — a composite foreign key that makes it a database-level guarantee, not just a UI convention, that you can't equip a badge you haven't actually earned.
- **CLI (`cli/src/lib/config.ts`, `http.ts`) and VS Code extension** — the CLI reads the personal token only from a flag or `WRENCH_API_TOKEN`/env, never writes it to a config file on disk, and only ever sends it in the `Authorization` header to the URL you configured. The VS Code extension doesn't handle tokens or make any network calls at all (its JWT tool is fully local/offline).
- **`npm audit`** — 3 advisories now (down from resolving 4 last time), all inside the `eslint-config-next` → `glob` chain, all `devDependencies` only (never shipped to users, not reachable by any request). Not fixed here: the available fix (`eslint-config-next@16.3.6`) requires `eslint@>=9`, which is a breaking config-format migration (flat config) I'm not willing to apply blind, for a dev-only tooling advisory. Worth doing as its own small task when you have a few minutes to confirm `next lint` still runs clean after.

## An honest note on something I didn't find

I went in expecting the peer-endorsement/badge work from earlier this session to be the weakest-reviewed code in the app, since it was built without a dedicated security pass at the time — that's exactly where the `skill_endorsements` tag-check gap above came from. Everything else I built this session (the Trainer iframe sandbox, the changelog, the portfolio print layout) held up under a second look with an explicitly adversarial mindset. I'd still treat "built in the same session, reviewed by the same session" as weaker evidence than a fresh pair of eyes would give you — flagging that limitation rather than overstating how much confidence this audit should buy you.

## Summary of files changed (this audit)

- `next.config.js` — added `Content-Security-Policy-Report-Only`
- `lib/tier-limits.ts` — added `MAX_MOCK_RESPONSE_BODY_LENGTH`
- `app/api/v1/mock-endpoints/route.ts`, `components/mock-api/MockApiClient.tsx` — enforce the new length cap
- `supabase/skill-endorsements-tag-check-migration.sql` — **new file, needs to be run manually in Supabase SQL Editor**
