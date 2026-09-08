import { Tool, ToolCategory } from "./types";
import { allTools } from "./tools-registry";
import type { GameIconId } from "@/components/icons/GameIcons";

/**
 * "Disciplines" group the underlying tool categories into the 4 buckets
 * an engineer instinctively recognizes: QA, Frontend, Backend/API, and
 * general Utilities. This is a display-only mapping layered on top of
 * the existing category system — it doesn't change tool data, routing,
 * or SEO category pages, only how the homepage organizes tools visually.
 */
export type Discipline = "qa" | "frontend" | "backend" | "utilities" | "gamedev";

export interface DisciplineMeta {
  id: Discipline;
  labelEn: string;
  labelRu: string;
  taglineEn: string;
  taglineRu: string;
  // Раньше — эмодзи прямо в данных, теперь id иконки из GameIcons.tsx.
  icon: GameIconId;
  color: string;
  categories: ToolCategory[];
}

export const DISCIPLINES: DisciplineMeta[] = [
  {
    id: "qa",
    labelEn: "QA Arsenal",
    labelRu: "QA Арсенал",
    taglineEn: "Test design, negative testing, bug reports",
    taglineRu: "Тест-дизайн, негативное тестирование, баг-репорты",
    icon: "flask",
    color: "#6bbd97",
    categories: ["qa"],
  },
  {
    id: "frontend",
    labelEn: "Frontend Toolkit",
    labelRu: "Frontend Тулкит",
    taglineEn: "Selectors, formatting, encoding, text utilities",
    taglineRu: "Селекторы, форматирование, кодирование, текст",
    icon: "brackets",
    color: "#759ac7",
    categories: ["formatting", "encoding", "text", "web"],
  },
  {
    id: "backend",
    labelEn: "Backend & API",
    labelRu: "Backend и API",
    taglineEn: "Requests, mocking, hashing, status codes",
    taglineRu: "Запросы, моки, хэши, коды статусов",
    icon: "gear",
    color: "#9987c9",
    categories: ["api", "hash"],
  },
  {
    id: "utilities",
    labelEn: "Generators & Utilities",
    labelRu: "Генераторы и утилиты",
    taglineEn: "IDs, dates, passwords, everyday helpers",
    taglineRu: "ID, даты, пароли, повседневные помощники",
    icon: "wrench",
    color: "#c49964",
    categories: ["generators", "datetime", "data"],
  },
  {
    id: "gamedev",
    labelEn: "Gamedev",
    labelRu: "Геймдев",
    taglineEn: "Loot tables, coordinates, framerate-independent math",
    taglineRu: "Таблицы лута, координаты, математика независимая от FPS",
    icon: "gamepad",
    color: "#c774a8",
    categories: ["gamedev"],
  },
];

export function getToolsForDiscipline(discipline: Discipline, limit?: number): Tool[] {
  const meta = DISCIPLINES.find((d) => d.id === discipline);
  if (!meta) return [];
  const tools = allTools.filter(
    (t) => t.isImplemented && meta.categories.includes(t.category)
  );
  // Popular/featured first, then the rest
  const sorted = [...tools].sort((a, b) => {
    const aScore = (a.isFeatured ? 2 : 0) + (a.isPopular ? 1 : 0);
    const bScore = (b.isFeatured ? 2 : 0) + (b.isPopular ? 1 : 0);
    return bScore - aScore;
  });
  return limit ? sorted.slice(0, limit) : sorted;
}

export function getDisciplineToolCount(discipline: Discipline): number {
  const meta = DISCIPLINES.find((d) => d.id === discipline);
  if (!meta) return 0;
  return allTools.filter((t) => t.isImplemented && meta.categories.includes(t.category)).length;
}