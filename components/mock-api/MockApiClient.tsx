"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useMockEndpoints, MockEndpoint, RouteInput } from "@/lib/hooks/useMockEndpoints";
import { localePath, Locale } from "@/lib/i18n/config";
import { CopyButton } from "@/components/CopyButton";
import { LayersIcon, CloseIcon } from "@/components/icons/GameIcons";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
const FALLBACK_ORIGIN = "https://wrench-dev-lr29.vercel.app";

function normalizePath(raw: string): string {
  const withSlash = raw.trim().startsWith("/") ? raw.trim() : `/${raw.trim()}`;
  if (withSlash === "/") return "/";
  return withSlash.replace(/\/+$/, "") || "/";
}

interface RouteFormState {
  method: string;
  path: string;
  status_code: string;
  response_body: string;
  delay_ms: string;
}

const DEFAULT_ROUTE_FORM: RouteFormState = {
  method: "GET",
  path: "/",
  status_code: "200",
  response_body: '{\n  "message": "hello"\n}',
  delay_ms: "0",
};

export function MockApiClient({ locale }: { locale: Locale }) {
  const isRu = locale === "ru";
  const { user, loading: authLoading } = useAuth();
  const { isPro } = useSubscription();
  const {
    endpoints, loading, maxEndpoints, maxRoutesPerEndpoint,
    createEndpoint, deleteEndpoint, saveRoute, deleteRoute,
  } = useMockEndpoints(isPro);

  const [origin, setOrigin] = useState(FALLBACK_ORIGIN);
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    setCreating(true);
    await createEndpoint(newName.trim());
    setNewName("");
    setCreating(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-canvas text-accent">
          <LayersIcon size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isRu ? "Mock API / Test-песочница" : "Mock API / Test Sandbox"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary leading-relaxed">
            {isRu
              ? "Создай публичный URL, который всегда отвечает тем, что ты задал — фиксированным статусом, телом и задержкой. Используй его в своих тестах и CI вместо реального стороннего API: проверяй обработку ошибок (500, 429, таймаут) без необходимости эти ошибки где-то реально ловить, или симулируй медленный ответ, чтобы проверить состояние загрузки в интерфейсе."
              : "Get a public URL that always answers with exactly what you configured — a fixed status, body, and delay. Point your tests and CI at it instead of a real third-party API: exercise error handling (500, 429, a timeout) without needing those errors to actually happen, or simulate a slow response to test a loading state."}
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-base font-semibold text-text-primary">
          {isRu ? "Как это выглядит" : "What it looks like"}
        </h2>
        <pre className="code-surface overflow-x-auto rounded-lg p-3 text-xs leading-relaxed text-text-secondary">
{`$ curl -i ${FALLBACK_ORIGIN}/api/mock/a1b2c3d4e5f6/orders/42

HTTP/1.1 200 OK
Content-Type: application/json

{ "id": 42, "status": "shipped" }`}
        </pre>
        <p className="mt-3 text-xs text-text-muted">
          {isRu
            ? "Метод, путь, статус, тело ответа и задержку задаёшь сам ниже для каждого маршрута — сервер просто отдаёт это по вызову, ничего не выдумывая."
            : "You choose the method, path, status, response body and delay per route below — the server just plays it back on every call, nothing inferred."}
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-base font-semibold text-text-primary">
          {isRu ? "Твои эндпоинты" : "Your endpoints"}
        </h2>

        {authLoading ? null : !user ? (
          <div className="rounded-lg border border-border bg-canvas p-4 text-center">
            <p className="text-sm text-text-secondary">
              {isRu ? "Нужно войти в аккаунт, чтобы создавать mock-эндпоинты." : "Sign in to create mock endpoints."}
            </p>
            <Link href={localePath(locale, "/auth/login")}
              className="mt-3 inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90">
              {isRu ? "Войти" : "Sign in"}
            </Link>
          </div>
        ) : loading ? (
          <p className="text-sm text-text-muted">{isRu ? "Загрузка..." : "Loading..."}</p>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <input value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder={isRu ? "Название (необязательно)" : "Name (optional)"}
                className="code-surface min-w-0 flex-1 rounded-lg px-3 py-2 text-sm text-text-primary outline-none" />
              <button onClick={handleCreate} disabled={creating || endpoints.length >= maxEndpoints}
                className="shrink-0 rounded bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                {isRu ? "+ Новый эндпоинт" : "+ New endpoint"}
              </button>
            </div>
            <p className="text-xs text-text-muted">
              {endpoints.length} / {maxEndpoints} {isRu ? "эндпоинтов использовано" : "endpoints used"}
              {!isPro && endpoints.length >= maxEndpoints && (
                <> — <Link href={localePath(locale, "/pro")} className="text-accent hover:underline">
                  {isRu ? "нужно больше? посмотри Pro" : "need more? check out Pro"}
                </Link></>
              )}
            </p>

            {endpoints.length === 0 && (
              <p className="text-sm text-text-muted">
                {isRu ? "Пока нет ни одного эндпоинта — создай первый выше." : "No endpoints yet — create your first one above."}
              </p>
            )}

            {endpoints.map((endpoint) => (
              <EndpointCard
                key={endpoint.id}
                endpoint={endpoint}
                origin={origin}
                isRu={isRu}
                maxRoutesPerEndpoint={maxRoutesPerEndpoint}
                onDelete={() => deleteEndpoint(endpoint.id)}
                onSaveRoute={(input) => saveRoute(endpoint.id, input)}
                onDeleteRoute={(routeId) => deleteRoute(endpoint.id, routeId)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EndpointCard({
  endpoint, origin, isRu, maxRoutesPerEndpoint, onDelete, onSaveRoute, onDeleteRoute,
}: {
  endpoint: MockEndpoint;
  origin: string;
  isRu: boolean;
  maxRoutesPerEndpoint: number;
  onDelete: () => void;
  onSaveRoute: (input: RouteInput) => Promise<boolean>;
  onDeleteRoute: (routeId: string) => void;
}) {
  const baseUrl = `${origin}/api/mock/${endpoint.slug}`;
  const [form, setForm] = useState<RouteFormState>(DEFAULT_ROUTE_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const bodyResult = useMemo(() => {
    try {
      JSON.parse(form.response_body);
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, message: err instanceof Error ? err.message : "Invalid JSON" };
    }
  }, [form.response_body]);

  const atRouteLimit = endpoint.mock_routes.length >= maxRoutesPerEndpoint
    && !endpoint.mock_routes.some((r) => r.method === form.method && r.path === normalizePath(form.path));

  async function handleSaveRoute() {
    if (!bodyResult.ok) return;
    const status = Number(form.status_code);
    const delay = Number(form.delay_ms);
    if (!Number.isInteger(status) || status < 100 || status > 599) {
      setSaveError(isRu ? "Код статуса должен быть от 100 до 599." : "Status code must be between 100 and 599.");
      return;
    }
    if (!Number.isInteger(delay) || delay < 0 || delay > 5000) {
      setSaveError(isRu ? "Задержка — от 0 до 5000мс." : "Delay must be between 0 and 5000ms.");
      return;
    }
    setSaveError(null);
    setSaving(true);
    const ok = await onSaveRoute({
      method: form.method,
      path: normalizePath(form.path),
      status_code: status,
      response_body: form.response_body,
      delay_ms: delay,
    });
    if (!ok) setSaveError(isRu ? "Не удалось сохранить — возможно, достигнут лимит маршрутов." : "Couldn't save — you may have hit the route limit.");
    setSaving(false);
  }

  return (
    <div className="rounded-lg border border-border bg-canvas p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            {endpoint.name || (isRu ? "Без названия" : "Untitled endpoint")}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <code className="text-xs text-text-secondary">{baseUrl}</code>
            <CopyButton value={baseUrl} label={isRu ? "Копировать" : "Copy"} copiedLabel={isRu ? "Скопировано" : "Copied"} iconOnly />
          </div>
        </div>
        <button onClick={onDelete}
          className="rounded border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10">
          {isRu ? "Удалить эндпоинт" : "Delete endpoint"}
        </button>
      </div>

      <div className="mb-4 space-y-2">
        {endpoint.mock_routes.length === 0 && (
          <p className="text-xs text-text-muted">
            {isRu ? "Пока нет ни одного маршрута — добавь его в форме ниже." : "No routes yet — add one in the form below."}
          </p>
        )}
        {endpoint.mock_routes.map((route) => (
          <div key={route.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-2.5">
            <span className="rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[11px] font-semibold text-accent">
              {route.method}
            </span>
            <code className="text-xs text-text-primary">{route.path}</code>
            <span className="text-xs text-text-muted">&rarr; {route.status_code}</span>
            {route.delay_ms > 0 && <span className="text-xs text-text-muted">+{route.delay_ms}ms</span>}
            <span className="ml-auto text-xs text-text-muted">
              {route.hit_count === 0
                ? (isRu ? "ещё не вызывался" : "never called")
                : (isRu ? `вызван ${route.hit_count} раз` : `called ${route.hit_count}x`)}
            </span>
            <RouteLoadTestPanel url={`${baseUrl}${route.path}`} method={route.method} isRu={isRu} />
            <CopyButton value={`curl -X ${route.method} ${baseUrl}${route.path}`} label="curl" iconOnly />
            <button onClick={() => onDeleteRoute(route.id)} className="text-text-muted transition-colors hover:text-red-400" aria-label={isRu ? "Удалить маршрут" : "Delete route"}>
              <CloseIcon size={12} />
            </button>
          </div>
        ))}
      </div>

      <p className="mb-2 text-xs text-text-muted">
        {endpoint.mock_routes.length} / {maxRoutesPerEndpoint} {isRu ? "маршрутов" : "routes"}
      </p>

      <div className="space-y-3 rounded-lg border border-border bg-surface p-3">
        <div>
          <label className="input-label">{isRu ? "Метод" : "Method"}</label>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button key={m} onClick={() => setForm((f) => ({ ...f, method: m }))}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${form.method === m ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-canvas text-text-muted hover:bg-surface-hover"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="input-label">{isRu ? "Путь" : "Path"}</label>
            <input value={form.path} onChange={(e) => setForm((f) => ({ ...f, path: e.target.value }))}
              placeholder="/orders/42"
              className="code-surface w-full rounded-lg px-3 py-2 text-sm text-text-primary outline-none" />
          </div>
          <div>
            <label className="input-label">{isRu ? "Код статуса" : "Status code"}</label>
            <input type="number" min={100} max={599} value={form.status_code}
              onChange={(e) => setForm((f) => ({ ...f, status_code: e.target.value }))}
              className="code-surface w-full rounded-lg px-3 py-2 text-sm text-text-primary outline-none" />
          </div>
        </div>

        <div>
          <label className="input-label">{isRu ? "Тело ответа (JSON)" : "Response body (JSON)"}</label>
          <textarea rows={5} value={form.response_body}
            onChange={(e) => setForm((f) => ({ ...f, response_body: e.target.value }))}
            className={`code-surface w-full rounded-lg p-3 font-mono text-xs outline-none ${bodyResult.ok ? "text-text-primary" : "text-red-400"}`} />
          {!bodyResult.ok && <p className="mt-1 text-xs text-red-400">{bodyResult.message}</p>}
        </div>

        <div>
          <label className="input-label">{isRu ? "Задержка перед ответом, мс (макс. 5000)" : "Delay before responding, ms (max 5000)"}</label>
          <input type="number" min={0} max={5000} step={100} value={form.delay_ms}
            onChange={(e) => setForm((f) => ({ ...f, delay_ms: e.target.value }))}
            className="code-surface w-full max-w-[160px] rounded-lg px-3 py-2 text-sm text-text-primary outline-none" />
        </div>

        {saveError && <p className="text-xs text-red-400">{saveError}</p>}
        {atRouteLimit && !saveError && (
          <p className="text-xs text-amber-400">
            {isRu ? "Достигнут лимит маршрутов для этого эндпоинта." : "You've reached the route limit for this endpoint."}
          </p>
        )}

        <button onClick={handleSaveRoute} disabled={saving || !bodyResult.ok || atRouteLimit}
          className="rounded bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? (isRu ? "Сохраняю..." : "Saving...") : (isRu ? "Добавить / обновить маршрут" : "Add / update route")}
        </button>
      </div>
    </div>
  );
}

interface LoadTestResult {
  succeeded: number;
  failed: number;
  minMs: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
  reqPerSec: number;
}

// Намеренно бьёт только по собственному мок-маршруту пользователя (тот же
// origin, тот же публичный URL, что уже показан выше как curl-пример) — это
// не универсальный инструмент нагрузочного тестирования чужих серверов, а
// быстрая проверка "что будет с моим кодом, если этот эндпоинт словит
// параллельные запросы" на ресурсе, которым пользователь и так уже владеет.
// Поэтому жёсткие потолки на число запросов и параллелизм ниже — не UX-подсказка,
// а единственная защита от того, чтобы это превратилось в оружие против
// собственного же Vercel-биллинга пользователя.
const MAX_REQUESTS = 200;
const MAX_CONCURRENCY = 20;

function RouteLoadTestPanel({ url, method, isRu }: { url: string; method: string; isRu: boolean }) {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState(20);
  const [concurrency, setConcurrency] = useState(5);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [result, setResult] = useState<LoadTestResult | null>(null);

  async function run() {
    const total = Math.min(Math.max(1, requests), MAX_REQUESTS);
    const conc = Math.min(Math.max(1, concurrency), MAX_CONCURRENCY);
    setRunning(true);
    setResult(null);
    setCompleted(0);

    let launched = 0;
    let done = 0;
    let failed = 0;
    const latencies: number[] = [];
    const startedAt = performance.now();

    async function worker() {
      while (launched < total) {
        launched++;
        const t0 = performance.now();
        try {
          // no-store — иначе повторные GET на один и тот же URL браузер может
          // отдать из HTTP-кэша, и цифры латентности перестанут что-либо значить.
          const res = await fetch(url, { method, cache: "no-store" });
          await res.arrayBuffer();
          latencies.push(performance.now() - t0);
        } catch {
          failed++;
          latencies.push(performance.now() - t0);
        }
        done++;
        setCompleted(done);
      }
    }

    await Promise.all(Array.from({ length: conc }, () => worker()));

    const durationSec = (performance.now() - startedAt) / 1000;
    const sorted = [...latencies].sort((a, b) => a - b);
    const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);

    setResult({
      succeeded: total - failed,
      failed,
      minMs: sorted[0] ?? 0,
      avgMs: sorted.reduce((s, v) => s + v, 0) / (sorted.length || 1),
      p95Ms: sorted[p95Index] ?? 0,
      maxMs: sorted[sorted.length - 1] ?? 0,
      reqPerSec: durationSec > 0 ? total / durationSec : 0,
    });
    setRunning(false);
  }

  return (
    <>
      <button onClick={() => setOpen((o) => !o)}
        className="text-xs text-text-muted transition-colors hover:text-text-primary">
        {isRu ? "Нагрузочный тест" : "Load test"}
      </button>

      {open && (
        <div className="basis-full space-y-3 rounded-lg border border-border bg-canvas p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="input-label">{isRu ? "Запросов" : "Requests"}</label>
              <input type="number" min={1} max={MAX_REQUESTS} value={requests}
                onChange={(e) => setRequests(Math.min(MAX_REQUESTS, Math.max(1, Number(e.target.value))))}
                className="code-surface w-24 rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-none" />
            </div>
            <div>
              <label className="input-label">{isRu ? "Параллельно" : "Concurrency"}</label>
              <input type="number" min={1} max={MAX_CONCURRENCY} value={concurrency}
                onChange={(e) => setConcurrency(Math.min(MAX_CONCURRENCY, Math.max(1, Number(e.target.value))))}
                className="code-surface w-24 rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-none" />
            </div>
            <button onClick={run} disabled={running}
              className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg transition-colors hover:bg-amber-400 disabled:opacity-50">
              {running
                ? (isRu ? `Выполняю... ${completed}/${Math.min(Math.max(1, requests), MAX_REQUESTS)}` : `Running... ${completed}/${Math.min(Math.max(1, requests), MAX_REQUESTS)}`)
                : (isRu ? "Запустить" : "Run")}
            </button>
          </div>
          <p className="text-[11px] text-text-muted">
            {isRu
              ? `Максимум ${MAX_REQUESTS} запросов и ${MAX_CONCURRENCY} параллельно — это твой собственный эндпоинт, но лимит защищает от случайной перегрузки твоего же аккаунта.`
              : `Max ${MAX_REQUESTS} requests, ${MAX_CONCURRENCY} concurrent — this hits your own endpoint only, the limit just guards against accidentally hammering your own account.`}
          </p>

          {result && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: isRu ? "Успешно" : "Succeeded", value: String(result.succeeded), className: "text-emerald-400" },
                { label: isRu ? "Ошибки" : "Failed", value: String(result.failed), className: result.failed > 0 ? "text-red-400" : "text-text-primary" },
                { label: isRu ? "Запросов/сек" : "Req/sec", value: result.reqPerSec.toFixed(1), className: "text-text-primary" },
                { label: "Min", value: `${result.minMs.toFixed(0)} ms`, className: "text-text-primary" },
                { label: "Avg", value: `${result.avgMs.toFixed(0)} ms`, className: "text-text-primary" },
                { label: "p95", value: `${result.p95Ms.toFixed(0)} ms`, className: "text-text-primary" },
                { label: "Max", value: `${result.maxMs.toFixed(0)} ms`, className: "text-text-primary" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-border bg-surface px-2.5 py-1.5">
                  <div className={`font-mono text-xs ${s.className}`}>{s.value}</div>
                  <div className="text-[10px] text-text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
