"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

type Lang = "fetch" | "axios" | "python" | "powershell";

interface ParsedCurl {
  method: string;
  url: string;
  headers: [string, string][];
  data: string | null;
  dataIsJson: boolean;
  user: string | null;
}

const DEFAULT_CURL = `curl -X POST https://api.example.com/v1/users \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGciOi..." \\
  -d '{"name":"Ada Lovelace","role":"admin"}'`;

function tokenize(cmd: string): string[] {
  const tokens: string[] = [];
  let cur = "";
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (c === "\\" && quote === '"' && i + 1 < cmd.length) cur += cmd[++i];
      else cur += c;
    } else if (c === '"' || c === "'") {
      quote = c as '"' | "'";
    } else if (/\s/.test(c)) {
      if (cur) { tokens.push(cur); cur = ""; }
    } else {
      cur += c;
    }
  }
  if (cur) tokens.push(cur);
  return tokens;
}

function parseCurl(raw: string): ParsedCurl | null {
  const cmd = raw.trim().replace(/\\\r?\n/g, " ");
  if (!cmd) return null;
  const tokens = tokenize(cmd);
  let i = 0;
  if (tokens[i] && tokens[i].toLowerCase() === "curl") i++;

  let method = "";
  let url = "";
  const headers: [string, string][] = [];
  let data: string | null = null;
  let user: string | null = null;
  let isGet = false;

  const TAKES_ARG: Record<string, "method" | "header" | "data" | "user" | "cookie" | "ua" | "referer" | "skip"> = {
    "-X": "method", "--request": "method",
    "-H": "header", "--header": "header",
    "-d": "data", "--data": "data", "--data-raw": "data", "--data-binary": "data", "--data-ascii": "data",
    "-F": "data", "--form": "data",
    "-u": "user", "--user": "user",
    "-b": "cookie", "--cookie": "cookie",
    "-A": "ua", "--user-agent": "ua",
    "-e": "referer", "--referer": "referer",
  };
  const NO_ARG_FLAGS = new Set(["--compressed", "-L", "--location", "-s", "--silent", "-v", "--verbose", "-i", "--include", "-k", "--insecure"]);

  while (i < tokens.length) {
    const t = tokens[i];
    if (t === "-G" || t === "--get") { isGet = true; i++; continue; }
    if (NO_ARG_FLAGS.has(t)) { i++; continue; }
    const kind = TAKES_ARG[t];
    if (kind) {
      const val = tokens[++i] ?? "";
      if (kind === "method") method = val;
      else if (kind === "header") {
        const idx = val.indexOf(":");
        if (idx > -1) headers.push([val.slice(0, idx).trim(), val.slice(idx + 1).trim()]);
      } else if (kind === "data") data = data ? `${data}&${val}` : val;
      else if (kind === "user") user = val;
      else if (kind === "cookie") headers.push(["Cookie", val]);
      else if (kind === "ua") headers.push(["User-Agent", val]);
      else if (kind === "referer") headers.push(["Referer", val]);
      i++;
      continue;
    }
    if (t.startsWith("-")) { i++; continue; }
    if (!url) url = t;
    i++;
  }

  if (isGet && data) {
    url += (url.includes("?") ? "&" : "?") + data;
    data = null;
  }
  if (!method) method = data ? "POST" : "GET";

  let dataIsJson = false;
  if (data) { try { JSON.parse(data); dataIsJson = true; } catch { dataIsJson = false; } }

  return { method: method.toUpperCase(), url, headers, data, dataIsJson, user };
}

function prettyJson(dataStr: string): string {
  try { return JSON.stringify(JSON.parse(dataStr), null, 2); } catch { return dataStr; }
}
function jsonToPython(dataStr: string): string {
  try {
    const s = JSON.stringify(JSON.parse(dataStr), null, 4);
    return s.replace(/\btrue\b/g, "True").replace(/\bfalse\b/g, "False").replace(/\bnull\b/g, "None");
  } catch { return `"${dataStr}"`; }
}

/** Base64-encodes "user:pass" for a literal Basic auth header value. Browser-only (btoa). */
function basicAuthHeader(user: string): string | null {
  try { return `Basic ${btoa(user)}`; } catch { return null; }
}

function toFetch(p: ParsedCurl): string {
  const headerEntries = [...p.headers];
  if (p.user) {
    const auth = basicAuthHeader(p.user);
    if (auth) headerEntries.push(["Authorization", auth]);
  }
  const opts: string[] = [`method: "${p.method}"`];
  if (headerEntries.length) opts.push(`headers: {\n${headerEntries.map(([k, v]) => `    "${k}": "${v}"`).join(",\n")}\n  }`);
  if (p.data) opts.push(`body: ${p.dataIsJson ? `JSON.stringify(${prettyJson(p.data)})` : JSON.stringify(p.data)}`);
  return `fetch("${p.url}", {\n  ${opts.join(",\n  ")}\n})\n  .then((res) => res.json())\n  .then((data) => console.log(data));`;
}

