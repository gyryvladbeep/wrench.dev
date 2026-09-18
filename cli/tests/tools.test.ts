import { test } from "node:test";
import assert from "node:assert/strict";
import { formatJson, minifyJson, validateJson } from "../src/tools/json";
import { encodeBase64, decodeBase64 } from "../src/tools/base64";
import { decodeJwt, formatJwtDecodeResult } from "../src/tools/jwt";
import { generateUuid } from "../src/tools/uuid";
import { generateHash } from "../src/tools/hash";
import { encodeUrl, decodeUrl } from "../src/tools/url";
import { convertTimestamp } from "../src/tools/timestamp";

// ═══════════════════════════════════════════════════════════════
// Юнит-тесты чистых функций src/tools/* — та же логика, что уже
// проверена в vscode-extension/tests/tools.test.ts (байт-в-байт
// копия исходников, см. комментарий в src/tools/json.ts), тесты
// продублированы здесь по той же причине — независимый пакет,
// который должен проходить свою собственную проверку без ссылки
// на соседний.
// ═══════════════════════════════════════════════════════════════

test("formatJson — валидный JSON форматируется с отступом", () => {
  const r = formatJson('{"a":1,"b":[1,2]}');
  assert.equal(r.ok, true);
  assert.equal(r.value, '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}');
});

test("formatJson — невалидный JSON даёт ok:false с сообщением", () => {
  const r = formatJson("{not json}");
  assert.equal(r.ok, false);
  assert.ok(r.error);
});

test("minifyJson — убирает пробелы/переносы", () => {
  const r = minifyJson('{\n  "a": 1\n}');
  assert.equal(r.ok, true);
  assert.equal(r.value, '{"a":1}');
});

test("validateJson — валидный/невалидный", () => {
  assert.equal(validateJson("[1,2,3]").ok, true);
  assert.equal(validateJson("[1,2,").ok, false);
});

test("encodeBase64/decodeBase64 — round-trip, включая не-ASCII", () => {
  const input = "hello, мир! 🔧";
  const encoded = encodeBase64(input);
  assert.equal(encoded.ok, true);
  const decoded = decodeBase64(encoded.value!);
  assert.equal(decoded.ok, true);
  assert.equal(decoded.value, input);
});

test("decodeBase64 — отклоняет не-Base64 строку", () => {
  const r = decodeBase64("not base64 at all !!!");
  assert.equal(r.ok, false);
});

test("decodeJwt — декодирует header/payload известного тестового токена", () => {
  // { "alg": "HS256", "typ": "JWT" } . { "sub": "1234567890", "name": "Ada Lovelace" }
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSJ9.sig";
  const r = decodeJwt(token);
  assert.equal(r.ok, true);
  assert.deepEqual(r.header, { alg: "HS256", typ: "JWT" });
  assert.deepEqual(r.payload, { sub: "1234567890", name: "Ada Lovelace" });
  assert.match(formatJwtDecodeResult(r), /Ada Lovelace/);
});

test("decodeJwt — отклоняет строку без трёх частей", () => {
  const r = decodeJwt("not.a.jwt.token.really");
  assert.equal(r.ok, false);
});

test("generateUuid — формат UUID v4", () => {
  const id = generateUuid();
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test("generateHash — известные хэши для 'abc'", () => {
  assert.equal(generateHash("abc", "MD5"), "900150983cd24fb0d6963f7d28e17f72");
  assert.equal(generateHash("abc", "SHA-1"), "a9993e364706816aba3e25717850c26c9cd0d89d");
  assert.equal(
    generateHash("abc", "SHA-256"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  );
});

test("encodeUrl/decodeUrl — round-trip спецсимволов", () => {
  const input = "a b&c=d/e?f";
  const encoded = encodeUrl(input);
  assert.equal(encoded.ok, true);
  const decoded = decodeUrl(encoded.value!);
  assert.equal(decoded.value, input);
});

test("convertTimestamp — секунды -> дата (авто-детект по длине)", () => {
  const r = convertTimestamp("1700000000");
  assert.equal(r.ok, true);
  assert.match(r.value!, /ISO:\s+2023-11-14T22:13:20\.000Z/);
});

test("convertTimestamp — миллисекунды -> дата (13+ цифр)", () => {
  const r = convertTimestamp("1700000000000");
  assert.equal(r.ok, true);
  assert.match(r.value!, /ISO:\s+2023-11-14T22:13:20\.000Z/);
});

test("convertTimestamp — дата (ISO) -> unix seconds/millis", () => {
  const r = convertTimestamp("2023-11-14T22:13:20.000Z");
  assert.equal(r.ok, true);
  assert.match(r.value!, /Seconds: 1700000000/);
  assert.match(r.value!, /Millis:  1700000000000/);
});

test("convertTimestamp — мусорный ввод отклоняется", () => {
  const r = convertTimestamp("not a date and not digits either!!");
  assert.equal(r.ok, false);
});
