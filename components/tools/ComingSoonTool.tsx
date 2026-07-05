"use client";

import { useState } from "react";
import { Tool } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dictionary } from "@/lib/i18n/dictionary-types";

/** SEO-friendly placeholder for tools that have a page (and are indexed)
 *  before the interactive component is built. Captures interest via a
 *  lightweight "notify me" email field — useful as an early warm list
 *  for the eventual Pro launch. */
export function ComingSoonTool({ tool, dict }: { tool: Tool; dict: Dictionary }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to Supabase `waitlist` table once backend exists.
    setSubmitted(true);
  }

  return (
    <div className="rounded-[10px] border border-dashed border-border bg-surface p-8 text-center">
      <p className="text-sm text-text-muted">{dict.comingSoon.body}</p>
      {!submitted ? (
        <form onSubmit={handleSubmit} className="mx-auto mt-4 flex max-w-sm gap-2">
          <input
            type="email"
            required
            placeholder={dict.comingSoon.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="code-surface flex-1 rounded-[10px] p-2 text-sm text-text-primary outline-none"
          />
          <Button type="submit">{dict.comingSoon.notifyMe}</Button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-accent">{dict.comingSoon.thanks.replace("{name}", tool.name)}</p>
      )}
    </div>
  );
}
