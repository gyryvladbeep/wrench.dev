import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createServerSupabaseClient() {
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

  const cookieStore = cookies();

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
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
