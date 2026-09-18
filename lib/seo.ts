import { Metadata } from "next";
import { Tool } from "./types";
import { Article } from "./knowledge/articles";
import { Locale, localePath } from "./i18n/config";

export const siteConfig = {
  name: "Wrench-Branch",
  tagline: "Professional developer tools in one workspace",
  // Было "https://wrench-branch.dev" — домен, который никогда не
  // резолвился (не куплен/не подключён; происхождение неизвестно).
  // canonical, hreflang, og:url, sitemap.xml и robots.txt (все читают
  // это же siteConfig.url) молча указывали на несуществующий адрес.
  // Реальный прод — Vercel-домен ниже; поменять здесь на кастомный
  // домен, если/когда wrench-branch.dev будет реально куплен и подключён.
  url: "https://wrench-branch.vercel.app",
};

function buildAlternates(locale: Locale, path: string) {
  return {
    canonical: `${siteConfig.url}${localePath(locale, path)}`,
    languages: {
      en: `${siteConfig.url}${localePath("en", path)}`,
      ru: `${siteConfig.url}${localePath("ru", path)}`,
      // Tells Google which version to show a visitor whose browser/country
      // doesn't match either explicit language — without it, search engines
      // have to guess. English is the site's actual default (localePath("en", ...)
      // is also the un-prefixed root path), so it's the correct x-default.
      "x-default": `${siteConfig.url}${localePath("en", path)}`,
    },
  };
}

export function buildPageMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  return { title, description, alternates: buildAlternates(locale, path) };
}

export function buildToolMetadata(tool: Tool, locale: Locale): Metadata {
  const title = `${tool.name} — ${siteConfig.name}`;
  const path  = `/tools/${tool.slug}`;
  return {
    title,
    description: tool.metaDescription,
    alternates:  buildAlternates(locale, path),
    openGraph: {
      title, description: tool.metaDescription,
      url: `${siteConfig.url}${localePath(locale, path)}`,
      siteName: siteConfig.name, type: "website",
    },
    twitter: { card: "summary", title, description: tool.metaDescription },
    keywords: tool.keywords,
  };
}

export function buildCategoryMetadata(locale: Locale, categorySlug: string, title: string, description: string): Metadata {
  return buildPageMetadata(locale, `/categories/${categorySlug}`, title, description);
}

export function buildArticleMetadata(article: Article, locale: Locale): Metadata {
  const isRu  = locale === "ru";
  const title = `${isRu ? article.titleRu : article.title} — ${siteConfig.name}`;
  const desc  = isRu ? article.summaryRu : article.summary;
  const path  = `/knowledge/${article.slug}`;
  return {
    title,
    description: desc,
    alternates:  buildAlternates(locale, path),
    openGraph: {
      title, description: desc,
      url: `${siteConfig.url}${localePath(locale, path)}`,
      siteName: siteConfig.name, type: "article",
    },
    twitter: { card: "summary", title, description: desc },
    keywords: article.tags,
  };
}

// Article schema (not FAQPage/SoftwareApplication like buildToolJsonLd —
// an article isn't a tool or a Q&A list) plus the same BreadcrumbList
// pattern used for tools, so a knowledge article gets the same real
// search-result treatment a tool page already does.
export function buildArticleJsonLd(article: Article, locale: Locale, homeLabel: string, knowledgeLabel: string) {
  const isRu = locale === "ru";
  const path = `/knowledge/${article.slug}`;
  const url  = `${siteConfig.url}${localePath(locale, path)}`;
  const knowledgeUrl = `${siteConfig.url}${localePath(locale, "/knowledge")}`;
  const homeUrl = `${siteConfig.url}${localePath(locale, "/")}`;
  const title = isRu ? article.titleRu : article.title;
  return [
    {
      "@context": "https://schema.org", "@type": "Article",
      headline: title,
      description: isRu ? article.summaryRu : article.summary,
      url,
      keywords: article.tags.join(", "),
      publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeLabel, item: homeUrl },
        { "@type": "ListItem", position: 2, name: knowledgeLabel, item: knowledgeUrl },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    },
  ];
}

