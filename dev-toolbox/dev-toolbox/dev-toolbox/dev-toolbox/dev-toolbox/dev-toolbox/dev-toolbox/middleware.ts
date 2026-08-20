import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale, isLocale } from "./lib/i18n/config";

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const COOKIE_NAME = "NEXT_LOCALE";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Supabase session refresh (only when configured)
  let response = NextResponse.next();
  if (SUPABASE_CONFIGURED) {
    const { createMiddlewareClient } = await import("./lib/supabase/middleware");
    const { supabase, response: r } = createMiddlewareClient(request);
    await supabase.auth.getUser();
    response = r;
  }

  // 2. Locale routing
  //
  // Priority order:
  //   a) Explicit /ru/ prefix in URL  → Russian (always wins, set cookie)
  //   b) NEXT_LOCALE cookie           → respect the user's explicit choice
  //   c) Accept-Language header       → only on first visit (no cookie)
  //   d) Default                      → English

  const hasRuPrefix =
    pathname.startsWith("/ru/") || pathname === "/ru";

  // a) Explicit Russian URL — serve as-is and remember the preference
  if (hasRuPrefix) {
    response.cookies.set(COOKIE_NAME, "ru", {
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  // b+c) No locale prefix — decide what to serve
  const pathnameHasLocale = locales.some(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  );

  if (!pathnameHasLocale) {
    const cookieLocale = request.cookies.get(COOKIE_NAME)?.value;

    if (cookieLocale === "ru") {
      // User previously chose Russian AND this request doesn't have an
      // explicit EN signal — redirect to /ru/.
      // The LocaleSwitcher sets cookie=en BEFORE navigating, so if the
      // user clicked EN, the cookie will already be "en" by this point.
      return NextResponse.redirect(
        new URL(`/ru${pathname === "/" ? "" : pathname}`, request.url)
      );
    }

    if (!cookieLocale) {
      // First visit — detect from Accept-Language
      const acceptLang = request.headers.get("accept-language") ?? "";
      const preferred = acceptLang.split(",")[0].split("-")[0].toLowerCase();

      if (isLocale(preferred) && preferred !== defaultLocale) {
        // First-time Russian browser visitor → redirect to /ru/ and set cookie
        const redirect = NextResponse.redirect(
          new URL(`/${preferred}${pathname === "/" ? "" : pathname}`, request.url)
        );
        redirect.cookies.set(COOKIE_NAME, preferred, {
          maxAge: COOKIE_MAX_AGE,
          path: "/",
          sameSite: "lax",
        });
        return redirect;
      }
    }

    // cookie=en, or no cookie + English browser → serve English
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname}`;
    const rewrite = NextResponse.rewrite(url);

    // Persist EN preference so future visits stay English
    rewrite.cookies.set(COOKIE_NAME, "en", {
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
    return rewrite;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
