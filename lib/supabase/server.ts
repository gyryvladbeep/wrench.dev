import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Next 16 made cookies() an async Dynamic API (previously the codemod at
// `npx @next/codemod next-async-request-api` reached for the deprecated
// `UnsafeUnwrappedCookies` sync escape hatch here, but that type was
// removed in Next 16 — this function is now properly async, and every
// caller below awaits it, rather than papering over the migration.
export async function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Stub for build-time — all reads return null, writes are no-ops.
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        exchangeCodeForSession: async () => ({ error: null }),
      },
    } as any;
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        try { cookieStore.set({ name, value, ...options }); } catch {}
      },
      remove(name: string, options: Record<string, unknown>) {
        try { cookieStore.set({ name, value: "", ...options }); } catch {}
      },
    },
  });
}

export async function getServerUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
