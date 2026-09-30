import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isLocale, defaultLocale, localePath } from "@/lib/i18n/config";
import { isNewAccount } from "@/lib/auth/is-new-account";

/**
 * Supabase Auth uses the PKCE flow — after OAuth sign-in or email confirmation
 * it redirects here with a `code` param. We exchange it for a session, then
 * redirect the user to the right page.
 */
export async function GET(request: NextRequest, props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const explicitNext = searchParams.get("next");

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Экскурсия по продукту при регистрации (roadmap item 16,
      // доработка, см. ProductTour.tsx) — для email/пароля SignupForm.tsx
      // точно знает, что аккаунт новый, и сам подставляет ?tour=1. Для
      // OAuth (Google/GitHub) такого сигнала нет: кнопка одна и та же и
      // на /auth/login, и на /auth/signup — Supabase создаёт аккаунт
      // автоматически при первом входе через провайдера, отдельного
      // события "это была регистрация" не существует. isNewAccount()
      // (lib/auth/is-new-account.ts) — надёжный признак "это первый вход"
      // без такого события: created_at и last_sign_in_at внутри
      // нескольких секунд друг от друга.
      const user = data.user;
      const next = explicitNext ?? (isNewAccount(user?.created_at, user?.last_sign_in_at) ? localePath(locale, "/?tour=1") : localePath(locale, "/profile"));
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Something went wrong — redirect to login with an error indicator
  return NextResponse.redirect(
    new URL(`${localePath(locale, "/auth/login")}?error=auth`, request.url)
  );
}
