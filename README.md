# Dev Toolbox

[![Playwright Tests](https://github.com/gyryvladbeep/wrench.dev/actions/workflows/playwright.yml/badge.svg)](https://github.com/gyryvladbeep/wrench.dev/actions/workflows/playwright.yml)

Essential tools for Developers, QA Engineers and DevOps. Fast, free, no signup — every MVP tool runs entirely client-side.

This is the MVP code bundle that pairs with `dev-toolbox-master-plan.md` (business/product/SEO/roadmap). Read that first for the *why*; this file covers the *how*.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (schema only, not wired up yet) · designed for Vercel.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

> Note: a few packages (Tailwind, ESLint config, etc.) install from npm at setup time — this requires normal internet access on your machine, which isn't available in the sandbox this was built in.

## What's actually implemented vs. scaffolded

**Fully working, real client-side logic, no stubs (13 tools):**
- JSON Formatter & Validator (`/tools/json-formatter`)
- JSON Validator (`/tools/json-validator`) — live syntax check with line/column error location
- Base64 Encode/Decode (`/tools/base64-encode-decode`)
- URL Encode/Decode (`/tools/url-encode-decode`)
- UUID Generator (`/tools/uuid-generator`)
- JWT Decoder (`/tools/jwt-decoder`)
- Timestamp Converter (`/tools/timestamp-converter`)
- Random Password Generator (`/tools/random-password-generator`) — regenerates live as you move the length slider
- XML Formatter (`/tools/xml-formatter`) — validates via the browser's native XML parser
- HTML Formatter (`/tools/html-formatter`)
- Regex Tester (`/tools/regex-tester`) — live match highlighting + capture groups
- Curl Generator (`/tools/curl-generator`)
- Header Inspector (`/tools/header-inspector`) — the one tool with a small server route (`app/api/headers/route.ts`), since browsers block reading cross-origin response headers; includes a basic SSRF guard

**Scaffolded with real, indexable SEO pages but no interactive component yet** (renders a "Coming soon" state with a notify-me capture): SQL Formatter, Fake Test Data Generator, XPath Generator, CSS Selector Generator, API Request Builder, REST Request Builder.

> SQL Formatter is left unimplemented intentionally — a good one needs a real SQL-aware library (e.g. `sql-formatter` from npm) rather than a hand-rolled regex pass; add it as a dependency when you build that tool.

**Architected but intentionally not built:** authentication, billing, AI tool execution, public API, team workspaces. The Supabase schema (`supabase/schema.sql`) and the API design (see master plan §10) define the shape; nothing here calls them yet.

## The core pattern: how to add tool #6 (and #7...#100)

This is the part that matters most for scaling to 100 tools without it becoming 100x the work:

1. **Add metadata** — one object in `lib/tools-registry.ts` (`tools` array): slug, name, descriptions, category, keywords, `howToSteps`, `faqs`. This alone gives the tool a real SEO page, a sitemap entry, and a spot on its category page — it'll show as "Coming soon" immediately.
2. **Build the component** — `components/tools/YourToolName.tsx`. Keep all logic client-side and self-contained (look at `JsonFormatterTool.tsx` or `UuidGeneratorTool.tsx` for the pattern: a `"use client"` component, local state, a pure function for the transformation, a two-panel input/output layout using the shared `code-surface` style).
3. **Wire it up** — import it into `components/tools/registry-map.tsx` and add `"your-slug": YourToolComponent`.
4. **Flip the flag** — set `isImplemented: true` on that tool's registry entry.

That's it — no routing changes, no sitemap changes, no metadata changes. The dynamic route at `app/tools/[slug]/page.tsx` and `app/sitemap.ts` both read from the registry automatically.

## Folder structure

```
app/                     # routes (App Router)
  page.tsx               # homepage
  tools/page.tsx         # all-tools index
  tools/[slug]/page.tsx  # every tool page (registry-driven)
  categories/[category]/page.tsx
  api/headers/route.ts   # the one server route (Header Inspector)
  docs/ privacy/ terms/ contact/  # static pages linked from the footer
  sitemap.ts / robots.ts
components/
  ui/                    # button, card, badge primitives
  tools/                 # one component per actual tool + registry-map.tsx
  *.tsx                  # Header, Footer, ToolLayout, ToolCard, etc.
lib/
  types.ts               # Tool / Category types
  tools-registry.ts      # single source of truth for every tool
  seo.ts                 # metadata + JSON-LD builders
supabase/schema.sql      # forward-looking DB schema (Phase 2+, not wired up)
```

## Design notes

Dark-mode-first, near-black canvas (`#0B0B0F`) with a single warm amber accent (`#F0A23A`) — chosen deliberately over the more common cool-indigo/acid-green SaaS palette to feel a little more like a terminal and a little less like a generic AI app. Body type is system sans; all code/data surfaces use a monospace face, since for a tool like this the monospace treatment *is* the brand voice, not a decoration.

The homepage hero embeds a tiny live JSON formatter directly in the page (`components/HeroLiveDemo.tsx`) — the signature element is "try it before you click anything," which doubles as the clearest possible proof of the "useful without AI, useful without signup" thesis.

## Before deploying

- Set the real production domain in `lib/seo.ts` (`siteConfig.url`) — it's used in canonical URLs, JSON-LD, and the sitemap.
- Swap the placeholder fonts in `app/layout.tsx`/`globals.css` for real `next/font` loaded fonts (e.g. Inter + JetBrains Mono) once you have network access to fetch them at build time.
- Everything else (analytics, auth, billing) is intentionally not wired up yet — see the master plan's roadmap for sequencing.