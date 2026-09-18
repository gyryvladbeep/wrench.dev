// ═══════════════════════════════════════════════════════════════
// Чистые функции, зеркалят логику components/tools/JsonFormatterTool.tsx
// и JsonMinifyTool.tsx из основного репозитория (без React/DOM — ни
// CLI, ни VS Code-расширение не имеют доступа к тем компонентам,
// поэтому логика переписана заново на чистом JS/TS). Байт-в-байт та
// же копия живёт в vscode-extension/src/tools/json.ts — см. комментарий
// в cli/README.md о том, почему это намеренное дублирование, а не
// общий npm-пакет.
// ═══════════════════════════════════════════════════════════════

export interface JsonResult {
  ok: boolean;
  value?: string;
  error?: string;
}

export function formatJson(input: string, indent = 2): JsonResult {
  try {
    const parsed = JSON.parse(input);
    return { ok: true, value: JSON.stringify(parsed, null, indent) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invalid JSON" };
  }
}

export function minifyJson(input: string): JsonResult {
  try {
    const parsed = JSON.parse(input);
    return { ok: true, value: JSON.stringify(parsed) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invalid JSON" };
  }
}

export function validateJson(input: string): JsonResult {
  try {
    JSON.parse(input);
    return { ok: true, value: "Valid JSON" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invalid JSON" };
  }
}
