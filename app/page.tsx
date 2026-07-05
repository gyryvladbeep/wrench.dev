import Link from "next/link";
import { HeroLiveDemo } from "@/components/HeroLiveDemo";
import { ToolCard } from "@/components/ToolCard";
import { CategoryCard } from "@/components/CategoryCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPopularTools, categories, aiTools } from "@/lib/tools-registry";

export default function HomePage() {
  const popularTools = getPopularTools();

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-16 pb-8 text-center">
        <h1 className="text-3xl font-semibold text-text-primary md:text-5xl">
          Developer tools you&apos;ll actually use every day.
        </h1>
        <p className="mt-4 text-lg text-text-muted">Format, validate, generate and debug faster.</p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/tools"
            className="rounded-[10px] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent/90"
          >
            Start Using Tools
          </Link>
        </div>
        <HeroLiveDemo />
        <p className="mt-2 text-xs text-text-muted">
          That&apos;s it — no signup. Everything above ran in your browser.
        </p>
      </section>

      {/* Popular tools */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-xl font-semibold text-text-primary">Popular Tools</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popularTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-xl font-semibold text-text-primary">Categories</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </section>

      {/* Future AI */}
      <section id="ai" className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-text-primary">AI-Powered Tools</h2>
          <Badge variant="pro">Coming Soon</Badge>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          The same fast tools above, plus an AI layer for the parts that benefit from explanation and
          generation rather than pure computation — planned as a Pro feature.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {aiTools.map((tool) => (
            <Card key={tool.name}>
              <h3 className="font-medium text-text-primary">{tool.name}</h3>
              <p className="mt-2 text-sm text-text-muted">{tool.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
