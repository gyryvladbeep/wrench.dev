"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ═══════════════════════════════════════════════════════════════
// Security findings — rule-based, static checks on the decoded
// header/payload (no signature verification, this tool never sees
// the secret). Severity scale and visual treatment mirror
// HttpSecurityHeadersTool's SEVERITY_META so the two "check my
// thing" tools feel like the same product.
// ═══════════════════════════════════════════════════════════════
type Severity = "critical" | "high" | "medium" | "info";

interface Finding {
  id: string;
  severity: Severity;
  message: string;
}

const SEVERITY_STYLE: Record<Severity, { color: string; bg: string; badge: string }> = {
  critical: { color: "text-red-400",    bg: "border-red-500/30 bg-red-500/5",       badge: "bg-red-500" },
  high:     { color: "text-orange-400", bg: "border-orange-500/30 bg-orange-500/5", badge: "bg-orange-500" },
  medium:   { color: "text-amber-400",  bg: "border-amber-500/30 bg-amber-500/5",   badge: "bg-amber-500" },
  info:     { color: "text-blue-400",   bg: "border-blue-500/30 bg-blue-500/5",     badge: "bg-blue-500" },
};

const YEAR_SECONDS = 365 * 24 * 60 * 60;

export function JwtDecoderTool({ dict }: { dict: Dictionary }) {
  const [token, setToken] = useState(SAMPLE_JWT);
  const t = dict.tools.jwt;

  const decoded = useMemo(() => {
    const parts = token.trim().split(".");
    if (parts.length !== 3) {
      return { ok: false as const, message: t.threePartsError };
    }
    try {
      const header = JSON.parse(base64UrlDecode(parts[0]));
      const payload = JSON.parse(base64UrlDecode(parts[1]));
      return { ok: true as const, header, payload };
    } catch {
      return { ok: false as const, message: t.decodeError };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  let expiryNote: string | null = null;
  if (decoded.ok && typeof decoded.payload?.exp === "number") {
    const expDate = new Date(decoded.payload.exp * 1000);
    const expired = expDate.getTime() < Date.now();
    expiryNote = `${expired ? t.expired : t.expires} ${expDate.toLocaleString()}`;
  }

  const findings = useMemo<Finding[]>(() => {
    if (!decoded.ok) return [];
    const list: Finding[] = [];
    const alg = typeof decoded.header?.alg === "string" ? decoded.header.alg : "";
    const payload = decoded.payload ?? {};
    const exp = typeof payload.exp === "number" ? payload.exp : null;
    const iat = typeof payload.iat === "number" ? payload.iat : null;
    const nbf = typeof payload.nbf === "number" ? payload.nbf : null;

    if (alg.toLowerCase() === "none") {
      list.push({ id: "alg-none", severity: "critical", message: t.findingAlgNone });
    }
    if (exp === null) {
      list.push({ id: "no-exp", severity: "medium", message: t.findingNoExpiry });
    }
    if (exp !== null && iat !== null && exp <= iat) {
      list.push({ id: "exp-before-iat", severity: "high", message: t.findingExpBeforeIat });
    }
    if (exp !== null && iat !== null && exp > iat && exp - iat > YEAR_SECONDS) {
      list.push({ id: "long-lifetime", severity: "info", message: t.findingLongLifetime });
    }
    if (nbf !== null && nbf * 1000 > Date.now()) {
      list.push({ id: "future-nbf", severity: "info", message: t.findingFutureNbf });
    }
    if (/^hs(256|384|512)$/i.test(alg)) {
      list.push({ id: "symmetric-alg", severity: "info", message: t.findingSymmetricAlg });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decoded]);

  function severityLabel(s: Severity): string {
    if (s === "critical") return t.severityCritical;
    if (s === "high") return t.severityHigh;
    if (s === "medium") return t.severityMedium;
    return t.severityInfo;
  }

  return (
    <div>
      <label htmlFor="jwt-input" className="mb-1 block text-xs font-medium text-text-muted">
        {t.label}
      </label>
      <textarea
        id="jwt-input"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        spellCheck={false}
        className="code-surface h-24 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"
      />

      {!decoded.ok && <p className="mt-2 text-sm text-red-400">{decoded.message}</p>}

      {decoded.ok && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">{t.header}</span>
              <CopyButton
                value={JSON.stringify(decoded.header, null, 2)}
                label={dict.common.copy}
                copiedLabel={dict.common.copied}
              />
            </div>
            <pre className="code-surface h-40 overflow-auto rounded-[10px] p-3 font-mono text-sm text-text-primary">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">{t.payload}</span>
              <CopyButton
                value={JSON.stringify(decoded.payload, null, 2)}
                label={dict.common.copy}
                copiedLabel={dict.common.copied}
              />
            </div>
            <pre className="code-surface h-40 overflow-auto rounded-[10px] p-3 font-mono text-sm text-text-primary">
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
            {expiryNote && <p className="mt-2 text-xs text-text-muted">{expiryNote}</p>}
          </div>
        </div>
      )}

      {decoded.ok && (
        <div className="mt-4">
          <span className="mb-1.5 block text-xs font-medium text-text-muted">{t.securityTitle}</span>
          {findings.length === 0 ? (
            <p className="rounded-[10px] border border-border bg-surface px-3 py-2 text-xs text-text-muted">
              {t.noSecurityIssues}
            </p>
          ) : (
            <div className="space-y-1.5">
              {findings.map((f) => {
                const style = SEVERITY_STYLE[f.severity];
                return (
                  <div key={f.id} className={`rounded-[10px] border px-3 py-2 ${style.bg}`}>
                    <span className={`rounded px-1.5 py-px text-[9px] font-bold text-white ${style.badge}`}>
                      {severityLabel(f.severity)}
                    </span>
                    <p className={`mt-1 text-xs ${style.color}`}>{f.message}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-text-muted">{t.note}</p>
    </div>
  );
}
