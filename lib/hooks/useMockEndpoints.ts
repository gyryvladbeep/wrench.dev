"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";

export interface MockRoute {
  id: string;
  method: string;
  path: string;
  status_code: number;
  response_body: string;
  delay_ms: number;
  hit_count: number;
  last_called_at: string | null;
}

export interface MockEndpoint {
  id: string;
  slug: string;
  name: string;
  created_at: string;
  mock_routes: MockRoute[];
}

// ═══════════════════════════════════════════════════════
// Лимиты free/Pro
// ═══════════════════════════════════════════════════════
// Тот же принцип, что у Workbench (lib/hooks/useWorkbenches.ts):
// бесплатный аккаунт получает достаточно, чтобы попробовать фичу на
// реальном сценарии (один эндпоинт с несколькими маршрутами обычно
// хватает на один тестовый сценарий), а Pro — уже под то, кто держит
// несколько независимых наборов моков одновременно (разные проекты,
// разные версии API).
export const FREE_MAX_MOCK_ENDPOINTS = 1;
export const FREE_MAX_MOCK_ROUTES = 3;
export const PRO_MAX_MOCK_ENDPOINTS = 5;
export const PRO_MAX_MOCK_ROUTES = 15;

export interface RouteInput {
  method: string;
  path: string;
  status_code: number;
  response_body: string;
  delay_ms: number;
}

// supabase.rpc() / .upsert() / .delete() не существуют у заглушки
// createClient() (см. её же комментарий в lib/supabase/client.ts) —
// заглушка отдаётся, когда переменные окружения Supabase не заданы, и
// умеет только auth/select/insert/update. Каждый вызов этих трёх
// методов ниже обёрнут в try/catch по той же причине, что уже была
// зафиксирована для калькулятора зарплат (components/salary/SalaryClient.tsx):
// без этого страница целиком падала бы в среде без .env.local.
export function useMockEndpoints(isPro: boolean) {
  const { user } = useAuth();
  const [endpoints, setEndpoints] = useState<MockEndpoint[]>([]);
  const [loading, setLoading] = useState(true);

  const maxEndpoints    = isPro ? PRO_MAX_MOCK_ENDPOINTS : FREE_MAX_MOCK_ENDPOINTS;
  const maxRoutesPerEndpoint = isPro ? PRO_MAX_MOCK_ROUTES : FREE_MAX_MOCK_ROUTES;

  const load = useCallback(async () => {
    if (!user) { setEndpoints([]); setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("mock_endpoints")
        .select("id, slug, name, created_at, mock_routes(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setEndpoints((data as unknown as MockEndpoint[] | null) ?? []);
    } catch {
      setEndpoints([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const createEndpoint = useCallback(async (name: string) => {
    if (!user || endpoints.length >= maxEndpoints) return null;
    const slug = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("mock_endpoints")
        .insert({ user_id: user.id, slug, name })
        .select("id, slug, name, created_at")
        .single();
      if (error || !data) throw error;
      const created: MockEndpoint = { ...(data as Omit<MockEndpoint, "mock_routes">), mock_routes: [] };
      setEndpoints((prev) => [...prev, created]);
      return created;
    } catch {
      return null;
    }
  }, [user, endpoints, maxEndpoints]);

  const deleteEndpoint = useCallback(async (id: string) => {
    setEndpoints((prev) => prev.filter((e) => e.id !== id));
    const supabase = createClient();
    try {
      await supabase.from("mock_endpoints").delete().eq("id", id);
    } catch {
      // Supabase not configured — nothing to delete server-side.
    }
  }, []);

  // Создаёт route, если для этого method+path его ещё не было, иначе
  // обновляет существующий (upsert по уникальному индексу
  // (endpoint_id, method, path) из supabase/mock-api-migration.sql) —
  // так редактирование существующего маршрута не требует отдельной
  // формы "изменить": пользователь просто пересохраняет те же
  // метод+путь с новым телом/статусом/задержкой.
  const saveRoute = useCallback(async (endpointId: string, input: RouteInput) => {
    const endpoint = endpoints.find((e) => e.id === endpointId);
    if (!endpoint) return false;
    const existing = endpoint.mock_routes.find(
      (r) => r.method === input.method && r.path === input.path
    );
    if (!existing && endpoint.mock_routes.length >= maxRoutesPerEndpoint) return false;

    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("mock_routes")
        .upsert(
          { endpoint_id: endpointId, ...input },
          { onConflict: "endpoint_id,method,path" }
        )
        .select("*")
        .single();
      if (error || !data) throw error;
      const saved = data as MockRoute;
      setEndpoints((prev) => prev.map((e) => {
        if (e.id !== endpointId) return e;
        const withoutOld = e.mock_routes.filter((r) => r.id !== saved.id);
        return { ...e, mock_routes: [...withoutOld, saved] };
      }));
      return true;
    } catch {
      return false;
    }
  }, [endpoints, maxRoutesPerEndpoint]);

  const deleteRoute = useCallback(async (endpointId: string, routeId: string) => {
    setEndpoints((prev) => prev.map((e) =>
      e.id === endpointId ? { ...e, mock_routes: e.mock_routes.filter((r) => r.id !== routeId) } : e
    ));
    const supabase = createClient();
    try {
      await supabase.from("mock_routes").delete().eq("id", routeId);
    } catch {
      // Supabase not configured — nothing to delete server-side.
    }
  }, []);

  return {
    endpoints, loading, maxEndpoints, maxRoutesPerEndpoint,
    createEndpoint, deleteEndpoint, saveRoute, deleteRoute,
  };
}
