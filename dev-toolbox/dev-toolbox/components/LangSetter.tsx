"use client";

import { useEffect } from "react";

/**
 * Sets the lang attribute on <html> after hydration.
 * The root layout renders <html suppressHydrationWarning> without a lang,
 * so this client-side update is the only place it gets set correctly
 * per locale without causing a hydration mismatch.
 *
 * Screen readers and search engines will see the correct lang on every
 * navigated page; the initial HTML served from the server will have
 * suppressHydrationWarning to silence the controlled mismatch.
 */
export function LangSetter({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return null;
}
