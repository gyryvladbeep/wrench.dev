import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale, isLocale } from "./lib/i18n/config";

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const COOKIE_NAME = "NEXT_LOCALE";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// Copy all Supabase auth cookies from one response to another
function copyAuthCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    if (
      cookie.name.startsWith("sb-") ||
      cookie.name.includes("supabase") ||
      cookie.name.includes("auth-token")
    ) {
      to.cookies.set(cookie);
    }
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Supabase session refresh
  let supabaseResponse = NextResponse.next();
  if (SUPABASE_CONFIGURED) {
    const { createMiddlewareClient } = await import("./lib/supabase/middleware");
    const { supabase, response: r } = createMiddlewareClient(request);
    await supabase.auth.getUser();
    supabaseResponse = r;
  }

  // 2. Locale routing
  const hasRuPrefix = pathname.startsWith("/ru/") || pathname === "/ru";

  if (hasRuPrefix) {
    supabaseResponse.cookies.set(COOKIE_NAME, "ru", {
      maxAge: COOKIE_MAX_AGE, path: "/", sameSite: "lax",
    });
    return supabaseResponse;
  }

  const pathnameHasLocale = locales.some(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  );

  if (!pathnameHasLocale) {
    const cookieLocale = request.cookies.get(COOKIE_NAME)?.value;

    if (cookieLocale === "ru") {
      const redirect = NextResponse.redirect(
        new URL(`/ru${pathname === "/" ? "" : pathname}`, request.url)
      );
      copyAuthCookies(supabaseResponse, redirect);
      redirect.cookies.set(COOKIE_NAME, "ru", {
        maxAge: COOKIE_MAX_AGE, path: "/", sameSite: "lax",
      });
      return redirect;
    }

    if (!cookieLocale) {
      const acceptLang = request.headers.get("accept-language") ?? "";
      const preferred = acceptLang.split(",")[0].split("-")[0].toLowerCase();

      if (isLocale(preferred) && preferred !== defaultLocale) {
        const redirect = NextResponse.redirect(
          new URL(`/${preferred}${pathname === "/" ? "" : pathname}`, request.url)
        );
        copyAuthCookies(supabaseResponse, redirect);
        redirect.cookies.set(COOKIE_NAME, preferred, {
          maxAge: COOKIE_MAX_AGE, path: "/", sameSite: "lax",
        });
        return redirect;
      }
    }

    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname}`;
    const rewrite = NextResponse.rewrite(url);
    copyAuthCookies(supabaseResponse, rewrite);
    rewrite.cookies.set(COOKIE_NAME, "en", {
      maxAge: COOKIE_MAX_AGE, path: "/", sameSite: "lax",
    });
    return rewrite;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};