"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useWebhookBins, WebhookBin, WebhookRequestRow, WEBHOOK_REQUEST_RETENTION } from "@/lib/hooks/useWebhookBins";
import { localePath, Locale } from "@/lib/i18n/config";
import { CopyButton } from "@/components/CopyButton";
import { InboxIcon, CloseIcon } from "@/components/icons/GameIcons";

const FALLBACK_ORIGIN = "https://wrench-dev-lr29.vercel.app";
// Как часто опрашиваем бины на новые запросы, пока страница открыта —
// см. обоснование "поллинг вместо realtime" в lib/hooks/useWebhookBins.ts.
const POLL_MS = 5000;

function timeAgo(iso: string, isRu: boolean): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return isRu ? `${seconds}с назад` : `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return isRu ? `${minutes}м назад` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return isRu ? `${hours}ч назад` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return isRu ? `${days}д назад` : `${days}d ago`;
}

function prettyBody(body: string, contentType: string | null): string {
  if (!body) return "";
  const looksJson = (contentType ?? "").includes("json") || /^\s*[[{]/.test(body);
  if (looksJson) {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      // Тело помечено/выглядит как JSON, но не парсится (например было
      // обрезано по MAX_BODY_CHARS на приёме) — показываем как есть.
    }
  }
  return body;
}

export function WebhookInspectorClient({ locale }: { locale: Locale }) {
  const isRu = locale === "ru";
  const { user, loading: authLoading } = useAuth();
  const { isPro } = useSubscription();
  const { bins, loading, maxBins, createBin, deleteBin, clearRequests, deleteRequest, refreshBin } = useWebhookBins(isPro);

  const [origin, setOrigin] = useState(FALLBACK_ORIGIN);
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    setCreating(true);
    await createBin(newName.trim());
    setNewName("");
    setCreating(false);
  }

  // Опрашиваем все бины пользователя, пока страница открыта — зависимость
  // только от СПИСКА id (не от самих bins, который меняется на каждый тик
  // за счёт refreshBin), иначе каждый успешный опрос пересоздавал бы этот
  // эффект и путал таймер.
  const binIds = bins.map((b) => b.id).join(",");
  useEffect(() => {
    if (!binIds) return;
    const ids = binIds.split(",");
    const interval = setInterval(() => {
      ids.forEach((id) => refreshBin(id));
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [binIds, refreshBin]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-canvas text-accent">
          <InboxIcon size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isRu ? "Webhook Inspector" : "Webhook Inspector"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary leading-relaxed">
            {isRu
              ? "Получи публичный URL и направь на него реальный вебхук — от Stripe, GitHub, платёжной системы или собственного бэкенда. Каждый запрос, который туда придёт, ловится и показывается здесь целиком: метод, путь, query-параметры, заголовки и тело — ровно то, что реально долетело до сервера, без гадания по логам."
              : "Get a public URL and point a real webhook at it — from Stripe, GitHub, a payment provider, or your own backend. Every request that arrives gets captured and shown here in full: method, path, query params, headers and body — exactly what actually reached the server, no guessing from logs."}
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-base font-semibold text-text-primary">
          {isRu ? "Как это выглядит" : "What it looks like"}
        </h2>
        <pre className="code-surface overflow-x-auto rounded-lg p-3 text-xs leading-relaxed text-text-secondary">
{`$ curl -X POST ${FALLBACK_ORIGIN}/api/hook/a1b2c3d4e5f6 \\
    -H "Content-Type: application/json" \\
    -d '{"event":"payment.succeeded","amount":4200}'

