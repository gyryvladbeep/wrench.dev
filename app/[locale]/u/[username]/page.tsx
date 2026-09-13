import { Metadata } from "next";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PublicProfileView } from "@/components/profile/PublicProfileView";

// В отличие от /w/[id] (публичная ссылка на рабочий стол — произвольный
// пользовательский контент, noindex), страницу профиля осознанно НЕ
// закрываем от индексации: весь смысл фичи — чтобы её можно было найти
// (например, рекрутеру) и она добавляла сайту органических посадочных
// страниц, а не только пряталась за прямой ссылкой. Тайтл собирается из
// самого профиля, если он публичен, — со стандартным фолбэком, если
// username не существует или профиль скрыт (та же причина, что и в
// PublicProfileView.tsx: не выдавать самим текстом ошибки, существует
// ли username в базе).
export async function generateMetadata({
  params,
}: {
  params: { locale: string; username: string };
}): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const isRu = locale === "ru";
  const fallback = isRu ? "Профиль — Wrench-Branch" : "Profile — Wrench-Branch";

  // createServerSupabaseClient() отдаёт заглушку без .from(), если
  // переменные окружения Supabase не заданы (см. её же комментарий в
  // lib/supabase/server.ts — так уже задумано для сборки без секретов).
  // generateMetadata не должен ронять всю страницу 500-й из-за этого —
  // ни отсутствующие креды, ни любая другая ошибка сети/базы не должны
  // быть фатальными для одного лишь заголовка вкладки: заголовок — это
  // приятное дополнение, а не то, ради чего вообще открывают страницу.
  try {
    const supabase = createServerSupabaseClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, username, bio")
      .eq("username", params.username)
      .single();

    if (!profile) return { title: fallback };

    const name = profile.display_name || `@${profile.username}`;
    return {
      title: `${name} — Wrench-Branch`,
      description: profile.bio || (isRu ? `Профиль ${name} на Wrench-Branch` : `${name}'s profile on Wrench-Branch`),
    };
  } catch {
    return { title: fallback };
  }
}

export default function PublicProfilePage({ params }: { params: { locale: string; username: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <PublicProfileView locale={locale} username={params.username} />;
}
