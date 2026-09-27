"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePinnedCases, PinnedCase } from "@/lib/hooks/usePinnedCases";
import { tools } from "@/lib/tools-registry";
import { localizeTool } from "@/lib/i18n/localize";
import { localePath, Locale } from "@/lib/i18n/config";
import { CopyButton } from "@/components/CopyButton";
import { CloseIcon, LayersIcon } from "@/components/icons/GameIcons";

function toolName(slug: string, locale: Locale): string {
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) return slug;
  return localizeTool(tool, locale).name;
}

function formatDate(iso: string, isRu: boolean): string {
  return new Date(iso).toLocaleString(isRu ? "ru-RU" : "en-US");
}

export function VaultClient({ locale }: { locale: Locale }) {
  const isRu = locale === "ru";
  const { cases, hydrated, unpin } = usePinnedCases();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, PinnedCase[]>();
    for (const c of cases) {
      const list = map.get(c.tool_slug) ?? [];
      list.push(c);
      map.set(c.tool_slug, list);
    }
    return [...map.entries()].sort((a, b) => toolName(a[0], locale).localeCompare(toolName(b[0], locale)));
  }, [cases, locale]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-canvas text-accent">
          <LayersIcon size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Test Vault</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary leading-relaxed">
            {isRu
              ? "Все тест-кейсы, которые ты закрепил на инструментах — ввод, результат и твоя метка, в одном месте. Кнопка «Закрепить как тест-кейс» есть на JSON Formatter, JWT Decoder и Regex Tester."
              : "Every test case you've pinned across tools — input, result, and your own label, all in one place. The “Pin as test case” button lives on JSON Formatter, JWT Decoder, and Regex Tester."}
          </p>
        </div>
      </div>

      {!hydrated ? (
        <p className="text-sm text-text-muted">{isRu ? "Загрузка..." : "Loading..."}</p>
      ) : cases.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-6 text-center">
          <p className="text-sm text-text-secondary">
            {isRu
              ? "Пока пусто. Открой один из инструментов, получи результат и нажми «Закрепить как тест-кейс»."
              : "Nothing here yet. Open one of the tools, get a result, and click “Pin as test case”."}
          </p>
          <Link
            href={localePath(locale, "/tools/json-formatter")}
            className="mt-3 inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
          >
            {isRu ? "Открыть JSON Formatter" : "Open JSON Formatter"}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-xs text-text-muted">
            {cases.length} {isRu ? "закреплённых кейсов" : `pinned case${cases.length === 1 ? "" : "s"}`}
          </p>

          {grouped.map(([slug, list]) => (
            <section key={slug} className="rounded-xl border border-border bg-surface p-5">
              <h2 className="mb-3 text-base font-semibold text-text-primary">
                {toolName(slug, locale)} <span className="font-normal text-text-muted">({list.length})</span>
              </h2>
              <div className="space-y-2">
                {list.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border bg-canvas p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-text-primary">
                        {c.label || (isRu ? "Без метки" : "Untitled")}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-muted">{formatDate(c.created_at, isRu)}</span>
                        {confirmId === c.id ? (
                          <span className="flex items-center gap-2 text-xs">
                            <button
                              onClick={() => { unpin(c.id); setConfirmId(null); }}
                              className="font-medium text-red-400 hover:underline"
                            >
                              {isRu ? "Удалить" : "Delete"}
                            </button>
                            <button onClick={() => setConfirmId(null)} className="text-text-muted hover:underline">
                              {isRu ? "Отмена" : "Cancel"}
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmId(c.id)}
                            aria-label={isRu ? "Удалить кейс" : "Delete case"}
                            className="text-text-muted transition-colors hover:text-red-400"
                          >
                            <CloseIcon size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-text-muted">{isRu ? "Ввод" : "Input"}</span>
                          <CopyButton value={JSON.stringify(c.input_payload, null, 2)} iconOnly />
                        </div>
                        <pre className="code-surface max-h-40 overflow-auto rounded-lg p-2 font-mono text-[11px] text-text-secondary">
                          {JSON.stringify(c.input_payload, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-text-muted">{isRu ? "Результат" : "Output"}</span>
                          <CopyButton value={JSON.stringify(c.expected_output, null, 2)} iconOnly />
                        </div>
                        <pre className="code-surface max-h-40 overflow-auto rounded-lg p-2 font-mono text-[11px] text-text-secondary">
                          {JSON.stringify(c.expected_output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
