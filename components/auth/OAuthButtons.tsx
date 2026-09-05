"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { Locale, localePath } from "@/lib/i18n/config";

type Provider = "google" | "github";

const PROVIDER_LABEL: Record<Provider, string> = { google: "Google", github: "GitHub" };

export function OAuthButtons({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = dict.auth;

  /**
   * ═══════════════════════════════════════════════════════════════
   * Почему тут не просто supabase.auth.signInWithOAuth({ provider })
   * ═══════════════════════════════════════════════════════════════
   * Раньше так и было — и выглядело абсолютно правильно, но пряталась
   * ошибка, которую нельзя было увидеть, не попробовав кнопку вживую.
   *
   * signInWithOAuth() строит ссылку авторизации ЦЕЛИКОМ на клиенте и
   * никогда заранее не спрашивает сервер, включён ли вообще этот
   * провайдер в Supabase Dashboard → Authentication → Providers. Он
   * просто сразу уводит браузер (window.location) по этой ссылке.
   * Если провайдер выключен (или не настроен Client ID/Secret),
   * Supabase на той ссылке отвечает голым JSON вида
   * {"error_code":"validation_failed","msg":"Unsupported provider:
   * provider is not enabled"} — и человек видит НЕ сайт, а страницу
   * с сырым текстом ошибки, без единой кнопки вернуться назад.
   *
   * Поэтому здесь мы:
   *  1) просим supabase-js не переходить по ссылке самому
   *     (skipBrowserRedirect: true) и отдать нам сам URL;
   *  2) сами делаем fetch() на этот URL с redirect: "manual" — то есть
   *     запрещаем ЕМУ следовать по редиректу автоматически;
   *  3) если провайдер включён, Supabase ответит настоящим 3xx-редиректом
   *     на accounts.google.com/github.com — при redirect: "manual" это
   *     превращается в response.type === "opaqueredirect" (тело нам
   *     недоступно, и не нужно — сам факт редиректа уже говорит "всё ок").
   *     Только тогда переходим по ссылке по-настоящему;
   *  4) если провайдер выключен, Supabase вернёт обычный читаемый 400 —
   *     мы вытаскиваем из него текст ошибки и показываем ЧЕЛОВЕКУ
   *     понятное сообщение на сайте, вместо того чтобы уводить его на
   *     чужую страницу с JSON.
   *
   * Если сам предварительный fetch() не выполнился (например, какой-то
   * браузер заблокировал его политикой CORS) — это НЕ то же самое, что
   * подтверждённая ошибка провайдера. В этом случае намеренно ведём
   * себя как раньше: просто уходим по ссылке напрямую, а не пугаем
   * человека ошибкой там, где, возможно, всё бы сработало нормально.
   */
  async function signInWith(provider: Provider) {
    const supabase = createClient();
    if (!supabase) return;

    setError(null);
    setLoading(provider);

    const redirectTo = `${window.location.origin}${localePath(locale, "/auth/callback")}`;

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });

    const url = data?.url;
    if (oauthError || !url) {
      console.error(`signInWith(${provider}): supabase-js вернул ошибку или пустой url`, oauthError);
      setError(t.oauthError.replace("{provider}", PROVIDER_LABEL[provider]));
      setLoading(null);
      return;
    }

    try {
      const check = await fetch(url, { method: "GET", redirect: "manual" });
      const isRedirect = check.type === "opaqueredirect" || (check.status >= 300 && check.status < 400);

      if (!isRedirect) {
        let serverMessage = "";
        try {
          const body = await check.json();
          serverMessage = body?.msg ?? body?.error_description ?? body?.message ?? "";
        } catch {
          // Ответ не JSON — не критично, покажем общее сообщение.
        }
        console.error(`OAuth (${provider}) недоступен:`, check.status, serverMessage);
        setError(t.oauthError.replace("{provider}", PROVIDER_LABEL[provider]));
        setLoading(null);
        return;
      }
    } catch (err) {
      console.warn(`OAuth (${provider}): предварительная проверка ссылки не выполнилась, идём напрямую`, err);
    }

    window.location.href = url;
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => signInWith("google")}
        disabled={!!loading}
        className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {loading === "google" ? `${t.continueWith} Google…` : t.continueWithGoogle}
      </button>

      <button
        onClick={() => signInWith("github")}
        disabled={!!loading}
        className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
        {loading === "github" ? `${t.continueWith} GitHub…` : t.continueWithGithub}
      </button>

      {error && (
        <p role="alert" className="pt-1 text-center text-sm text-orange-400">
          {error}
        </p>
      )}
    </div>
  );
}