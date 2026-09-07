import { test, expect } from "@playwright/test";
import { createHmac } from "crypto";
import { JwtGeneratorPage } from "./pages/JwtGeneratorPage";

// Воспроизводим base64url-кодирование и HMAC-подпись так же, как signJwt()
// в components/tools/JwtGeneratorTool.tsx, но через Node-модуль crypto
// (тест выполняется не в браузере) — чтобы независимо проверить, что
// подпись, которую сгенерировала страница, действительно корректна.
function b64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf-8") : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function expectedJwt(payload: unknown, secret: string, alg: "HS256" | "HS384" | "HS512"): string {
  const header = { alg, typ: "JWT" };
  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const shaMap = { HS256: "sha256", HS384: "sha384", HS512: "sha512" } as const;
  const sig = createHmac(shaMap[alg], secret).update(data).digest();
  return `${data}.${b64url(sig)}`;
}

test.describe("JWT Generator", () => {
  let tool: JwtGeneratorPage;

  test.beforeEach(async ({ page }) => {
    tool = new JwtGeneratorPage(page);
    await tool.goto();
  });

  test("генерирует HS256 JWT с корректной HMAC-подписью для кастомного payload", async () => {
    const payload = { userId: 42, role: "qa-engineer" };
    await tool.setPayload(JSON.stringify(payload));
    await tool.setSecret("test-secret-123");
    await tool.generate();

    await expect(tool.resultBlock).not.toHaveText("");
    const result = await tool.resultText();
    expect(result).toBe(expectedJwt(payload, "test-secret-123", "HS256"));
  });

  test("HS384 и HS512 дают другую (но тоже корректную) подпись для того же payload", async () => {
    const payload = { a: 1 };
    await tool.setPayload(JSON.stringify(payload));
    await tool.setSecret("s3cr3t");

    await tool.selectAlg("HS384");
    await tool.generate();
    const hs384 = await tool.resultText();
    expect(hs384).toBe(expectedJwt(payload, "s3cr3t", "HS384"));

    await tool.selectAlg("HS512");
    await tool.generate();
    const hs512 = await tool.resultText();
    expect(hs512).toBe(expectedJwt(payload, "s3cr3t", "HS512"));

    expect(hs384).not.toBe(hs512);
  });

  test("невалидный JSON payload показывает сообщение об ошибке вместо JWT", async () => {
    await tool.setPayload("{ not valid json");
    await tool.setSecret("secret");
    await tool.generate();

    await expect(tool.errorMessage).toBeVisible();
    await expect(tool.resultBlock).toBeHidden();
  });

  test("кнопка Generate задизейблена, когда secret пустой", async () => {
    await tool.setSecret("");
    await expect(tool.generateButton).toBeDisabled();

    await tool.setSecret("x");
    await expect(tool.generateButton).toBeEnabled();
  });

  test("сгенерированный JWT декодируется обратно в тот же payload (round-trip)", async () => {
    const payload = { sub: "999", scope: ["read", "write"] };
    await tool.setPayload(JSON.stringify(payload));
    await tool.setSecret("round-trip-secret");
    await tool.generate();

    const jwt = await tool.resultText();
    const [, payloadB64] = jwt.split(".");
    const decoded = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf-8"));
    expect(decoded).toEqual(payload);
  });
});
