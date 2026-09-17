export type ToolCategory =
  | "formatting"
  | "encoding"
  | "qa"
  | "api"
  | "text"
  | "hash"
  | "web"
  | "datetime"
  | "generators"
  | "gamedev";

export interface CategoryMeta {
  slug: ToolCategory;
  name: string;
  description: string;
  icon?: string;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

// "Зачем это нужно" — блок под инструментом, отдельный от механических
// howToSteps ("куда нажимать"): why объясняет реальную причину, зачем
// вообще тянуться за этим инструментом, а example — короткий жизненный
// сценарий, где это происходит на практике. Задумано специально для
// новичков, которые технически могут разобраться, куда жать, но не
// понимают, зачем — см. комментарий в components/ToolLayout.tsx о месте
// рендера в разметке.
export interface WhyItMatters {
  why: string;
  example: string;
}

export interface Tool {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  metaDescription: string;
  category: ToolCategory;
  isPopular?: boolean;
  isImplemented: boolean;
  isPremiumAI?: boolean;
  isFeatured?: boolean;
  isHidden?: boolean;
  relatedSlugs?: string[];
  howToSteps?: string[];
  faqs?: FaqEntry[];
  whyItMatters?: WhyItMatters;
  keywords: string[];
  aliases?: string[];
}
