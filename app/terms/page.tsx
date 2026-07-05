import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using Dev Toolbox.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-text-primary">
      <h1 className="text-2xl font-semibold md:text-3xl">Terms of Service</h1>
      <p className="mt-2 text-sm text-text-muted">Last updated: [add date before launch]</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-text-muted">
        <section>
          <h2 className="text-base font-medium text-text-primary">Using the tools</h2>
          <p className="mt-2">
            Dev Toolbox is provided free for the tools marked available on the site, with paid Pro and
            Team plans for additional features (AI tools, saved history, API access) once those launch.
            Tools are provided "as is" — review any generated output (formatted code, generated test
            data, AI suggestions) before relying on it in production.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary">Acceptable use</h2>
          <p className="mt-2">
            Don't use the tools to process data you don't have the right to handle, to attack or
            scan systems you don't own or have permission to test (this applies especially to the
            Header Inspector and any future API-testing tools), or to abuse rate limits.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary">No warranty</h2>
          <p className="mt-2">
            We do our best to keep tools accurate and available, but we don't guarantee
            uninterrupted availability or that every output is correct — particularly for AI-generated
            content once that ships.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary">Changes</h2>
          <p className="mt-2">
            We may update these terms as the product evolves (accounts, billing, AI features). Material
            changes will be reflected by updating the date above.
          </p>
        </section>
      </div>

      <p className="mt-10 rounded-[10px] border border-dashed border-border bg-surface p-4 text-xs text-text-muted">
        This page is a starting template, not legal advice. Have it reviewed by a lawyer before launch.
      </p>
    </div>
  );
}
