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
