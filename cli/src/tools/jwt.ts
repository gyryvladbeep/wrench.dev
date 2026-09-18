// Зеркалит components/tools/JwtDecoderTool.tsx: декодирует header/payload
// (base64url), НЕ проверяет подпись — тот же принцип "decoder, not
// verifier", что у веб-инструмента.

export interface JwtDecodeResult {
  ok: boolean;
  header?: unknown;
  payload?: unknown;
  error?: string;
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64").toString("utf-8");
}

export function decodeJwt(token: string): JwtDecodeResult {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return { ok: false, error: "Not a JWT — expected 3 dot-separated parts (header.payload.signature)." };
  }
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return { ok: true, header, payload };
  } catch {
    return { ok: false, error: "Could not decode this token — check it's a valid JWT." };
  }
}

export function formatJwtDecodeResult(result: JwtDecodeResult): string {
  if (!result.ok) return `// ${result.error}`;
  return [
    "// header",
    JSON.stringify(result.header, null, 2),
    "",
    "// payload",
    JSON.stringify(result.payload, null, 2),
  ].join("\n");
}
