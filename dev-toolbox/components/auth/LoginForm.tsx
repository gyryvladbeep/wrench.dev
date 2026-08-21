"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { Locale, localePath } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { OAuthButtons } from "./OAuthButtons";

export function LoginForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();
  const t = dict.auth;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(localePath(locale, "/profile"));
      router.refresh();
    }
  }

  return (
    <div>
      <OAuthButtons dict={dict} locale={locale} />

      <div className="my-4 flex items-center gap-3">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-text-muted">{t.orDivider}</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="email" className="mb-1 block text-xs font-medium text-text-muted">
            {t.email}
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="code-surface w-full rounded-[10px] p-2.5 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-medium text-text-muted">
              {t.password}
            </label>
            <Link
              href={localePath(locale, "/auth/forgot-password")}
              className="text-xs text-link hover:underline"
            >
              {t.forgotPasswordLink}
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="code-surface w-full rounded-[10px] p-2.5 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t.signingIn : t.signIn}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-text-muted">
        {t.noAccount}{" "}
        <Link href={localePath(locale, "/auth/signup")} className="text-link hover:underline">
          {t.signUp}
        </Link>
      </p>
    </div>
  );
}