function toAxios(p: ParsedCurl): string {
  const method = p.method.toLowerCase();
  const configParts: string[] = [];
  if (p.headers.length) configParts.push(`headers: {\n${p.headers.map(([k, v]) => `    "${k}": "${v}"`).join(",\n")}\n  }`);
  if (p.user) {
    const [u, pw] = p.user.split(":");
    configParts.push(`auth: { username: "${u}", password: "${pw ?? ""}" }`);
  }
  const dataArg = p.data ? (p.dataIsJson ? prettyJson(p.data) : JSON.stringify(p.data)) : "undefined";
  const callArgs = [`"${p.url}"`];
  if (["post", "put", "patch"].includes(method)) {
    callArgs.push(dataArg);
    if (configParts.length) callArgs.push(`{\n  ${configParts.join(",\n  ")}\n}`);
  } else if (configParts.length) {
    callArgs.push(`{\n  ${configParts.join(",\n  ")}\n}`);
  }
  return [
    `const axios = require("axios");`,
    ``,
    `axios.${method}(${callArgs.join(", ")})`,
    `  .then((res) => console.log(res.data))`,
    `  .catch((err) => console.error(err));`,
  ].join("\n");
}

function toPython(p: ParsedCurl): string {
  const lines = [`import requests`, ``];
  if (p.headers.length) {
    lines.push(`headers = {`);
    for (const [k, v] of p.headers) lines.push(`    "${k}": "${v}",`);
    lines.push(`}`, ``);
  }
  if (p.data) {
    lines.push(p.dataIsJson ? `json_data = ${jsonToPython(p.data)}` : `data = "${p.data.replace(/"/g, '\\"')}"`, ``);
  }
  const args: string[] = [`"${p.url}"`];
  if (p.headers.length) args.push("headers=headers");
  if (p.data) args.push(p.dataIsJson ? "json=json_data" : "data=data");
  if (p.user) {
    const [u, pw] = p.user.split(":");
    args.push(`auth=("${u}", "${pw ?? ""}")`);
  }
  lines.push(`response = requests.${p.method.toLowerCase()}(${args.join(", ")})`);
  lines.push(`print(response.status_code, response.text)`);
  return lines.join("\n");
}

function toPowerShell(p: ParsedCurl): string {
  const headerEntries = [...p.headers];
  if (p.user) {
    const auth = basicAuthHeader(p.user);
    if (auth) headerEntries.push(["Authorization", auth]);
  }
  const lines: string[] = [];
  if (headerEntries.length) {
    lines.push(`$headers = @{`);
    for (const [k, v] of headerEntries) lines.push(`    "${k}" = "${v}"`);
    lines.push(`}`, ``);
  }
  const args = [`-Uri "${p.url}"`, `-Method ${p.method}`];
  if (headerEntries.length) args.push("-Headers $headers");
  if (p.data) args.push(`-Body '${p.data.replace(/'/g, "''")}'`);
  if (p.dataIsJson) args.push(`-ContentType "application/json"`);
  lines.push(`Invoke-RestMethod ${args.join(" \`\n  ")}`);
  return lines.join("\n");
}

const GENERATORS: Record<Lang, (p: ParsedCurl) => string> = {
  fetch: toFetch, axios: toAxios, python: toPython, powershell: toPowerShell,
};
const LANG_LABEL: Record<Lang, string> = { fetch: "JavaScript (fetch)", axios: "Node.js (axios)", python: "Python (requests)", powershell: "PowerShell" };

export function CurlToCodeConverterTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";
  const [input, setInput] = useState(DEFAULT_CURL);
  const [lang, setLang] = useState<Lang>("fetch");

  const parsed = useMemo(() => {
    try { return parseCurl(input); } catch { return null; }
  }, [input]);

  const code = useMemo(() => (parsed ? GENERATORS[lang](parsed) : ""), [parsed, lang]);

  return (
    <div className="space-y-4">
      <div>
        <label className="input-label">{isRu ? "Команда curl" : "curl command"}</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} rows={6}
          className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
      </div>

      {parsed ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted">
          <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono font-medium text-accent">{parsed.method}</span>
          <span className="truncate font-mono">{parsed.url || (isRu ? "(URL не найден)" : "(no URL found)")}</span>
          {parsed.headers.length > 0 && <span className="ml-auto shrink-0">{parsed.headers.length} {isRu ? "заголовков" : "headers"}</span>}
        </div>
      ) : (
        <p className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-400">
          {isRu ? "Вставьте команду curl" : "Paste a curl command"}
        </p>
      )}

      <div className="flex flex-wrap gap-1 rounded-[10px] border border-border bg-surface p-1">
        {(Object.keys(LANG_LABEL) as Lang[]).map((l) => (
          <button key={l} onClick={() => setLang(l)}
            className={`rounded-[8px] px-3 py-1.5 text-sm font-medium transition-colors ${lang === l ? "bg-accent text-accent-fg" : "text-text-muted hover:text-text-primary"}`}>
            {LANG_LABEL[l]}
          </button>
        ))}
      </div>

      {code && (
        <div className="relative">
          <pre className="code-surface overflow-x-auto rounded-[10px] p-3 font-mono text-sm text-text-primary whitespace-pre">{code}</pre>
          <span className="absolute right-2 top-2"><CopyButton value={code} iconOnly /></span>
        </div>
      )}
    </div>
  );
}
