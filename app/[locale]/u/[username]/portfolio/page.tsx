import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PublicPortfolioView } from "@/components/portfolio/PublicPortfolioView";

// Веб-версия портфолио (roadmap: "публичная веб-ссылка на портфолио, не
// только PNG/PDF") — тот же принцип, что и у /u/[username]/page.tsx: не
// прячем от индексации (noindex у нас только для /w/[id] — произвольного
// пользовательского контента), тайтл собирается из самого портфолио
// (учитывая ручной редактор — portfolio_title/portfolio_tagline), со
// стандартным фолбэком, если username не существует или профиль скрыт.
export async function generateMetadata(
  props: {
    params: Promise<{ locale: string; username: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu = locale === "ru";
  const fallback = isRu ? "Портфолио — Wrench-Branch" : "Portfolio — Wrench-Branch";

  // Тот же try/catch-фолбэк, что и в /u/[username]/page.tsx — отсутствие
  // Supabase-кредов при сборке или любая другая сетевая ошибка не должны
  // ронять страницу целиком ради одного лишь заголовка вкладки.
  try {
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, username, portfolio_title, portfolio_tagline, tagline")
      .eq("username", params.username)
      .single();

    if (!profile) return { title: fallback };

    const name = profile.portfolio_title || profile.display_name || `@${profile.username}`;
    const description = profile.portfolio_tagline || profile.tagline
      || (isRu ? `Портфолио ${name} на Wrench-Branch` : `${name}'s portfolio on Wrench-Branch`);
    return {
      title: `${name} — Wrench-Branch`,
      description,
    };
  } catch {
    return { title: fallback };
  }
}

export default async function PublicPortfolioPage(props: { params: Promise<{ locale: string; username: string }> }) {
  const params = await props.params;
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <PublicPortfolioView locale={locale} username={params.username} />;
}
