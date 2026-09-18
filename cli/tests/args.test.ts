import { test } from "node:test";
import assert from "node:assert/strict";
import { parseArgs, flagString } from "../src/lib/args";

// ═══════════════════════════════════════════════════════════════
// Юнит-тесты ручного разбора argv (../src/lib/args.ts) — единственная
// нетривиальная логика в CLI, которая не является просто копией
// vscode-extension/src/tools/*, поэтому нуждается в своих тестах.
// ═══════════════════════════════════════════════════════════════

test("parseArgs — позиционные аргументы без флагов", () => {
  const r = parseArgs(["json", "format", '{"a":1}']);
  assert.deepEqual(r.positionals, ["json", "format", '{"a":1}']);
  assert.deepEqual(r.flags, {});
});

test("parseArgs — --flag value забирает следующее значение", () => {
  const r = parseArgs(["salary", "stats", "--role", "qa"]);
  assert.deepEqual(r.positionals, ["salary", "stats"]);
  assert.equal(r.flags.role, "qa");
});

test("parseArgs — --flag=value (через знак равенства)", () => {
  const r = parseArgs(["tools", "get", "--base-url=http://localhost:3000"]);
  assert.equal(r.flags["base-url"], "http://localhost:3000");
});

test("parseArgs — булев флаг без значения (следующий токен тоже флаг)", () => {
  const r = parseArgs(["hash", "sha256", "--verbose", "--file", "in.txt"]);
  assert.equal(r.flags.verbose, true);
  assert.equal(r.flags.file, "in.txt");
});

test("parseArgs — булев флаг в самом конце argv", () => {
  const r = parseArgs(["uuid", "--count"]);
  assert.equal(r.flags.count, true);
});

test("flagString — возвращает строку только для строковых значений", () => {
  const flags = { name: "ci-run", verbose: true as const };
  assert.equal(flagString(flags, "name"), "ci-run");
  assert.equal(flagString(flags, "verbose"), undefined);
  assert.equal(flagString(flags, "missing"), undefined);
});