export function buildToolJsonLd(tool: Tool, locale: Locale, categoryName: string, homeLabel: string) {
  const path = `/tools/${tool.slug}`;
  const url  = `${siteConfig.url}${localePath(locale, path)}`;
  const catUrl  = `${siteConfig.url}${localePath(locale, `/categories/${tool.category}`)}`;
  const homeUrl = `${siteConfig.url}${localePath(locale, "/")}`;
  return [
    {
      "@context": "https://schema.org", "@type": "SoftwareApplication",
      name: tool.name, applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (browser)", description: tool.metaDescription,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url,
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeLabel, item: homeUrl },
        { "@type": "ListItem", position: 2, name: categoryName, item: catUrl },
        { "@type": "ListItem", position: 3, name: tool.name, item: url },
      ],
    },
    ...(tool.faqs?.length ? [{
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: tool.faqs.map((f) => ({
        "@type": "Question", name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    }] : []),
  ];
}

// ItemList + BreadcrumbList для /leaderboard (пункт 22 из
// ROADMAP-BRAINSTORM.md — "не только срез в дайджесте", отдельная
// индексируемая страница) — тот же двухблочный приём, что уже у
// buildArticleJsonLd(): один блок описывает сам контент страницы,
// второй — её место в навигации сайта. ItemList.item — ссылка на
// публичный профиль, а не полноценная Person-сущность: у профилей нет
// устойчивого внешнего identifier'а (email/sameAs), раздувать разметку
// ради топ-N ников не даёт поисковику ничего, чего не даёт сама
// страница со ссылками на /u/[username].
export function buildLeaderboardJsonLd(
  locale: Locale,
  homeLabel: string,
  leaderboardLabel: string,
  entries: { username: string; display_name: string | null }[]
) {
  const path = "/leaderboard";
  const url  = `${siteConfig.url}${localePath(locale, path)}`;
  const homeUrl = `${siteConfig.url}${localePath(locale, "/")}`;
  return [
    {
      "@context": "https://schema.org", "@type": "ItemList",
      name: leaderboardLabel,
      url,
      itemListElement: entries.map((e, i) => ({
        "@type": "ListItem", position: i + 1,
        name: e.display_name || `@${e.username}`,
        url: `${siteConfig.url}${localePath(locale, `/u/${e.username}`)}`,
      })),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeLabel, item: homeUrl },
        { "@type": "ListItem", position: 2, name: leaderboardLabel, item: url },
      ],
    },
  ];
}

// Пункт 23 из ROADMAP-BRAINSTORM.md — тот же двухблочный приём, что и
// у buildLeaderboardJsonLd() выше, но контент тут не список сущностей
// (профилей), а агрегированная статистика, поэтому Dataset — более
// точный тип schema.org, чем ItemList (и потенциально попадает в
// Google Dataset Search, отдельный бонус к обычному веб-поиску).
// variableMeasured называет сами измеряемые величины, а не приводит
// числа — числа и так в самом HTML таблицы, дублировать их в JSON-LD
// не даёт ничего, чего не даёт сам контент страницы.
export function buildSalaryReportJsonLd(
  locale: Locale,
  homeLabel: string,
  salaryLabel: string,
  reportLabel: string,
  sampleSize: number
) {
  const path = "/salary/report";
  const url  = `${siteConfig.url}${localePath(locale, path)}`;
  const homeUrl = `${siteConfig.url}${localePath(locale, "/")}`;
  const salaryUrl = `${siteConfig.url}${localePath(locale, "/salary")}`;
  const isRu = locale === "ru";
  return [
    {
      "@context": "https://schema.org", "@type": "Dataset",
      name: reportLabel,
      description: isRu
        ? "Агрегированная, анонимизированная статистика зарплат QA-инженеров и разработчиков по роли, уровню и стране — собрано пользователями Wrench-Branch."
        : "Aggregated, anonymized QA/developer salary statistics by role, seniority and country — crowd-sourced from Wrench-Branch users.",
      url,
      variableMeasured: [
        isRu ? "Медианная зарплата (USD/мес)" : "Median salary (USD/month)",
        isRu ? "Средняя зарплата (USD/мес)" : "Average salary (USD/month)",
        isRu ? "Диапазон зарплат (USD/мес)" : "Salary range (USD/month)",
      ],
      // Не чувствительное само по себе (см. комментарий в
      // supabase/salary-report-migration.sql) — общее число откликов,
      // не связанное ни с одной конкретной суммой.
      size: `${sampleSize} responses`,
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeLabel, item: homeUrl },
        { "@type": "ListItem", position: 2, name: salaryLabel, item: salaryUrl },
        { "@type": "ListItem", position: 3, name: reportLabel, item: url },
      ],
    },
  ];
}
