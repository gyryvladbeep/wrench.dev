import { Metadata } from "next";
import { notFound } from "next/navigation";
import { tools, getToolBySlug } from "@/lib/tools-registry";
import { buildToolMetadata, buildToolJsonLd } from "@/lib/seo";
import { ToolLayout } from "@/components/ToolLayout";
import { JsonLd } from "@/components/JsonLd";
import { ComingSoonTool } from "@/components/tools/ComingSoonTool";
import { registryMap } from "@/components/tools/registry-map";

/** Pre-renders every tool page at build time (SSG) — this is what lets the
 *  site scale to 100 tools while staying fully static and instant. */
export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const tool = getToolBySlug(params.slug);
  if (!tool) return {};
  return buildToolMetadata(tool);
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const tool = getToolBySlug(params.slug);
  if (!tool) notFound();

  const ToolComponent = registryMap[tool.slug];

  return (
    <>
      <JsonLd data={buildToolJsonLd(tool)} />
      <ToolLayout tool={tool}>
        {ToolComponent ? <ToolComponent /> : <ComingSoonTool tool={tool} />}
      </ToolLayout>
    </>
  );
}
