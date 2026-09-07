import { Page, Locator } from "@playwright/test";
import { fillRobust } from "../support/robust-fill";

/** Page Object для /tools/header-inspector (components/tools/HeaderInspectorTool.tsx).
 *
 *  Инструмент делает реальный POST на /api/headers (это единственный способ
 *  прочитать заголовки чужого origin — браузер блокирует их напрямую).
 *  Логика самого /api/headers эндпоинта (валидация URL, SSRF-защита)
 *  уже покрыта отдельным API-тестом tests/api-headers.spec.ts — здесь мы
 *  тестируем только фронтенд (рендер результата/ошибки/лоадера), поэтому
 *  перехватываем сетевой запрос через page.route() вместо реальных походов
 *  во внешний интернет — детерминированно и без флейков от реальной сети.
 */
export class HeaderInspectorPage {
  readonly page: Page;
  readonly urlInput: Locator;
  readonly inspectButton: Locator;
  readonly errorText: Locator;
  readonly statusLine: Locator;
  readonly headersPre: Locator;
  readonly copyButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.urlInput = page.locator("form input");
    this.inspectButton = page.getByRole("button", { name: /^(Inspect|Checking…)$/ });
    this.errorText = page.locator("p.text-red-400");
    // "span.text-text-primary" сам по себе неуникален (шапка/футер/карточки
    // инструментов тоже используют этот класс) — статусная строка это
    // единственный элемент на странице, начинающийся с 3-значного HTTP-кода.
    this.statusLine = page.getByText(/^\d{3} /);
    this.headersPre = page.locator("pre");
    this.copyButton = page.getByRole("button", { name: "Copy", exact: true });
  }

  async goto() {
    await this.page.goto("/en/tools/header-inspector");
  }

  async setUrl(url: string) {
    await fillRobust(this.urlInput, url);
  }

  /** Подставляет мок-ответ /api/headers вместо реального похода в сеть. */
  async mockResponse(status: number, body: unknown, delayMs = 0) {
    await this.page.route("**/api/headers", async (route) => {
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    });
  }

  /** Обрывает запрос на уровне сети — имитирует networkError на фронте. */
  async mockNetworkFailure() {
    await this.page.route("**/api/headers", (route) => route.abort("failed"));
  }
}
