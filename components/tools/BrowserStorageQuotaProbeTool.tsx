"use client";
import { useEffect, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { ProbeResult, probeStorage } from "@/lib/messenger/storage-probe";
import { btnClass, primaryBtn } from "./messenger/ui";

interface Estimate { usage: number; quota: number; persisted: boolean | null }

const mb = (n: number) => `${(n / 1048576).toFixed(2)} MB`;

export function BrowserStorageQuotaProbeTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimateError, setEstimateError] = useState(false);
  const [local, setLocal] = useState<ProbeResult | null>(null);
  const [session, setSession] = useState<ProbeResult | null>(null);
  const [busy, setBusy] = useState(false);

  const readEstimate = async () => {
    try {
      const e = await navigator.storage.estimate();
      let persisted: boolean | null = null;
      try { persisted = await navigator.storage.persisted(); } catch { /* не поддерживается */ }
      setEstimate({ usage: e.usage ?? 0, quota: e.quota ?? 0, persisted });
      setEstimateError(false);
    } catch { setEstimateError(true); }
  };
  useEffect(() => { void readEstimate(); }, []);

  const run = (which: "local" | "session") => {
    setBusy(true);
    // Небольшая пауза, чтобы интерфейс успел показать состояние перед тяжёлой записью.
    setTimeout(() => {
      try {
        const r = probeStorage(which === "local" ? window.localStorage : window.sessionStorage);
        (which === "local" ? setLocal : setSession)(r);
      } catch {
        (which === "local" ? setLocal : setSession)({ chars: 0, attempts: 0, capped: false });
      }
      setBusy(false);
    }, 30);
  };

  const cell = (id: string, r: ProbeResult | null) => (
    <p className="text-sm" data-testid={id} data-chars={r ? r.chars : ""}>
      {r === null ? (isRu ? "Ещё не измерялось." : "Not measured yet.") : r.chars === 0 ? (isRu ? "Запись недоступна." : "Writing is not available.") : `${r.chars.toLocaleString("en-US")} ${isRu ? "символов" : "characters"} (${mb(r.chars * 2)} ${isRu ? "в UTF-16" : "as UTF-16"})${r.capped ? (isRu ? "; предел проверки, квота не найдена" : "; test limit reached, quota not found") : ""}`}
    </p>
  );

  return (
    <div className="space-y-5 max-w-4xl">
      <section className="space-y-2 rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-medium text-text-primary">{isRu ? "Общая квота сайта" : "Overall site quota"}</h3>
        {estimateError ? <p className="text-sm text-text-muted" data-testid="sq-estimate-error">{isRu ? "Браузер не поддерживает StorageManager.estimate()." : "This browser does not support StorageManager.estimate()."}</p> : estimate ? (
          <p className="text-sm" data-testid="sq-estimate" data-quota={estimate.quota} data-usage={estimate.usage}>
            {isRu ? "Занято" : "Used"} <span className="font-mono">{mb(estimate.usage)}</span> {isRu ? "из" : "of"} <span className="font-mono">{mb(estimate.quota)}</span>
            {estimate.persisted !== null ? ` · ${estimate.persisted ? (isRu ? "хранилище постоянное" : "persistent storage") : (isRu ? "хранилище может быть очищено браузером" : "the browser may evict this storage")}` : ""}
          </p>
        ) : <p className="text-sm text-text-muted">...</p>}
        <button type="button" data-testid="sq-estimate-btn" className={btnClass} onClick={() => void readEstimate()}>{isRu ? "Обновить оценку" : "Refresh estimate"}</button>
      </section>
      <section className="space-y-2 rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-medium text-text-primary">localStorage</h3>
        {cell("sq-local", local)}
        <button type="button" data-testid="sq-local-btn" className={primaryBtn} disabled={busy} onClick={() => run("local")}>{isRu ? "Измерить лимит localStorage" : "Measure the localStorage limit"}</button>
      </section>
      <section className="space-y-2 rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-medium text-text-primary">sessionStorage</h3>
        {cell("sq-session", session)}
        <button type="button" data-testid="sq-session-btn" className={primaryBtn} disabled={busy} onClick={() => run("session")}>{isRu ? "Измерить лимит sessionStorage" : "Measure the sessionStorage limit"}</button>
      </section>
      <p className="text-xs text-text-muted">{isRu ? "Проба пишет временный ключ только в хранилище этого сайта и удаляет его сразу после замера. Пока идёт замер, остальные записи этого сайта могут на мгновение не проходить. Чтобы проверить своё приложение, откройте консоль на его странице и выполните тот же алгоритм: удвойте строку, пока setItem не бросит QuotaExceededError." : "The probe writes one temporary key into this site's storage only and removes it right after the measurement. While it runs, other writes from this site may briefly fail. To check your own app, run the same algorithm in its console: keep doubling a string until setItem throws QuotaExceededError."}</p>
    </div>
  );
}