HTTP/1.1 200 OK
{ "received": true }`}
        </pre>
        <p className="mt-3 text-xs text-text-muted">
          {isRu
            ? `Каждый вызов появится ниже автоматически (страница обновляется каждые ${POLL_MS / 1000}с, пока открыта) — хранятся последние ${WEBHOOK_REQUEST_RETENTION} запросов на бин.`
            : `Every call shows up below automatically (the page refreshes every ${POLL_MS / 1000}s while open) — the last ${WEBHOOK_REQUEST_RETENTION} requests per bin are kept.`}
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-base font-semibold text-text-primary">
          {isRu ? "Твои бины" : "Your bins"}
        </h2>

        {authLoading ? null : !user ? (
          <div className="rounded-lg border border-border bg-canvas p-4 text-center">
            <p className="text-sm text-text-secondary">
              {isRu ? "Нужно войти в аккаунт, чтобы создавать бины." : "Sign in to create webhook bins."}
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
              <button onClick={handleCreate} disabled={creating || bins.length >= maxBins}
                className="shrink-0 rounded bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                {isRu ? "+ Новый бин" : "+ New bin"}
              </button>
            </div>
            <p className="text-xs text-text-muted">
              {bins.length} / {maxBins} {isRu ? "бинов использовано" : "bins used"}
              {!isPro && bins.length >= maxBins && (
                <> — <Link href={localePath(locale, "/pro")} className="text-accent hover:underline">
                  {isRu ? "нужно больше? посмотри Pro" : "need more? check out Pro"}
                </Link></>
              )}
            </p>

            {bins.length === 0 && (
              <p className="text-sm text-text-muted">
                {isRu ? "Пока нет ни одного бина — создай первый выше." : "No bins yet — create your first one above."}
              </p>
            )}

            {bins.map((bin) => (
              <BinCard
                key={bin.id}
                bin={bin}
                origin={origin}
                isRu={isRu}
                onDelete={() => deleteBin(bin.id)}
                onClear={() => clearRequests(bin.id)}
                onDeleteRequest={(requestId) => deleteRequest(bin.id, requestId)}
                onRefresh={() => refreshBin(bin.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BinCard({
  bin, origin, isRu, onDelete, onClear, onDeleteRequest, onRefresh,
}: {
  bin: WebhookBin;
  origin: string;
  isRu: boolean;
  onDelete: () => void;
  onClear: () => void;
  onDeleteRequest: (requestId: string) => void;
  onRefresh: () => void;
}) {
  const url = `${origin}/api/hook/${bin.slug}`;
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-canvas p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            {bin.name || (isRu ? "Без названия" : "Untitled bin")}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <code className="text-xs text-text-secondary">{url}</code>
            <CopyButton value={url} label={isRu ? "Копировать" : "Copy"} copiedLabel={isRu ? "Скопировано" : "Copied"} iconOnly />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh}
            className="rounded border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-hover">
            {isRu ? "Обновить" : "Refresh"}
          </button>
          <button onClick={onDelete}
            className="rounded border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10">
            {isRu ? "Удалить бин" : "Delete bin"}
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-text-muted">
          {bin.webhook_requests.length === 0
            ? (isRu ? "Запросов пока не было" : "No requests yet")
            : (isRu ? `Запросов: ${bin.webhook_requests.length}` : `${bin.webhook_requests.length} request${bin.webhook_requests.length === 1 ? "" : "s"}`)}
        </p>
        {bin.webhook_requests.length > 0 && (
          confirmClear ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-text-muted">{isRu ? "Очистить всё?" : "Clear all?"}</span>
              <button onClick={() => { onClear(); setConfirmClear(false); }} className="font-medium text-red-400 hover:underline">
                {isRu ? "Да" : "Yes"}
              </button>
              <button onClick={() => setConfirmClear(false)} className="text-text-muted hover:underline">
                {isRu ? "Отмена" : "Cancel"}
              </button>
            </span>
          ) : (
            <button onClick={() => setConfirmClear(true)} className="text-xs text-text-muted transition-colors hover:text-red-400">
              {isRu ? "Очистить" : "Clear"}
            </button>
          )
        )}
      </div>

      {bin.webhook_requests.length === 0 ? (
        <p className="text-xs text-text-muted">
          {isRu
            ? "Отправь запрос на URL выше (curl, Postman, реальный вебхук от сервиса) — он появится здесь автоматически."
            : "Send a request to the URL above (curl, Postman, a real webhook from a service) — it'll show up here automatically."}
        </p>
      ) : (
        <div className="space-y-2">
          {bin.webhook_requests.map((req) => (
            <RequestRow key={req.id} req={req} isRu={isRu} onDelete={() => onDeleteRequest(req.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestRow({ req, isRu, onDelete }: { req: WebhookRequestRow; isRu: boolean; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const bodyBytes = new TextEncoder().encode(req.body).length;
  const queryEntries = Object.entries(req.query);
  const headerEntries = Object.entries(req.headers);

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex w-full flex-wrap items-center gap-2 p-2.5">
        <button onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-left">
          <span className="rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[11px] font-semibold text-accent">
            {req.method}
          </span>
          <code className="text-xs text-text-primary">{req.path}</code>
          {req.source_ip && <span className="text-xs text-text-muted">{req.source_ip}</span>}
          <span className="text-xs text-text-muted">{bodyBytes}B</span>
        </button>
        <span className="text-xs text-text-muted">{timeAgo(req.received_at, isRu)}</span>
        <button
          onClick={onDelete}
          aria-label={isRu ? "Удалить запрос" : "Delete request"}
          className="text-text-muted transition-colors hover:text-red-400"
        >
          <CloseIcon size={12} />
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-border p-3">
          {queryEntries.length > 0 && (
            <div>
              <p className="input-label">{isRu ? "Query-параметры" : "Query params"}</p>
              <div className="code-surface space-y-0.5 rounded-lg p-2.5 font-mono text-xs text-text-secondary">
                {queryEntries.map(([k, v]) => (
                  <div key={k} className="break-all"><span className="text-text-primary">{k}</span>: {v}</div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="input-label">{isRu ? "Заголовки" : "Headers"}</p>
            <div className="code-surface max-h-48 space-y-0.5 overflow-y-auto rounded-lg p-2.5 font-mono text-xs text-text-secondary">
              {headerEntries.length === 0
                ? <span className="text-text-muted">{isRu ? "нет" : "none"}</span>
                : headerEntries.map(([k, v]) => (
                  <div key={k} className="break-all"><span className="text-text-primary">{k}</span>: {v}</div>
                ))}
            </div>
          </div>

          <div>
            <p className="input-label">{isRu ? "Тело" : "Body"}</p>
            {req.body ? (
              <pre className="code-surface max-h-64 overflow-auto rounded-lg p-2.5 font-mono text-xs text-text-secondary">{prettyBody(req.body, req.content_type)}</pre>
            ) : (
              <p className="text-xs text-text-muted">{isRu ? "пусто" : "empty"}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
