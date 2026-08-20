import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { getRelatedTools, getCategoryBySlug } from "@/lib/tools-registry";
import { localizeTools, localizeCategory } from "@/lib/i18n/localize";
import { ToolLayout } from "@/components/ToolLayout";
import { RegexGeneratorClient } from "@/components/tools/RegexGeneratorClient";
import { Tool } from "@/lib/types";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu   = locale === "ru";
  return buildPageMetadata(locale, "/tools/regex-generator",
    isRu ? "Генератор регулярных выражений AI — Wrench-Branch" : "AI Regex Generator — Wrench-Branch",
    isRu ? "Опишите паттерн словами — AI напишет точное регулярное выражение с объяснением." : "Describe a pattern in plain words — AI writes the exact regex with explanation and examples."
  );
}

const TOOL: Tool = {
  slug: "regex-generator",
  name: "Regex Generator",
  shortDescription: "Describe a pattern in plain words — AI writes the regex.",
  longDescription: "Describe what you want to match in plain language and get a precise, well-explained regular expression. Supports JavaScript, Python, PCRE, Java and Go flavors. Includes live testing.",
  metaDescription: "Free AI regex generator. Describe a pattern in plain words and get a correct, explained regular expression. Supports JavaScript, Python, PCRE, Java, Go.",
  category: "qa",
  isImplemented: true,
  isPopular: true,
  keywords: ["regex generator", "regular expression generator", "regex ai", "regex builder"],
  howToSteps: [
    "Describe the pattern you want to match in plain language.",
    "Choose your regex flavor (JavaScript, Python, etc.) and flags.",
    "Optionally paste a test string to validate immediately.",
    "Click Generate — AI writes the regex with full explanation.",
    "Copy the regex or the full explanation with examples.",
  ],
  faqs: [
    { question: "What regex flavors are supported?", answer: "JavaScript, Python, PCRE, Java and Go. The generated regex will be optimized for the selected flavor." },
    { question: "Can I test the regex against my own string?", answer: "Yes. Paste your test string in the optional field and the tool will show matches in real time after generation." },
  ],
};

export default function RegexGeneratorPage({ params }: { params: { locale: string } }) {
  const locale  = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict    = getDictionary(locale);
  const related = localizeTools(getRelatedTools(TOOL), locale);
  const cat     = getCategoryBySlug("qa")!;
  const locCat  = localizeCategory(cat, locale);
  return (
    <ToolLayout tool={TOOL} locale={locale} dict={dict} categoryName={locCat.name} related={related}>
      <RegexGeneratorClient locale={locale} />
    </ToolLayout>
  );
}
