"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";
import { FREE_MAX_MOCK_ENDPOINTS, FREE_MAX_MOCK_ROUTES, PRO_MAX_MOCK_ENDPOINTS, PRO_MAX_MOCK_ROUTES } from "@/lib/tier-limits";

// Реэкспорт под теми же именами, которыми их уже импортируют
// остальные файлы (components/mock-api/*, tests/*) — сами значения
// теперь живут в lib/tier-limits.ts, единственном источнике правды,
// общем с серверным app/api/v1/mock-endpoints/route.ts (см. комментарий
// в том файле).
export { FREE_MAX_MOCK_ENDPOINTS, FREE_MAX_MOCK_ROUTES, PRO_MAX_MOCK_ENDPOINTS, PRO_MAX_MOCK_ROUTES };

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

export interface RouteInput {
  method: string;
  path: string;
  status_code: number;
  response_body: string;
  delay_ms: number;
}

export type ImportCollectionError = "not-signed-in" | "endpoint-limit" | "save-failed";

export interface ImportCollectionResult {
  endpointId: string | null;
  saved: number;
  skipped: number;
  error: ImportCollectionError | null;
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

  // Импорт коллекции Postman/Insomnia (см. lib/mock-api/parse-collection.ts
  // и components/mock-api/ImportCollectionModal.tsx) — сохраняет разобранные
  // маршруты одним batched upsert'ом вместо цикла из saveRoute() по одному.
  //
  // Почему это отдельная функция, а не composition из createEndpoint() +
  // saveRoute() в цикле со стороны компонента: если модалка создаёт НОВЫЙ
  // эндпоинт и тут же импортирует в него маршруты, то closure этого хука
  // (endpoints/maxRoutesPerEndpoint), захваченный компонентом на момент
  // рендера, ещё не успевает обновиться между двумя await — React не
  // гарантирует, что setEndpoints() из createEndpoint() уже долетит до
  // состояния к моменту, когда компонент вызовет следующую функцию. Здесь
  // же оба шага (создать эндпоинт при необходимости + сохранить маршруты)
  // выполняются в одном вызове от начала до конца на актуальных данных, и
  // React-state обновляется один раз в самом конце.
  const importCollection = useCallback(async (opts: {
    endpointId: string | null; // null => создать новый эндпоинт
    newEndpointName?: string;
    routes: RouteInput[];
  }): Promise<ImportCollectionResult> => {
    if (!user) return { endpointId: null, saved: 0, skipped: opts.routes.length, error: "not-signed-in" };

    const supabase = createClient();
    let targetId = opts.endpointId;
    let baseEndpoint: MockEndpoint | null = opts.endpointId
      ? endpoints.find((e) => e.id === opts.endpointId) ?? null
      : null;
    let isNewEndpoint = false;

    if (!targetId) {
      if (endpoints.length >= maxEndpoints) {
        return { endpointId: null, saved: 0, skipped: opts.routes.length, error: "endpoint-limit" };
      }
      const slug = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      try {
        const { data, error } = await supabase
          .from("mock_endpoints")
          .insert({ user_id: user.id, slug, name: opts.newEndpointName?.trim() ?? "" })
          .select("id, slug, name, created_at")
          .single();
        if (error || !data) throw error;
        baseEndpoint = { ...(data as Omit<MockEndpoint, "mock_routes">), mock_routes: [] };
        targetId = baseEndpoint.id;
        isNewEndpoint = true;
      } catch {
        return { endpointId: null, saved: 0, skipped: opts.routes.length, error: "save-failed" };
      }
    }

    if (!targetId || !baseEndpoint) {
      return { endpointId: null, saved: 0, skipped: opts.routes.length, error: "save-failed" };
    }

    // Дедуп внутри самого импортируемого набора (последний с тем же
    // method+path побеждает — то же правило, что у уникального индекса
    // (endpoint_id, method, path) в supabase/mock-api-migration.sql), затем
    // разделяем на "обновит существующий маршрут" (не тратит лимит) и
    // "займёт новый слот" (ограничено оставшейся вместимостью).
    const deduped = new Map<string, RouteInput>();
    for (const r of opts.routes) deduped.set(`${r.method} ${r.path}`, r);
    const list = Array.from(deduped.values());

    const existingKeys = new Set(baseEndpoint.mock_routes.map((r) => `${r.method} ${r.path}`));
    const updates = list.filter((r) => existingKeys.has(`${r.method} ${r.path}`));
    const fresh = list.filter((r) => !existingKeys.has(`${r.method} ${r.path}`));
    const capacity = Math.max(0, maxRoutesPerEndpoint - baseEndpoint.mock_routes.length);
    const toInsert = fresh.slice(0, capacity);
    const overLimit = fresh.length - toInsert.length;
    const toSave = [...updates, ...toInsert];

    if (toSave.length === 0) {
      return { endpointId: targetId, saved: 0, skipped: overLimit, error: null };
    }

    try {
      const rows = toSave.map((r) => ({ endpoint_id: targetId, ...r }));
      const { data, error } = await supabase
        .from("mock_routes")
        .upsert(rows, { onConflict: "endpoint_id,method,path" })
        .select("*");
      if (error) throw error;
      const saved = (data as MockRoute[] | null) ?? [];
      const savedKeys = new Set(saved.map((r) => `${r.method} ${r.path}`));
      const finalEndpoint: MockEndpoint = {
        ...baseEndpoint,
        mock_routes: [...baseEndpoint.mock_routes.filter((r) => !savedKeys.has(`${r.method} ${r.path}`)), ...saved],
      };
      setEndpoints((prev) => isNewEndpoint
        ? [...prev, finalEndpoint]
        : prev.map((e) => (e.id === targetId ? finalEndpoint : e)));
      return { endpointId: targetId, saved: saved.length, skipped: overLimit + (toSave.length - saved.length), error: null };
    } catch {
      // Эндпоинт мог успеть создаться (если это была ветка "новый") даже
      // если сохранение маршрутов упало — отражаем это в состоянии, чтобы
      // пользователь не создал дубликат при повторной попытке.
      if (isNewEndpoint) setEndpoints((prev) => [...prev, baseEndpoint!]);
      return { endpointId: targetId, saved: 0, skipped: opts.routes.length, error: "save-failed" };
    }
  }, [user, endpoints, maxEndpoints, maxRoutesPerEndpoint]);

  return {
    endpoints, loading, maxEndpoints, maxRoutesPerEndpoint,
    createEndpoint, deleteEndpoint, saveRoute, deleteRoute, importCollection,
  };
}
