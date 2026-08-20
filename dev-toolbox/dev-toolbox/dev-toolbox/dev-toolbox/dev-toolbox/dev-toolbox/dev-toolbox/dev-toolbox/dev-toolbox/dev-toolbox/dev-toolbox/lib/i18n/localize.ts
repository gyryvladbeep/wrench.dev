import { Tool, CategoryMeta, ToolCategory } from "@/lib/types";
import { Locale } from "./config";
import { ruToolContent } from "./ru-content";
import { ruCategoryContent } from "./ru-content";
import { aiTools as registryAiTools } from "@/lib/tools-registry";

export function localizeTool(tool: Tool, locale: Locale): Tool {
  if (locale !== "ru") return tool;
  const ru = ruToolContent[tool.slug];
  if (!ru) return tool;
  return {
    ...tool,
    name: ru.name ?? tool.name,
    shortDescription: ru.shortDescription ?? tool.shortDescription,
    longDescription: ru.longDescription ?? tool.longDescription,
    metaDescription: ru.metaDescription ?? tool.metaDescription,
    howToSteps: ru.howToSteps ?? tool.howToSteps,
    faqs: ru.faqs ?? tool.faqs,
  };
}

export function localizeTools(tools: Tool[], locale: Locale): Tool[] {
  return tools.map((t) => localizeTool(t, locale));
}

export function localizeCategory(category: CategoryMeta, locale: Locale): CategoryMeta {
  if (locale !== "ru") return category;
  const ru = ruCategoryContent[category.slug as ToolCategory];
  if (!ru) return category;
  return { ...category, name: ru.name, description: ru.description };
}

export function localizeCategories(categories: CategoryMeta[], locale: Locale): CategoryMeta[] {
  return categories.map((c) => localizeCategory(c, locale));
}

export function localizeAiTools(
  tools: { name: string; description: string }[],
  locale: Locale
): { name: string; description: string }[] {
  if (locale !== "ru") return tools;
  const ruNames: Record<string, { name: string; description: string }> = {
    "Explain JSON":         { name: "Объяснить JSON",       description: "Получить объяснение любой JSON-структуры простым языком." },
    "Generate SQL Query":   { name: "Сгенерировать SQL",    description: "Опишите задачу на русском — получите SQL-запрос." },
    "Generate Test Cases":  { name: "Тест-кейсы",           description: "Генерация тест-кейсов из описания фичи или user story." },
    "Explain API Response": { name: "Объяснить ответ API",  description: "Понять любой ответ API, включая коды ошибок." },
    "Generate Regex":       { name: "Сгенерировать regex",  description: "Опишите паттерн — получите рабочее регулярное выражение." },
    "Explain Regex":        { name: "Объяснить regex",      description: "Вставьте регулярное выражение — получите объяснение." },
    "JSON to TypeScript":   { name: "JSON → TypeScript",    description: "Конвертация JSON-примера в TypeScript-интерфейсы." },
  };
  return tools.map((t) => ruNames[t.name] ?? t);
}

export { registryAiTools as aiTools };
