export type ToolCategory =
  | "formatting"
  | "encoding"
  | "data"
  | "qa"
  | "api"
  | "text"
  | "hash"
  | "web"
  | "datetime"
  | "generators";

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
  relatedSlugs?: string[];
  howToSteps?: string[];
  faqs?: FaqEntry[];
  keywords: string[];
  /** Alternative names/aliases for search */
  aliases?: string[];
}
