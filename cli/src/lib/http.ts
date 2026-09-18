// ═══════════════════════════════════════════════════════════════
// Тонкая обёртка над глобальным fetch (Node 18+, см. engines в
// package.json) — единая точка, где разбирается {error: "..."}
// тело, которое отдают все app/api/v1/* роуты сайта при ошибке
// (см. лежащий рядом код app/api/v1/**/route.ts — тот же формат
// ошибки везде), чтобы CLI печатал понятное сообщение, а не голый
// "Unexpected token" от JSON.parse на HTML-странице 500-й ошибки.
// ═══════════════════════════════════════════════════════════════

export class CliHttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "CliHttpError";
  }
}

export interface RequestOptions {
  method?: "GET" | "POST";
  token?: string;
  body?: unknown;
}

export async function requestJson<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (err) {
    throw new CliHttpError(0, `Network error reaching ${url}: ${err instanceof Error ? err.message : String(err)}`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body ? String((body as { error: unknown }).error) : `HTTP ${response.status}`;
    throw new CliHttpError(response.status, message);
  }

  return body as T;
}
