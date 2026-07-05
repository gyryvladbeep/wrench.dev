import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { categories, getCategoryBySlug, getToolsByCategory } from "@/lib/tools-registry";
import { ToolCard } from "@/components/ToolCard";
import { siteConfig } from "@/lib/seo";
import { ToolCategory } from "@/lib/types";

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const category = getCategoryBySlug(params.category as ToolCategory);
  if (!category) return {};
  const title = `${category.name} Tools`;
  return {
    title,
    description: category.description,
    alternates: { canonical: `${siteConfig.url}/categories/${category.slug}` },
  };
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const category = getCategoryBySlug(params.category as ToolCategory);
  if (!category) notFound();
  const toolsInCategory = getToolsByCategory(category.slug);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-muted">
        <Link href="/" className="hover:text-text-primary">
          Home
        </Link>
        {" / "}
        <span className="text-text-primary">{category.name}</span>
      </nav>
      <h1 className="text-2xl font-semibold text-text-primary md:text-3xl">{category.name} Tools</h1>
      <p className="mt-2 max-w-2xl text-text-muted">{category.description}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {toolsInCategory.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </div>
  );
}
