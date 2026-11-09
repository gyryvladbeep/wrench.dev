"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { SAMPLE_HTML, buildPreview, checkMeta, parseMeta } from "@/lib/messenger/unfurl";
import { FindingsList } from "./mobile/FindingsList";
import { Field, areaClass, inputClass } from "./messenger/ui";

export function LinkUnfurlMetaCheckerTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [html, setHtml] = useState(SAMPLE_HTML);
  const [url, setUrl] = useState("https://acme.example/blog/release-4-2");
  const meta = useMemo(() => parseMeta(html), [html]);
  const preview = useMemo(() => buildPreview(meta, url), [meta, url]);
  const findings = useMemo(() => checkMeta(meta, url), [meta, url]);
  const fields = [...Object.entries(meta.og), ...Object.entries(meta.twitter)];

  return (
    <div className="space-y-5 max-w-4xl">
      <Field id="lu-url" label={isRu ? "Адрес страницы" : "Page URL"}>
        <input id="lu-url" value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} />
      </Field>
      <Field id="lu-html" label={isRu ? "HTML страницы (достаточно head)" : "Page HTML (the head is enough)"} hint={isRu ? "Откройте страницу, нажмите Ctrl+U и скопируйте блок head." : "Open the page, press Ctrl+U and copy the head block."}>
        <textarea id="lu-html" value={html} onChange={(e) => setHtml(e.target.value)} className={`${areaClass} min-h-[200px]`} spellCheck={false} />
      </Field>
      <section className="rounded-lg border border-border bg-surface p-4" data-testid="lu-preview" data-title={preview.title} data-image={preview.image ?? ""}>
        <h3 className="mb-2 text-[11px] uppercase tracking-wider text-text-muted">{isRu ? "Что, скорее всего, покажет чат" : "What a chat will most likely show"}</h3>
        {preview.siteName ? <div className="text-xs text-text-muted">{preview.siteName}</div> : null}
        <div className="text-base font-medium text-text-primary">{preview.title}</div>
        {preview.description ? <p className="text-sm text-text-muted">{preview.description}</p> : null}
        <div className="mt-2 break-all font-mono text-xs text-text-muted">{preview.image ?? (isRu ? "(без картинки)" : "(no image)")}</div>
        <div className="mt-1 break-all font-mono text-xs text-text-muted">{preview.url}</div>
      </section>
      <FindingsList findings={findings} isRu={isRu} testId="lu-findings" />
      {fields.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="lu-fields">
            <tbody>
              {fields.map(([k, v]) => <tr key={k} data-key={k} className="border-t border-border"><td className="px-3 py-1.5 font-mono text-text-muted">{k}</td><td className="px-3 py-1.5 break-all">{v}</td></tr>)}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
