"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";
import { generateApiToken, hashApiTokenBrowser, apiTokenPrefix } from "@/lib/api-token-crypto";

// Тот же принцип, что у Workbench/Mock API/Webhook Inspector: лимит —
// на стороне фронтенда, не отдельный DB constraint. Один флэт-лимит на
// всех (не free/Pro) — токены не тарифная фича, а гигиена безопасности
// (один на CI, один на локальную разработку, ...), незачем поощрять
// платный тариф числом токенов.
export const MAX_API_TOKENS = 10;

export interface ApiToken {
  id: string;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export type CreateTokenError = "not-signed-in" | "token-limit" | "empty-name" | "save-failed";
export type CreateTokenResult = { token: string; row: ApiToken } | CreateTokenError;

// supabase.from(...) отсутствует у заглушки createClient() в среде без
// .env.local (см. её же комментарий в lib/supabase/client.ts) — каждый
// вызов ниже обёрнут в try/catch по той же причине, что уже
// зафиксирована в useMockEndpoints.ts/useWebhookBins.ts.
export function useApiTokens() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setTokens([]); setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("api_tokens")
        .select("id, name, token_prefix, created_at, last_used_at, revoked_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTokens((data as ApiToken[] | null) ?? []);
    } catch {
      setTokens([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const activeCount = tokens.filter((t) => !t.revoked_at).length;

  // Токен в открытом виде существует РОВНО в возвращаемом значении
  // этого вызова — нигде не сохраняется (ни в состоянии хука, ни тем
  // более в базе, где лежит только хэш, см. supabase/api-tokens-migration.sql)
  // и не может быть показан снова после того, как вызывающий компонент
  // его отрисовал, поэтому ApiTokensPanel.tsx обязан показать его сразу.
  const createToken = useCallback(async (name: string): Promise<CreateTokenResult> => {
    if (!user) return "not-signed-in";
    if (!name.trim()) return "empty-name";
    if (activeCount >= MAX_API_TOKENS) return "token-limit";

    const token = generateApiToken();
    const tokenHash = await hashApiTokenBrowser(token);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("api_tokens")
        .insert({
          user_id: user.id,
          name: name.trim(),
          token_hash: tokenHash,
          token_prefix: apiTokenPrefix(token),
        })
        .select("id, name, token_prefix, created_at, last_used_at, revoked_at")
        .single();
      if (error || !data) throw error;
      const row = data as ApiToken;
      setTokens((prev) => [row, ...prev]);
      return { token, row };
    } catch {
      return "save-failed";
    }
  }, [user, activeCount]);

  const revokeToken = useCallback(async (id: string) => {
    const revokedAt = new Date().toISOString();
    setTokens((prev) => prev.map((t) => (t.id === id ? { ...t, revoked_at: revokedAt } : t)));
    const supabase = createClient();
    try {
      await supabase.from("api_tokens").update({ revoked_at: revokedAt }).eq("id", id);
    } catch {
      // Supabase not configured — nothing to persist server-side.
    }
  }, []);

  return { tokens, loading, activeCount, maxTokens: MAX_API_TOKENS, createToken, revokeToken };
}
