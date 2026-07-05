import { Metadata } from "next";
import { ToolCard } from "@/components/ToolCard";
import { categories, getToolsByCategory } from "@/lib/tools-registry";

export const metadata: Metadata = {
  title: "All Developer Tools",
  description:
    "Browse every tool in Dev Toolbox — formatting, encoding, data generation, QA and API tools, all free and running entirely in your browser.",
};

export default function ToolsIndexPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-text-primary md:text-3xl">All Tools</h1>
      <p className="mt-2 max-w-2xl text-text-muted">
        Every tool below runs in your browser — nothing is uploaded to a server.
      </p>

      {categories.map((category) => {
        const toolsInCategory = getToolsByCategory(category.slug);
        if (toolsInCategory.length === 0) return null;
        return (
          <section key={category.slug} className="mt-10">
            <h2 className="text-lg font-medium text-text-primary">{category.name}</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {toolsInCategory.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
