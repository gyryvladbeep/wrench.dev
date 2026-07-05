import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch about Dev Toolbox.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-text-primary">
      <h1 className="text-2xl font-semibold md:text-3xl">Contact</h1>
      <p className="mt-4 text-sm leading-relaxed text-text-muted">
        Found a bug, have a tool request, or want to talk about a Team plan? Email{" "}
        <a href="mailto:hello@devtoolbox.example.com" className="text-link hover:underline">
          hello@devtoolbox.example.com
        </a>{" "}
        — replace this with your real inbox before launch.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-text-muted">
        Tool requests are especially welcome: tell us the tool, and roughly how often you'd use it —
        that's exactly the signal used to prioritize what gets built next (see the roadmap in the
        master plan).
      </p>
    </div>
  );
}
