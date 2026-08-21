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

      <p className="mt-4 text-xs text-text-muted">{t.note}</p>
    </div>
  );
}
