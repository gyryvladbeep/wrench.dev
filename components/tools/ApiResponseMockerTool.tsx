"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

type MockFormat = "msw" | "json-server" | "express" | "postman";

const SAMPLE_JSON = `{
  "id": 1,
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "role": "admin",
  "active": true
}`;

function buildMswSnippet(url: string, method: string, status: number, json: string): string {
  return `import { http, HttpResponse } from "msw";

export const handlers = [
  http.${method.toLowerCase()}("${url}", () => {
    return HttpResponse.json(${indent(json)}, { status: ${status} });
  }),
];`;
}

function buildJsonServerSnippet(url: string, json: string): string {
  const route = url.replace(/^\/+/, "").split("/")[0] || "resource";
  return `// db.json
{
  "${route}": ${indent(json)}
}

// Run:
// npx json-server --watch db.json --port 3001
// Then GET http://localhost:3001/${route}`;
}

function buildExpressSnippet(url: string, method: string, status: number, json: string): string {
  return `const express = require("express");
const app = express();

app.${method.toLowerCase()}("${url}", (req, res) => {
  res.status(${status}).json(${indent(json)});
});

app.listen(3001, () => console.log("Mock server on :3001"));`;
}

function buildPostmanSnippet(url: string, method: string, status: number, json: string): string {
  return JSON.stringify({
    name: "Mock response",
    request: { method, url: { raw: url } },
    response: [{
      name: "Mock",
      originalRequest: { method, url: { raw: url } },
      status: "Mocked",
      code: status,
      header: [{ key: "Content-Type", value: "application/json" }],
      body: json,
    }],
  }, null, 2);
}

function indent(json: string): string {
  try {
    const parsed = JSON.parse(json);
    return JSON.stringify(parsed, null, 2).split("\n").join("\n  ").trimStart();
  } catch {
    return json;
  }
}

const FORMATS: { id: MockFormat; label: string; description: string }[] = [
  { id: "msw",         label: "MSW (Mock Service Worker)", description: "Popular for React/frontend testing" },
  { id: "json-server",  label: "json-server",               description: "Zero-code fake REST API from a JSON file" },
  { id: "express",      label: "Express route",             description: "A tiny standalone mock server" },
  { id: "postman",      label: "Postman mock (JSON)",       description: "Import as a saved example response" },
];

export function ApiResponseMockerTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";

  const [url,    setUrl]    = useState("/api/users/:id");
  const [method, setMethod] = useState("GET");
  const [status, setStatus] = useState(200);
  const [json,   setJson]   = useState(SAMPLE_JSON);
  const [format, setFormat] = useState<MockFormat>("msw");

  const isValidJson = useMemo(() => {
    try { JSON.parse(json); return true; } catch { return false; }
  }, [json]);

  const snippet = useMemo(() => {
    if (!isValidJson) return "";
    switch (format) {
      case "msw":         return buildMswSnippet(url, method, status, json);
      case "json-server":  return buildJsonServerSnippet(url, json);
      case "express":      return buildExpressSnippet(url, method, status, json);
      case "postman":      return buildPostmanSnippet(url, method, status, json);
    }
  }, [format, url, method, status, json, isValidJson]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-lg border border-border bg-surface/50 p-4 flex items-start gap-3">
        <span className="text-2xl">🎭</span>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            {isRu ? "Мокер API ответов" : "API Response Mocker"}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {isRu
              ? "Вставь пример JSON ответа — получи готовый сниппет мока для MSW, json-server, Express или Postman."
              : "Paste an example JSON response — get a ready-to-use mock snippet for MSW, json-server, Express or Postman."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left — inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="input-label">{isRu ? "Метод" : "Method"}</label>
              <select value={method} onChange={e => setMethod(e.target.value)}
                className="code-surface w-full rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none">
                {["GET","POST","PUT","PATCH","DELETE"].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="input-label">{isRu ? "URL / путь" : "URL / path"}</label>
              <input value={url} onChange={e => setUrl(e.target.value)} spellCheck={false}
                className="code-surface w-full rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none" />
            </div>
          </div>

          <div>
            <label className="input-label">{isRu ? "Статус код" : "Status code"}</label>
            <div className="flex gap-2 flex-wrap">
              {[200, 201, 400, 401, 404, 500].map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`rounded border px-3 py-1.5 text-xs font-mono transition-colors ${status === s ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-surface-hover"}`}>
                  {s}
                </button>
              ))}
              <input type="number" value={status} onChange={e => setStatus(Number(e.target.value))}
                className="code-surface w-20 rounded border px-2 py-1.5 text-xs font-mono text-text-primary outline-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="input-label mb-0">{isRu ? "Тело ответа (JSON)" : "Response body (JSON)"}</label>
              {!isValidJson && json && (
                <span className="text-[10px] text-red-400">✕ {isRu ? "Невалидный JSON" : "Invalid JSON"}</span>
              )}
            </div>
            <textarea value={json} onChange={e => setJson(e.target.value)}
              rows={10} spellCheck={false}
              className={`code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none ${!isValidJson && json ? "border border-red-500/40" : ""}`} />
          </div>
        </div>

        {/* Right — format selector + output */}
        <div className="space-y-4">
          <div>
            <label className="input-label">{isRu ? "Формат мока" : "Mock format"}</label>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map(f => (
                <button key={f.id} onClick={() => setFormat(f.id)}
                  className={`text-left rounded-lg border p-3 transition-colors ${format === f.id ? "border-accent/40 bg-accent/10" : "border-border bg-surface hover:bg-surface-hover"}`}>
                  <p className={`text-xs font-semibold ${format === f.id ? "text-accent" : "text-text-primary"}`}>{f.label}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{f.description}</p>
                </button>
              ))}
            </div>
          </div>

          {snippet && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="input-label mb-0">{isRu ? "Готовый сниппет" : "Generated snippet"}</label>
                <CopyButton value={snippet} />
              </div>
              <pre className="code-surface rounded-lg p-4 font-mono text-xs text-text-primary overflow-auto max-h-96 leading-relaxed">
                {snippet}
              </pre>
            </div>
          )}

          {!snippet && !isValidJson && json && (
            <div className="code-surface rounded-lg flex items-center justify-center py-16 text-center">
              <p className="text-sm text-text-muted">{isRu ? "Исправь JSON чтобы увидеть сниппет" : "Fix the JSON to see the snippet"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}