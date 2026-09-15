"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";

export interface WebhookRequestRow {
  id: string;
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: string;
  content_type: string | null;
  source_ip: string | null;
  received_at: string;
}

export interface WebhookBin {
  id: string;
  slug: string;
  name: string;
  created_at: string;
  webhook_requests: WebhookRequestRow[];
}

// ═══════════════════════════════════════════════════════
// Лимиты free/Pro
// ═══════════════════════════════════════════════════════
// Тот же принцип, что у Mock API (lib/hooks/useMockEndpoints.ts) —
// один бесплатный бин достаточно, чтобы попробовать фичу на реальном
// вебхуке (например настроить его в тестовом Stripe-проекте), Pro —
// под тех, кто держит несколько независимых интеграций одновременно.
export const FREE_MAX_WEBHOOK_BINS = 1;
export const PRO_MAX_WEBHOOK_BINS = 5;

// Системный потолок хранимых запросов на один бин — реально применяется
// внутри ingest_webhook_request() (см. supabase/webhook-inspector-migration.sql),
// не здесь; число продублировано в клиенте только для текста в UI
// ("хранятся последние N запросов"), а не для логики отсечения.
export const WEBHOOK_REQUEST_RETENTION = 50;

// supabase.rpc() / .select() с embedded-таблицами и т.п. отсутствуют у
// заглушки createClient() (см. её же комментарий в lib/supabase/client.ts) —
// заглушка отдаётся, когда переменные окружения Supabase не заданы.
// Каждый метод ниже обёрнут в try/catch по той же причине, что уже
// зафиксирована для Mock API/калькулятора зарплат: без этого страница
// целиком падала бы в среде без .env.local.
export function useWebhookBins(isPro: boolean) {
  const { user } = useAuth();
  const [bins, setBins] = useState<WebhookBin[]>([]);
  const [loading, setLoading] = useState(true);

  const maxBins = isPro ? PRO_MAX_WEBHOOK_BINS : FREE_MAX_WEBHOOK_BINS;

  const load = useCallback(async () => {
    if (!user) { setBins([]); setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("webhook_bins")
        .select("id, slug, name, created_at, webhook_requests(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = ((data as unknown as WebhookBin[] | null) ?? []).map((bin) => ({
        ...bin,
        // Embedded-выборка не гарантирует порядок вложенной таблицы —
        // сортируем на клиенте, самые новые запросы сверху.
        webhook_requests: [...bin.webhook_requests].sort(
          (a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
        ),
      }));
      setBins(rows);
    } catch {
      setBins([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const createBin = useCallback(async (name: string) => {
    if (!user || bins.length >= maxBins) return null;
    const slug = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("webhook_bins")
        .insert({ user_id: user.id, slug, name })
        .select("id, slug, name, created_at")
        .single();
      if (error || !data) throw error;
      const created: WebhookBin = { ...(data as Omit<WebhookBin, "webhook_requests">), webhook_requests: [] };
      setBins((prev) => [...prev, created]);
      return created;
    } catch {
      return null;
    }
  }, [user, bins, maxBins]);

  const deleteBin = useCallback(async (id: string) => {
    setBins((prev) => prev.filter((b) => b.id !== id));
    const supabase = createClient();
    try {
      await supabase.from("webhook_bins").delete().eq("id", id);
    } catch {
      // Supabase not configured — nothing to delete server-side.
    }
  }, []);

  const clearRequests = useCallback(async (binId: string) => {
    setBins((prev) => prev.map((b) => (b.id === binId ? { ...b, webhook_requests: [] } : b)));
    const supabase = createClient();
    try {
      await supabase.from("webhook_requests").delete().eq("bin_id", binId);
    } catch {
      // Supabase not configured — nothing to delete server-side.
    }
  }, []);

  const deleteRequest = useCallback(async (binId: string, requestId: string) => {
    setBins((prev) => prev.map((b) =>
      b.id === binId ? { ...b, webhook_requests: b.webhook_requests.filter((r) => r.id !== requestId) } : b
    ));
    const supabase = createClient();
    try {
      await supabase.from("webhook_requests").delete().eq("id", requestId);
    } catch {
      // Supabase not configured — nothing to delete server-side.
    }
  }, []);

  // Лёгкий поллинг вместо realtime-подписки: запросы приходят снаружи
  // (из чужого сервиса/curl), пользователь хочет видеть их без ручного
  // обновления страницы, но полноценный Supabase Realtime — это
  // отдельный WS-канал и лишняя инфраструктурная сложность ради фичи
  // раннего этапа без реальных пользователей. Вызывающий код (см.
  // WebhookInspectorClient.tsx) сам решает, когда дёргать это по
  // таймеру — обычно только пока конкретный бин раскрыт на экране.
  const refreshBin = useCallback(async (binId: string) => {
    if (!user) return;
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("webhook_requests")
        .select("*")
        .eq("bin_id", binId)
        .order("received_at", { ascending: false });
      if (error) throw error;
      const rows = (data as WebhookRequestRow[] | null) ?? [];
      setBins((prev) => prev.map((b) => (b.id === binId ? { ...b, webhook_requests: rows } : b)));
    } catch {
      // Тихо игнорируем — следующий тик поллинга попробует снова.
    }
  }, [user]);

  return {
    bins, loading, maxBins,
    createBin, deleteBin, clearRequests, deleteRequest, refreshBin,
  };
}
