import { test, expect } from "@playwright/test";
import { JwtDecoderPage } from "./pages/JwtDecoderPage";

const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

// base64url-кодирование объекта — как base64UrlDecode() в компоненте, но в
// обратную сторону, для сборки собственных тестовых JWT (в Node, через Buffer,
// поскольку тест выполняется не в браузере).
function base64UrlEncode(obj: object): string {
  const json = JSON.stringify(obj);
  return Buffer.from(json, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function makeJwt(header: object, payload: object): string {
  return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.fakesignature`;
}

test.describe("JWT Decoder", () => {
  let tool: JwtDecoderPage;

  test.beforeEach(async ({ page }) => {
    tool = new JwtDecoderPage(page);
    await tool.goto();
  });

  test("по умолчанию корректно декодирует header и payload примера JWT", async () => {
    await expect(tool.headerPre).toHaveText(JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2));
    await expect(tool.payloadPre).toHaveText(
      JSON.stringify({ sub: "1234567890", name: "Ada Lovelace", iat: 1516239022 }, null, 2)
    );
    await expect(tool.expiryNote).toBeHidden(); // в примере нет claim "exp"
  });

  test("токен не из 3 частей показывает ошибку про формат", async () => {
    await tool.setToken("not.a.valid.jwt.with.too.many.parts");
    await expect(tool.errorMessage).toHaveText(
      "A JWT should have 3 parts separated by dots (header.payload.signature)."
    );
  });

  test("3 части, но невалидный base64/JSON — показывает ошибку декодирования", async () => {
    await tool.setToken("notbase64.notbase64.signature");
    await expect(tool.errorMessage).toHaveText("Could not decode this token — check that it's a valid JWT.");
  });

  test("собственный JWT с истёкшим exp — заметка 'Expired'", async () => {
    const expiredExp = Math.floor(Date.now() / 1000) - 3600; // час назад
    const token = makeJwt({ alg: "HS256", typ: "JWT" }, { sub: "1", exp: expiredExp });
    await tool.setToken(token);

    await expect(tool.expiryNote).toBeVisible();
    await expect(tool.expiryNote).toContainText("Expired");
  });

  test("собственный JWT с будущим exp — заметка 'Expires'", async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // через час
    const token = makeJwt({ alg: "HS256", typ: "JWT" }, { sub: "1", exp: futureExp });
    await tool.setToken(token);

    await expect(tool.expiryNote).toBeVisible();
    await expect(tool.expiryNote).toContainText("Expires");
  });

  test("собственный валидный JWT с произвольным payload декодируется 1-в-1", async () => {
    const header = { alg: "HS256", typ: "JWT" };
    const payload = { userId: 42, role: "qa-engineer" };
    const token = makeJwt(header, payload);
    await tool.setToken(token);

    await expect(tool.headerPre).toHaveText(JSON.stringify(header, null, 2));
    await expect(tool.payloadPre).toHaveText(JSON.stringify(payload, null, 2));
  });
});
