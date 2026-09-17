// Общий запрос к списку публичных профилей — используется и в
// components/PeopleDirectory.tsx (страница "Люди" со своим поиском и
// фильтром по роли), и в компактном поиске людей внутри
// components/SearchModal.tsx (⌘K). Вынесено в одно место, а не
// продублировано в обоих компонентах, чтобы форма фильтра (.or/.eq) и
// экранирование спецсимволов ilike менялись один раз, а не в двух
// местах по отдельности.
import type { createClient } from "@/lib/supabase/client";

export interface DirectoryProfile {
  id:            string;
  username:      string;
  display_name:  string;
  avatar_color:  string;
  avatar_emblem: string | null;
  role_tag:      string;
  tagline:       string | null;
  // Оба поля — supabase/profile-stack-location-migration.sql. tech_stack
  // никогда не null (DEFAULT '{}' в БД), location может быть не указан.
  tech_stack:    string[];
  location:      string | null;
}

export const PEOPLE_PAGE_SIZE = 24;

// В .ilike()-паттерне % и _ — спецсимволы (любая последовательность /
// один любой символ), а запятая — разделитель условий внутри .or().
// Без экранирования запрос вроде "50%" или "a,b" либо матчит не то, что
// ввёл человек, либо вовсе ломает сам синтаксис фильтра .or().
function escapeForFilter(raw: string): string {
  return raw.replace(/[%_,]/g, (c) => `\\${c}`);
}

interface SearchProfilesOptions {
  query?:  string;
  // null/undefined/"all" — без фильтра по роли.
  role?:   string | null;
  // Id одного тега из lib/profile-stack.ts — null/undefined/"all" без
  // фильтра. Один тег за раз (не набор), тот же UX, что и у role: чип,
  // а не мультивыбор с чекбоксами, для директории с сотнями профилей.
  stack?:    string | null;
  // Свободный текст, матчится ilike-подстрокой — та же логика, что и у
  // query (см. escapeForFilter ниже), просто по отдельной колонке.
  location?: string;
  limit?:  number;
  offset?: number;
}

export interface SearchProfilesResult {
  data:  DirectoryProfile[];
  // null — .select() без { count: "exact" } (не должно происходить
  // здесь, но на всякий случай не считаем 0 профилей ошибкой типов).
  count: number | null;
  error: { message: string } | null;
}

export async function searchProfiles(
  supabase: ReturnType<typeof createClient>,
  { query = "", role, stack, location = "", limit = PEOPLE_PAGE_SIZE, offset = 0 }: SearchProfilesOptions = {}
): Promise<SearchProfilesResult> {
  let q = supabase
    .from("profiles")
    .select("id, username, display_name, avatar_color, avatar_emblem, role_tag, tagline, tech_stack, location", { count: "exact" })
    // RLS-политика profiles_select_public (is_public = true, см.
    // supabase/profile-public-migration.sql) уже сама решает, какие
    // строки вообще видны анониму/другому пользователю — не дублируем
    // это условие в JS, тот же принцип, что и в PublicProfileView.tsx.
    // Тут фильтруем только то, что НЕ про видимость: профиль без
    // username никуда не ведёт (публичная страница живёт на /u/[username]),
    // так что в списке результатов от него всё равно нет пользы.
    .not("username", "is", null)
    .order("created_at", { ascending: false });

  const trimmed = query.trim();
  if (trimmed) {
    const esc = escapeForFilter(trimmed);
    q = q.or(`username.ilike.%${esc}%,display_name.ilike.%${esc}%`);
  }
  if (role && role !== "all") {
    q = q.eq("role_tag", role);
  }
  // .contains() → Postgres @> на tech_stack (индексирован GIN'ом, см.
  // supabase/profile-stack-location-migration.sql) — "профиль содержит
  // этот тег", не точное равенство массива.
  if (stack && stack !== "all") {
    q = q.contains("tech_stack", [stack]);
  }
  const trimmedLocation = location.trim();
  if (trimmedLocation) {
    q = q.ilike("location", `%${escapeForFilter(trimmedLocation)}%`);
  }

  const { data, count, error } = await q.range(offset, offset + limit - 1);
  return { data: (data as DirectoryProfile[] | null) ?? [], count: count ?? null, error: error as { message: string } | null };
}
