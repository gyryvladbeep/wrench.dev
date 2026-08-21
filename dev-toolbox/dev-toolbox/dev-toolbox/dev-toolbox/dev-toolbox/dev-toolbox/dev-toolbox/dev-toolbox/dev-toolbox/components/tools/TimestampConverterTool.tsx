"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { Locale } from "@/lib/i18n/config";

function looksLikeMillis(digits: string): boolean {
  return digits.length >= 13;
}

export function TimestampConverterTool({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [timestampInput, setTimestampInput] = useState(String(Math.floor(Date.now() / 1000)));
  const [dateInput, setDateInput] = useState("");
  const t = dict.tools.timestamp;
  const intlLocale = locale === "ru" ? "ru-RU" : "en-US";

  const fromTimestamp = useMemo(() => {
    const trimmed = timestampInput.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) return { ok: false as const };
    const ms = looksLikeMillis(trimmed) ? Number(trimmed) : Number(trimmed) * 1000;
    const date = new Date(ms);
    if (isNaN(date.getTime())) return { ok: false as const };
    return {
      ok: true as const,
      iso: date.toISOString(),
      local: date.toLocaleString(intlLocale),
      utc: date.toUTCString(),
    };
  }, [timestampInput, intlLocale]);

  const fromDate = useMemo(() => {
    if (!dateInput) return { ok: false as const };
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return { ok: false as const };
    return {
      ok: true as const,
      seconds: Math.floor(date.getTime() / 1000),
      millis: date.getTime(),
    };
  }, [dateInput]);

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="ts-input" className="text-xs font-medium text-text-muted">
            {t.timestampLabel}
          </label>
          <Button variant="secondary" onClick={() => setTimestampInput(String(Date.now()))}>
            {t.now}
          </Button>
        </div>
        <input
          id="ts-input"
          value={timestampInput}
          onChange={(e) => setTimestampInput(e.target.value)}
          className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"
        />
        {fromTimestamp.ok ? (
          <div className="mt-3 space-y-1 text-sm text-text-primary">
            <div className="flex items-center justify-between">
              <span>
                {t.local} {fromTimestamp.local}
              </span>
              <CopyButton value={fromTimestamp.local} label={dict.common.copy} copiedLabel={dict.common.copied} />
            </div>
            <div className="flex items-center justify-between">
              <span>
                {t.utc} {fromTimestamp.utc}
              </span>
              <CopyButton value={fromTimestamp.utc} label={dict.common.copy} copiedLabel={dict.common.copied} />
            </div>
            <div className="flex items-center justify-between">
              <span>
                {t.iso} {fromTimestamp.iso}
              </span>
              <CopyButton value={fromTimestamp.iso} label={dict.common.copy} copiedLabel={dict.common.copied} />
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-text-muted">{t.enterTimestampHint}</p>
        )}
      </div>

      <div>
        <label htmlFor="date-input" className="mb-1 block text-xs font-medium text-text-muted">
          {t.dateLabel}
        </label>
        <input
          id="date-input"
          type="datetime-local"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"
        />
        {fromDate.ok ? (
          <div className="mt-3 space-y-1 text-sm text-text-primary">
            <div className="flex items-center justify-between">
              <span>
                {t.seconds} {fromDate.seconds}
              </span>
              <CopyButton value={String(fromDate.seconds)} label={dict.common.copy} copiedLabel={dict.common.copied} />
            </div>
            <div className="flex items-center justify-between">
              <span>
                {t.milliseconds} {fromDate.millis}
              </span>
              <CopyButton value={String(fromDate.millis)} label={dict.common.copy} copiedLabel={dict.common.copied} />
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-text-muted">{t.pickDateHint}</p>
        )}
      </div>
    </div>
  );
}
