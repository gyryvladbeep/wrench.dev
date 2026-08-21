"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { Locale, localePath } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { OAuthButtons } from "./OAuthButtons";

export function SignupForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const supabase = createClient();
  const t = dict.auth;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError(t.passwordsNoMatch); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${localePath(locale, "/auth/callback")}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="py-4 text-center">
        <p className="text-2xl">📬</p>
        <p className="mt-3 text-sm text-text-primary">{t.checkEmail}</p>
        <p className="mt-1 text-xs text-text-muted">{email}</p>
      </div>
    );
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
          <label htmlFor="su-email" className="mb-1 block text-xs font-medium text-text-muted">
            {t.email}
          </label>
          <input
            id="su-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="code-surface w-full rounded-[10px] p-2.5 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label htmlFor="su-password" className="mb-1 block text-xs font-medium text-text-muted">
            {t.password}
          </label>
          <input
            id="su-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="code-surface w-full rounded-[10px] p-2.5 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label htmlFor="su-confirm" className="mb-1 block text-xs font-medium text-text-muted">
            {t.confirmPassword}
          </label>
          <input
            id="su-confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="code-surface w-full rounded-[10px] p-2.5 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t.signingUp : t.signUp}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-text-muted">
        {t.hasAccount}{" "}
        <Link href={localePath(locale, "/auth/login")} className="text-link hover:underline">
          {t.signIn}
        </Link>
      </p>
    </div>
  );
}
