import { Finding, finding, sortFindings } from "../mobile/findings";

export interface UnfurlMeta {
  title: string | null;
  description: string | null;
  canonical: string | null;
  og: Record<string, string>;
  twitter: Record<string, string>;
  icons: string[];
}

export interface UnfurlPreview {
  title: string;
  description: string;
  image: string | null;
  siteName: string | null;
  url: string;
}

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? "");
  return out;
}

function decode(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

export function parseMeta(html: string): UnfurlMeta {
  const og: Record<string, string> = {};
  const twitter: Record<string, string> = {};
  let description: string | null = null;
  let canonical: string | null = null;
  const icons: string[] = [];
  const duplicates: string[] = [];
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    const key = (a.property ?? a.name ?? "").toLowerCase();
    const content = a.content;
    if (!key || content === undefined) continue;
    if (key.startsWith("og:")) { if (og[key] !== undefined) duplicates.push(key); else og[key] = content; }
    else if (key.startsWith("twitter:")) twitter[key] = content;
    else if (key === "description") description = content;
  }
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    const rel = (a.rel ?? "").toLowerCase();
    if (rel === "canonical" && a.href) canonical = a.href;
    if (rel.split(/\s+/).includes("icon") && a.href) icons.push(a.href);
  }
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const meta: UnfurlMeta = { title: t ? decode(t[1].trim()) : null, description, canonical, og, twitter, icons };
  (meta as UnfurlMeta & { duplicates?: string[] }).duplicates = duplicates;
  return meta;
}

function resolve(href: string | null | undefined, base: string): string | null {
  if (!href) return null;
  try { return new URL(href, base).toString(); } catch { return null; }
}

/** Что, скорее всего, покажет чат: порядок источников как у большинства unfurl-сервисов. */
export function buildPreview(meta: UnfurlMeta, pageUrl: string): UnfurlPreview {
  return {
    title: meta.og["og:title"] ?? meta.twitter["twitter:title"] ?? meta.title ?? pageUrl,
    description: meta.og["og:description"] ?? meta.twitter["twitter:description"] ?? meta.description ?? "",
    image: resolve(meta.og["og:image"] ?? meta.twitter["twitter:image"], meta.og["og:url"] ?? pageUrl),
    siteName: meta.og["og:site_name"] ?? null,
    url: meta.og["og:url"] ?? meta.canonical ?? pageUrl,
  };
}

export function checkMeta(meta: UnfurlMeta, pageUrl: string): Finding[] {
  const f: Finding[] = [];
  const dups = (meta as UnfurlMeta & { duplicates?: string[] }).duplicates ?? [];
  if (!meta.og["og:title"]) f.push(finding("warning", "no-og-title", "No og:title: the chat falls back to the page title.", "Нет og:title: чат возьмёт заголовок страницы."));
  else if (meta.og["og:title"].length > 70) f.push(finding("info", "title-long", `og:title is ${meta.og["og:title"].length} characters and may be truncated in the card.`, `og:title длиной ${meta.og["og:title"].length} символов может обрезаться в карточке.`));
  if (!meta.og["og:description"] && !meta.description) f.push(finding("warning", "no-description", "No description: the card shows no text under the title.", "Нет описания: под заголовком в карточке не будет текста."));
  else if ((meta.og["og:description"] ?? meta.description ?? "").length > 200) f.push(finding("info", "description-long", "The description is over 200 characters and is usually cut.", "Описание длиннее 200 символов, обычно его обрезают."));
  const image = meta.og["og:image"] ?? meta.twitter["twitter:image"];
  if (!image) f.push(finding("warning", "no-image", "No og:image: the card has no picture.", "Нет og:image: у карточки не будет картинки."));
  else {
    if (!/^https?:\/\//i.test(image)) f.push(finding("warning", "image-relative", "The image URL is relative; many crawlers need an absolute URL.", "Адрес картинки относительный; многим краулерам нужен абсолютный."));
    if (/^http:\/\//i.test(image)) f.push(finding("warning", "image-http", "The image is served over http and may be blocked.", "Картинка отдаётся по http и может быть заблокирована."));
    if (!meta.og["og:image:width"] || !meta.og["og:image:height"]) f.push(finding("info", "image-size-missing", "No og:image:width and og:image:height: the first render may jump when the image loads.", "Нет og:image:width и og:image:height: при первой отрисовке карточка может подпрыгнуть после загрузки картинки."));
  }
  if (!meta.twitter["twitter:card"]) f.push(finding("info", "no-twitter-card", "No twitter:card; some services use it for the card layout.", "Нет twitter:card; часть сервисов берёт из него вид карточки."));
  if (meta.og["og:url"] && meta.canonical && meta.og["og:url"] !== meta.canonical) f.push(finding("warning", "url-mismatch", "og:url and the canonical link differ; the same page can be cached twice.", "og:url и canonical различаются; одна страница может кешироваться дважды."));
  if (meta.og["og:url"] && !meta.canonical) { /* допустимо */ }
  if (dups.length) f.push(finding("warning", "duplicate-og", `Duplicate tags: ${[...new Set(dups)].join(", ")}. Crawlers usually take the first.`, `Повторяющиеся теги: ${[...new Set(dups)].join(", ")}. Краулеры обычно берут первый.`));
  if (f.length === 0) f.push(finding("info", "ok", "The card tags look complete.", "Теги карточки выглядят полными."));
  return sortFindings(f);
}

export const SAMPLE_HTML = `<head>
  <title>Release notes 4.2 - Acme Chat</title>
  <meta name="description" content="What is new in Acme Chat 4.2: threads, search and faster uploads.">
  <link rel="canonical" href="https://acme.example/blog/release-4-2">
  <meta property="og:title" content="Acme Chat 4.2 is here">
  <meta property="og:description" content="Threads, search and faster uploads.">
  <meta property="og:image" content="/img/release-4-2.png">
  <meta property="og:url" content="https://acme.example/blog/release-4-2/">
  <meta property="og:site_name" content="Acme Chat">
</head>`;
