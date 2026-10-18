"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { PushPlatform, SAMPLE_APNS, SAMPLE_FCM, validatePush } from "@/lib/mobile/push-payload";
import { FindingsList } from "./mobile/FindingsList";

export function PushPayloadValidatorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [platform, setPlatform] = useState<PushPlatform>("apns");
  const [voip, setVoip] = useState(false);
  const [texts, setTexts] = useState<Record<PushPlatform, string>>({ apns: SAMPLE_APNS, fcm: SAMPLE_FCM });

  const text = texts[platform];
  const result = useMemo(() => validatePush(text, platform, voip), [text, platform, voip]);
  const pct = Math.min(100, Math.round((result.size / result.limit) * 100));
  const barColor = result.size > result.limit ? "bg-red-500" : pct > 90 ? "bg-amber-500" : "bg-accent";

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1.5">
          {(["apns", "fcm"] as PushPlatform[]).map((p) => (
            <button key={p} type="button" onClick={() => setPlatform(p)} aria-pressed={platform === p}
              className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${platform === p ? "border-accent/50 bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-surface-hover"}`}>
              {p === "apns" ? "APNs (iOS)" : "FCM HTTP v1 (Android)"}
            </button>
          ))}
        </div>
        {platform === "apns" && (
          <label htmlFor="push-voip" className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
            <input id="push-voip" type="checkbox" checked={voip} onChange={(e) => setVoip(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--accent-rgb))]" />
            {isRu ? "VoIP-уведомление (лимит 5120 байт)" : "VoIP notification (5120-byte limit)"}
          </label>
        )}
      </div>

      <div>
        <label htmlFor="push-input" className="input-label">{isRu ? "JSON пейлоада" : "Push payload JSON"}</label>
        <textarea id="push-input" value={text} onChange={(e) => setTexts((t) => ({ ...t, [platform]: e.target.value }))} rows={12} spellCheck={false}
          className="code-surface w-full rounded-lg px-3 py-2.5 font-mono text-xs text-text-primary outline-none" />
      </div>

      <div className="space-y-1.5">
        <p className="text-sm text-text-primary" data-testid="push-size">
          {result.jsonOk ? `${result.size} / ${result.limit} ${isRu ? "байт" : "bytes"}` : (isRu ? "Размер не определён: JSON некорректен" : "Size unknown: invalid JSON")}
        </p>
        <div className="h-2 w-full overflow-hidden rounded bg-canvas" aria-hidden>
          <div className={`h-full ${barColor}`} style={{ width: `${result.jsonOk ? pct : 0}%` }} />
        </div>
        <p className="text-xs text-text-muted">{isRu ? "Размер считается по JSON без пробелов и переводов строк." : "Size is measured on the minified JSON, without whitespace."}</p>
      </div>

      <FindingsList findings={result.findings} isRu={isRu} testId="push-findings" emptyText={isRu ? "Замечаний нет: структура и размер в порядке." : "No issues found: structure and size look fine."} />
    </div>
  );
}
