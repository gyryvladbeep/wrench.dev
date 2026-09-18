// Зеркалит components/tools/Base64Tool.tsx (btoa/atob в браузере) —
// в Node используем Buffer, который дополнительно корректно обрабатывает
// UTF-8 (btoa в браузере падает на не-Latin1 символах, Buffer — нет,
// это небольшое, но чистое улучшение при переносе в расширение).

export interface Base64Result {
  ok: boolean;
  value?: string;
  error?: string;
}

export function encodeBase64(input: string): Base64Result {
  try {
    return { ok: true, value: Buffer.from(input, "utf-8").toString("base64") };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Encoding failed" };
  }
}

export function decodeBase64(input: string): Base64Result {
  try {
    const trimmed = input.trim();
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(trimmed) || trimmed.length % 4 !== 0) {
      return { ok: false, error: "Not valid Base64." };
    }
    return { ok: true, value: Buffer.from(trimmed, "base64").toString("utf-8") };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Decoding failed" };
  }
}
