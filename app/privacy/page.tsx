import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Dev Toolbox handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-text-primary">
      <h1 className="text-2xl font-semibold md:text-3xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-text-muted">Last updated: [add date before launch]</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-text-muted">
        <section>
          <h2 className="text-base font-medium text-text-primary">The short version</h2>
          <p className="mt-2">
            Every tool on Dev Toolbox runs entirely in your browser. When you paste JSON into the
            formatter or decode a JWT, that data is processed locally on your device and is never sent
            to our servers. The one exception is the Header Inspector, which makes a stateless request
            to the URL you provide in order to read its response headers (browsers block this from
            running client-side) — we don't log the URLs you inspect.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary">Analytics</h2>
          <p className="mt-2">
            We use privacy-friendly, cookie-free analytics (e.g. Plausible or PostHog in
            self-hosted/anonymized mode) to understand which tools are used, without tracking
            individuals across sites or building advertising profiles.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary">Accounts (future)</h2>
          <p className="mt-2">
            If you create an account for a Pro or Team plan, we store your email address and the
            minimum account data needed to operate the service (subscription status, saved snippets
            you explicitly choose to save). We don't sell personal data.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary">Contact</h2>
          <p className="mt-2">
            Questions about this policy can be sent to the address on our{" "}
            <a href="/contact" className="text-link hover:underline">
              Contact
            </a>{" "}
            page.
          </p>
        </section>
      </div>

      <p className="mt-10 rounded-[10px] border border-dashed border-border bg-surface p-4 text-xs text-text-muted">
        This page is a starting template, not legal advice. Have it reviewed by a lawyer familiar with
        your jurisdiction and update it as features (accounts, billing, AI tools) ship.
      </p>
    </div>
  );
}
