import Link from "next/link";
import { Metadata } from "next";
import { categories, getToolsByCategory } from "@/lib/tools-registry";

export const metadata: Metadata = {
  title: "Documentation",
  description: "How to use Dev Toolbox's tools, and what's coming next.",
};

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 text-text-primary">
      <h1 className="text-2xl font-semibold md:text-3xl">Documentation</h1>
      <p className="mt-4 text-text-muted">
        Every tool page includes its own "How to use" steps and FAQ, so this page is mainly a map of
        what exists and what's planned.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Tools by category</h2>
        <div className="mt-3 space-y-2 text-sm">
          {categories.map((c) => (
            <div key={c.slug}>
              <Link href={`/categories/${c.slug}`} className="text-link hover:underline">
                {c.name}
              </Link>
              <span className="text-text-muted"> — {getToolsByCategory(c.slug).length} tools</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">How tools work</h2>
        <p className="mt-2 text-sm text-text-muted">
          With one exception (the Header Inspector, which needs a server hop to read cross-origin
          response headers), every tool runs entirely client-side in your browser. Nothing you paste
          into a formatter, encoder, or generator is uploaded anywhere.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">API access (coming soon)</h2>
        <p className="mt-2 text-sm text-text-muted">
          A versioned REST API (<code className="font-mono text-text-primary">/api/v1/...</code>) for
          scripting against the same tool logic is planned for the Pro/Team tiers — not available yet.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">AI tools (coming soon)</h2>
        <p className="mt-2 text-sm text-text-muted">
          See the <Link href="/#ai" className="text-link hover:underline">AI-Powered Tools</Link>{" "}
          section on the homepage for what's planned — these are gated behind a future Pro plan.
        </p>
      </section>
    </div>
  );
}
