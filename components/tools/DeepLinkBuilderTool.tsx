"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { QueryParam, LinkKind, adbCommand, buildDeepLink, intentFilterXml, simctlCommand } from "@/lib/mobile/deeplink";

const inputClass = "code-surface w-full rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none";

const WARNINGS: Record<string, { en: string; ru: string }> = {
  "scheme-missing": { en: "Scheme is empty.", ru: "Схема не указана." },
  "scheme-invalid": { en: "Scheme may contain only letters, digits, +, - and . and must start with a letter.", ru: "Схема может содержать только буквы, цифры, +, - и . и должна начинаться с буквы." },
  "host-required": { en: "A universal link needs a host.", ru: "Для universal link нужен хост." },
  "host-invalid": { en: "Host looks invalid (spaces or unsupported characters).", ru: "Хост выглядит некорректно (пробелы или недопустимые символы)." },
  "empty-target": { en: "Host and path are both empty, so the link opens nothing specific.", ru: "Хост и путь пусты, ссылка не ведёт ни на какой экран." },
  "duplicate-keys": { en: "Some query keys repeat; many apps read only one of the values.", ru: "Некоторые ключи запроса повторяются; многие приложения читают только одно из значений." },
  "too-long": { en: "The URL is longer than 2000 characters; some clients truncate it.", ru: "URL длиннее 2000 символов; некоторые клиенты его обрезают." },
};

export function DeepLinkBuilderTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [kind, setKind] = useState<LinkKind>("custom");
  const [scheme, setScheme] = useState("myapp");
  const [host, setHost] = useState("product");
  const [path, setPath] = useState("42");
  const [fragment, setFragment] = useState("");
  const [pkg, setPkg] = useState("");
  const [params, setParams] = useState<QueryParam[]>([{ key: "ref", value: "email campaign" }]);

  const result = useMemo(() => buildDeepLink({ kind, scheme, host, path, params, fragment }), [kind, scheme, host, path, params, fragment]);
  const adb = adbCommand(result.url, pkg);
  const sim = simctlCommand(result.url);
  const xml = intentFilterXml(kind, scheme, host, path);

  const updateParam = (i: number, patch: Partial<QueryParam>) =>
    setParams((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const out = (label: string, value: string, testid: string, pre = false) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="input-label !mb-0">{label}</span>
        <CopyButton value={value} iconOnly />
      </div>
      {pre ? (
        <pre data-testid={testid} className="code-surface overflow-x-auto rounded-lg px-3 py-2.5 text-sm text-text-primary whitespace-pre">{value}</pre>
      ) : (
        <div data-testid={testid} className="code-surface overflow-x-auto rounded-lg px-3 py-2.5 text-sm text-text-primary whitespace-nowrap">{value}</div>
      )}
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex gap-1.5">
        {(["custom", "https"] as LinkKind[]).map((k) => (
          <button key={k} type="button" onClick={() => setKind(k)} aria-pressed={kind === k}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${kind === k ? "border-accent/50 bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-surface-hover"}`}>
            {k === "custom" ? (isRu ? "Своя схема (myapp://)" : "Custom scheme (myapp://)") : (isRu ? "Universal / App Link (https://)" : "Universal / App Link (https://)")}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 rounded-lg border border-border bg-surface p-4">
        {kind === "custom" && (
          <div>
            <label htmlFor="dl-scheme" className="input-label">{isRu ? "Схема" : "Scheme"}</label>
            <input id="dl-scheme" value={scheme} onChange={(e) => setScheme(e.target.value)} spellCheck={false} className={inputClass} />
          </div>
        )}
        <div>
          <label htmlFor="dl-host" className="input-label">{isRu ? "Хост" : "Host"}</label>
          <input id="dl-host" value={host} onChange={(e) => setHost(e.target.value)} spellCheck={false} className={inputClass} />
        </div>
        <div>
          <label htmlFor="dl-path" className="input-label">{isRu ? "Путь" : "Path"}</label>
          <input id="dl-path" value={path} onChange={(e) => setPath(e.target.value)} spellCheck={false} className={inputClass} />
        </div>
        <div>
          <label htmlFor="dl-fragment" className="input-label">{isRu ? "Фрагмент (необязательно)" : "Fragment (optional)"}</label>
          <input id="dl-fragment" value={fragment} onChange={(e) => setFragment(e.target.value)} spellCheck={false} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="dl-package" className="input-label">{isRu ? "Пакет Android (необязательно, форсирует это приложение)" : "Android package (optional, forces this app)"}</label>
          <input id="dl-package" value={pkg} onChange={(e) => setPkg(e.target.value)} placeholder="com.example.app" spellCheck={false} className={inputClass} />
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
        <span className="input-label !mb-0">{isRu ? "Параметры запроса" : "Query parameters"}</span>
        {params.map((p, i) => (
          <div key={i} className="flex gap-2">
            <input aria-label={`${isRu ? "Ключ" : "Key"} ${i + 1}`} value={p.key} onChange={(e) => updateParam(i, { key: e.target.value })} placeholder={isRu ? "ключ" : "key"} spellCheck={false} className={inputClass} />
            <input aria-label={`${isRu ? "Значение" : "Value"} ${i + 1}`} value={p.value} onChange={(e) => updateParam(i, { value: e.target.value })} placeholder={isRu ? "значение" : "value"} spellCheck={false} className={inputClass} />
            <button type="button" onClick={() => setParams((ps) => ps.filter((_, idx) => idx !== i))} aria-label={`${isRu ? "Удалить параметр" : "Remove parameter"} ${i + 1}`}
              className="shrink-0 rounded-lg border border-border bg-surface px-3 text-sm text-text-muted hover:bg-surface-hover">{"×"}</button>
          </div>
        ))}
        <button type="button" onClick={() => setParams((ps) => [...ps, { key: "", value: "" }])}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-muted hover:bg-surface-hover">
          {isRu ? "Добавить параметр" : "Add parameter"}
        </button>
      </div>

      {result.warnings.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300" data-testid="dl-warnings">
          {result.warnings.map((w) => (
            <li key={w}>{isRu ? WARNINGS[w]?.ru : WARNINGS[w]?.en}</li>
          ))}
        </ul>
      )}

      <div className="space-y-4">
        {out(isRu ? "Ссылка" : "Link", result.url, "dl-url")}
        {out("Android (adb)", adb, "dl-adb")}
        {out("iOS (simctl)", sim, "dl-simctl")}
        {out(isRu ? "Фрагмент AndroidManifest.xml, который принимает эту ссылку" : "AndroidManifest.xml snippet that accepts this link", xml, "dl-xml", true)}
      </div>
    </div>
  );
}
