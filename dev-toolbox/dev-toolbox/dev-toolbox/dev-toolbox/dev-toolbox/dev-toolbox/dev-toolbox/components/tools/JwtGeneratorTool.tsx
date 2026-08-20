"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { ToolShell } from "./ToolShell";

// Pure-browser HMAC-SHA256 JWT generator
async function signJwt(payload: Record<string, unknown>, secret: string, alg: string): Promise<string> {
  const header = { alg, typ: "JWT" };
  const b64url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");

  const headerB64  = b64url(header);
  const payloadB64 = b64url(payload);
  const data       = `${headerB64}.${payloadB64}`;

  const algMap: Record<string, string> = { HS256:"SHA-256", HS384:"SHA-384", HS512:"SHA-512" };
  const shaAlg = algMap[alg] ?? "SHA-256";

  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name:"HMAC", hash:shaAlg }, false, ["sign"]
  );
  const sig   = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  return `${data}.${sigB64}`;
}

const DEFAULT_PAYLOAD = `{
  "sub": "1234567890",
  "name": "Ada Lovelace",
  "role": "admin",
  "iat": ${Math.floor(Date.now()/1000)},
  "exp": ${Math.floor(Date.now()/1000) + 3600}
}`;

export function JwtGeneratorTool({ dict }: { dict: Dictionary }) {
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [secret,  setSecret]  = useState("your-256-bit-secret");
  const [alg,     setAlg]     = useState("HS256");
  const [result,  setResult]  = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const isRu = dict.common.copy === "Копировать";

  async function generate() {
    setError(""); setResult(""); setLoading(true);
    try {
      const parsed = JSON.parse(payload);
      const jwt    = await signJwt(parsed, secret, alg);
      setResult(jwt);
    } catch(e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally { setLoading(false); }
  }

  const parts = result.split(".");

  return (
    <ToolShell onClear={() => { setResult(""); setError(""); }} onRun={generate}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="input-label">{isRu ? "Алгоритм" : "Algorithm"}</label>
            <div className="flex gap-1">
              {["HS256","HS384","HS512"].map((a) => (
                <button key={a} onClick={() => setAlg(a)}
                  className={`flex-1 rounded-[8px] py-1.5 text-xs transition-colors ${alg===a?"bg-accent text-accent-fg":"bg-surface border border-border text-text-muted hover:bg-surface-hover"}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="input-label">{isRu ? "Секрет (secret)" : "Secret"}</label>
            <input value={secret} onChange={(e) => setSecret(e.target.value)} type="password"
              className="code-surface w-full rounded-[10px] px-3 py-2 font-mono text-sm text-text-primary outline-none" />
          </div>
        </div>

        <div>
          <label className="input-label">{isRu ? "Payload (JSON)" : "Payload (JSON)"}</label>
          <textarea value={payload} onChange={(e) => setPayload(e.target.value)} spellCheck={false} rows={8}
            className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
        </div>

        <button onClick={generate} disabled={loading || !secret}
          className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent/90 disabled:opacity-50 transition-colors">
          {loading ? (isRu ? "Подписываю…" : "Signing…") : (isRu ? "Сгенерировать JWT" : "Generate JWT")}
        </button>

        {error && <div className="text-sm text-red-400">{error}</div>}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="input-label">JWT</label>
              <CopyButton value={result} />
            </div>
            <div className="code-surface rounded-[10px] p-3 font-mono text-xs break-all">
              <span className="text-red-400">{parts[0]}</span>
              <span className="text-text-muted">.</span>
              <span className="text-green-400">{parts[1]}</span>
              <span className="text-text-muted">.</span>
              <span className="text-blue-400">{parts[2]}</span>
            </div>
            <div className="flex gap-4 text-xs text-text-muted">
              <span className="text-red-400">■ Header</span>
              <span className="text-green-400">■ Payload</span>
              <span className="text-blue-400">■ Signature</span>
            </div>
            <p className="text-xs text-text-muted">
              {isRu ? "Только для разработки и тестирования. Никогда не используйте реальные секреты в браузере." : "For development and testing only. Never use real production secrets in the browser."}
            </p>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
