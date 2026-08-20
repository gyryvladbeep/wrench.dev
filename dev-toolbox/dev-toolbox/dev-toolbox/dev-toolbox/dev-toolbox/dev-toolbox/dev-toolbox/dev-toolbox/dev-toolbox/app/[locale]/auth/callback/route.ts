import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isLocale, defaultLocale, localePath } from "@/lib/i18n/config";

/**
 * Supabase Auth uses the PKCE flow — after OAuth sign-in or email confirmation
 * it redirects here with a `code` param. We exchange it for a session, then
 * redirect the user to the right page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { locale: string } }
) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? localePath(locale, "/profile");

  if (code) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Something went wrong — redirect to login with an error indicator
  return NextResponse.redirect(
    new URL(`${localePath(locale, "/auth/login")}?error=auth`, request.url)
  );
}
