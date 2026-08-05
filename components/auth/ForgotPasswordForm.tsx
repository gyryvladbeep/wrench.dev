"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { Locale, localePath } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const t = dict.auth;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${localePath(locale, "/auth/callback")}?next=/profile`,
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
        <p className="mt-3 text-sm text-text-primary">{t.resetLinkSent}</p>
        <p className="mt-1 text-xs text-text-muted">{email}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="fp-email" className="mb-1 block text-xs font-medium text-text-muted">
          {t.email}
        </label>
        <input
          id="fp-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="code-surface w-full rounded-[10px] p-2.5 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t.sending : t.sendResetLink}
      </Button>

      <p className="text-center text-sm text-text-muted">
        <Link href={localePath(locale, "/auth/login")} className="text-link hover:underline">
          {t.signIn}
        </Link>
      </p>
    </form>
  );
}
