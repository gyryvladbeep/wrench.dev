"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { analyzeManifest } from "@/lib/mobile/manifest";
import { FindingsList } from "./mobile/FindingsList";

const SAMPLE = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.shop" android:versionCode="12" android:versionName="1.2.0">
    <uses-sdk android:minSdkVersion="26" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <application android:allowBackup="true" android:usesCleartextTraffic="true">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <activity android:name=".LinkActivity">
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="shop.example.com" android:pathPrefix="/p" />
            </intent-filter>
        </activity>
        <service android:name=".SyncService" android:exported="true" />
    </application>
</manifest>`;

const KIND_STYLE = {
  dangerous: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  special: "border-red-500/30 bg-red-500/10 text-red-300",
  normal: "border-border bg-canvas text-text-muted",
} as const;

export function AndroidManifestAnalyzerTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [text, setText] = useState(SAMPLE);
  const result = useMemo(() => analyzeManifest(text), [text]);

  const kindLabel = (k: keyof typeof KIND_STYLE) =>
    k === "dangerous" ? (isRu ? "runtime" : "runtime") : k === "special" ? (isRu ? "особый доступ" : "special access") : (isRu ? "обычное" : "normal");

  const summaryRows: [string, string][] = [
    [isRu ? "Пакет" : "Package", result.summary.package],
    ["versionName", result.summary.versionName],
    ["versionCode", result.summary.versionCode],
    ["minSdk", result.summary.minSdk],
    ["targetSdk", result.summary.targetSdk],
  ];

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <label htmlFor="manifest-input" className="input-label">AndroidManifest.xml</label>
        <textarea id="manifest-input" value={text} onChange={(e) => setText(e.target.value)} rows={12} spellCheck={false}
          className="code-surface w-full rounded-lg px-3 py-2.5 font-mono text-xs text-text-primary outline-none" />
      </div>

      {!result.ok ? (
        <p role="alert" data-testid="manifest-error" className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-300">
          {isRu ? "Не удалось разобрать манифест: " : "Could not parse the manifest: "}{result.error}
        </p>
      ) : (
        <>
          <section className="rounded-lg border border-border bg-surface p-4" data-testid="manifest-summary">
            <h3 className="mb-2 text-sm font-semibold text-text-primary">{isRu ? "Сводка" : "Summary"}</h3>
            <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {summaryRows.map(([k, v]) => (
                <div key={k} className="flex gap-2"><dt className="text-text-muted">{k}:</dt><dd className="font-mono text-text-primary">{v || "-"}</dd></div>
              ))}
            </dl>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-text-primary">{isRu ? "Результаты проверки" : "Findings"}</h3>
            <FindingsList findings={result.findings} isRu={isRu} testId="manifest-findings" emptyText={isRu ? "Замечаний нет." : "No issues found."} />
          </section>

          <section className="space-y-2" data-testid="manifest-permissions">
            <h3 className="text-sm font-semibold text-text-primary">{isRu ? "Разрешения" : "Permissions"} ({result.permissions.length})</h3>
            <ul className="flex flex-wrap gap-2">
              {result.permissions.map((p) => (
                <li key={p.name} className={`rounded border px-2 py-1 font-mono text-xs ${KIND_STYLE[p.kind]}`} data-kind={p.kind}>
                  {p.name.replace("android.permission.", "")} <span className="opacity-70">({kindLabel(p.kind)})</span>
                </li>
              ))}
              {result.permissions.length === 0 && <li className="text-sm text-text-muted">{isRu ? "Разрешений нет." : "No permissions declared."}</li>}
            </ul>
          </section>

          <section className="space-y-2" data-testid="manifest-components">
            <h3 className="text-sm font-semibold text-text-primary">{isRu ? "Компоненты" : "Components"} ({result.components.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted">
                    <th className="px-3 py-2 font-medium">{isRu ? "Тип" : "Type"}</th>
                    <th className="px-3 py-2 font-medium">{isRu ? "Имя" : "Name"}</th>
                    <th className="px-3 py-2 font-medium">exported</th>
                    <th className="px-3 py-2 font-medium">{isRu ? "Разрешение" : "Permission"}</th>
                    <th className="px-3 py-2 font-medium">{isRu ? "Фильтры" : "Filters"}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.components.map((c, i) => (
                    <tr key={i} className="border-t border-border" data-component={c.name}>
                      <td className="px-3 py-2 text-text-muted">{c.type}</td>
                      <td className="px-3 py-2 font-mono text-text-primary">{c.name}{c.isLauncher ? " (launcher)" : ""}</td>
                      <td className="px-3 py-2 font-mono text-text-primary">{c.exported}</td>
                      <td className="px-3 py-2 font-mono text-text-muted">{c.permission || "-"}</td>
                      <td className="px-3 py-2 text-text-muted">{c.filters}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2" data-testid="manifest-deeplinks">
            <h3 className="text-sm font-semibold text-text-primary">{isRu ? "Deep link" : "Deep links"} ({result.deepLinks.length})</h3>
            {result.deepLinks.length === 0 ? (
              <p className="text-sm text-text-muted">{isRu ? "Фильтров VIEW + BROWSABLE нет." : "No VIEW + BROWSABLE intent filters."}</p>
            ) : (
              <ul className="space-y-1 font-mono text-sm text-text-primary">
                {result.deepLinks.map((l) => <li key={l}>{l}</li>)}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
