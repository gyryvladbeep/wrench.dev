// Зеркалит components/tools/UrlEncodeDecodeTool.tsx — компонентное
// кодирование (encodeURIComponent/decodeURIComponent), не кодирование
// целого URL целиком (то не трогает уже валидные "://", "?", "&").

export interface UrlResult {
  ok: boolean;
  value?: string;
  error?: string;
}

export function encodeUrl(input: string): UrlResult {
  return { ok: true, value: encodeURIComponent(input) };
}

export function decodeUrl(input: string): UrlResult {
  try {
    return { ok: true, value: decodeURIComponent(input) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Decoding failed" };
  }
}
