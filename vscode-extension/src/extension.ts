import * as vscode from "vscode";
import { formatJson, minifyJson, validateJson } from "./tools/json";
import { encodeBase64, decodeBase64 } from "./tools/base64";
import { decodeJwt, formatJwtDecodeResult } from "./tools/jwt";
import { generateUuid } from "./tools/uuid";
import { generateHash, HASH_ALGORITHMS, HashAlgorithm } from "./tools/hash";
import { encodeUrl, decodeUrl } from "./tools/url";
import { convertTimestamp } from "./tools/timestamp";
import { getInput, replaceSelectionOrInsert, openResultDocument, showError } from "./editorUtil";

// ═══════════════════════════════════════════════════════════════
// Wrench-Branch Toolbox — VS Code-расширение (пункт 8 из
// ROADMAP-BRAINSTORM.md). Вызов части инструментов wrench-branch.vercel.app
// прямо из command palette, без вкладки браузера. Логика инструментов
// переписана как чистые функции в src/tools/* — сайт хранит её внутри
// React-компонентов (components/tools/*.tsx), поэтому напрямую
// переиспользовать нельзя, но она специально написана так, чтобы
// зеркалить поведение исходного веб-инструмента (см. комментарий в
// каждом файле src/tools/*).
//
// Все инструменты работают полностью локально, без сети — публичный
// API wrench-branch (/api/v1/tools) сейчас отдаёт только метаданные
// каталога, а не выполняет сами инструменты (см. /docs#api на сайте),
// так что сетевой вызов тут был бы лишним и медленным для операции,
// которая и так мгновенная на чистом JS.
export function activate(context: vscode.ExtensionContext): void {
  const commands: [string, () => void | Promise<void>][] = [
    ["wrench.formatJson", () => runTextTransform("Format JSON", (s) => resultToOutcome(formatJson(s)))],
    ["wrench.minifyJson", () => runTextTransform("Minify JSON", (s) => resultToOutcome(minifyJson(s)))],
    ["wrench.validateJson", () => runValidate()],
    ["wrench.encodeBase64", () => runTextTransform("Encode Base64", (s) => resultToOutcome(encodeBase64(s)))],
    ["wrench.decodeBase64", () => runTextTransform("Decode Base64", (s) => resultToOutcome(decodeBase64(s)))],
    ["wrench.decodeJwt", () => runDecodeJwt()],
    ["wrench.generateUuid", () => replaceSelectionOrInsert(generateUuid())],
    ["wrench.generateHash", () => runGenerateHash()],
    ["wrench.encodeUrl", () => runTextTransform("URL Encode", (s) => resultToOutcome(encodeUrl(s)))],
    ["wrench.decodeUrl", () => runTextTransform("URL Decode", (s) => resultToOutcome(decodeUrl(s)))],
    ["wrench.convertTimestamp", () => runConvertTimestamp()],
  ];

  for (const [id, handler] of commands) {
    context.subscriptions.push(vscode.commands.registerCommand(id, handler));
  }
}

export function deactivate(): void {
  // Ничего не держим между вызовами команд — деактивировать нечего.
}

// ── Общие обёртки команд ──────────────────────────────────────────

interface Outcome {
  ok: boolean;
  value?: string;
  error?: string;
}

function resultToOutcome(r: { ok: boolean; value?: string; error?: string }): Outcome {
  return r;
}

async function runTextTransform(promptTitle: string, transform: (input: string) => Outcome): Promise<void> {
  const input = await getInput(promptTitle, "Paste or select text to transform");
  if (input === undefined) return; // отменено пользователем
  const outcome = transform(input);
  if (!outcome.ok) {
    showError(outcome.error ?? "Failed.");
    return;
  }
  await replaceSelectionOrInsert(outcome.value ?? "");
}

async function runValidate(): Promise<void> {
  const input = await getInput("Validate JSON", "Paste or select JSON to validate");
  if (input === undefined) return;
  const outcome = validateJson(input);
  if (outcome.ok) {
    void vscode.window.showInformationMessage("Wrench: valid JSON.");
  } else {
    showError(outcome.error ?? "Invalid JSON.");
  }
}

async function runDecodeJwt(): Promise<void> {
  const input = await getInput("Decode JWT", "Paste or select a JWT (header.payload.signature)");
  if (input === undefined) return;
  const result = decodeJwt(input);
  await openResultDocument(formatJwtDecodeResult(result), "jsonc");
  if (!result.ok) showError(result.error ?? "Could not decode this JWT.");
}

async function runGenerateHash(): Promise<void> {
  const algorithm = (await vscode.window.showQuickPick([...HASH_ALGORITHMS], {
    title: "Wrench: Generate Hash — algorithm",
  })) as HashAlgorithm | undefined;
  if (!algorithm) return;
  const input = await getInput(`Generate ${algorithm} Hash`, "Paste or select text to hash");
  if (input === undefined) return;
  const hash = generateHash(input, algorithm);
  await replaceSelectionOrInsert(hash);
  await vscode.env.clipboard.writeText(hash);
  void vscode.window.showInformationMessage(`Wrench: ${algorithm} hash copied to clipboard.`);
}

async function runConvertTimestamp(): Promise<void> {
  const input = await getInput("Convert Timestamp", "Unix timestamp (seconds or ms), or a date string");
  if (input === undefined) return;
  const outcome = convertTimestamp(input);
  if (!outcome.ok) {
    showError(outcome.error ?? "Could not convert this value.");
    return;
  }
  await openResultDocument(outcome.value ?? "", "plaintext");
}
