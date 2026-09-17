import { Page, Locator } from "@playwright/test";

export class MockApiPage {
  readonly page: Page;

  readonly newEndpointNameInput: Locator;
  readonly newEndpointButton:    Locator;
  readonly importButton:         Locator;

  // Модалка импорта — components/mock-api/ImportCollectionModal.tsx
  readonly fileInput:            Locator;
  readonly fileError:            Locator;
  readonly previewHeading:       Locator;
  readonly newEndpointRadio:     Locator;
  readonly newEndpointNameField: Locator;
  readonly confirmImportButton:  Locator; // "Import N" — N меняется, матчим по регэкспу
  readonly doneButton:           Locator;
  readonly modalCloseButton:     Locator;

  constructor(page: Page) {
    this.page = page;
    this.newEndpointNameInput = page.getByPlaceholder("Name (optional)");
    this.newEndpointButton    = page.getByRole("button", { name: "+ New endpoint" });
    this.importButton         = page.getByRole("button", { name: "Import from Postman / Insomnia" });

    this.fileInput            = page.locator('input[type="file"]');
    this.fileError            = page.locator("text=/Unrecognized format|not valid JSON|is empty|5MB max|No routes with a supported method/");
    this.previewHeading       = page.getByText(/^Found in /);
    this.newEndpointRadio     = page.locator('input[type="radio"][name="import-target"]').first();
    this.newEndpointNameField = page.getByPlaceholder("Name", { exact: true });
    this.confirmImportButton  = page.getByRole("button", { name: /^Import \d+$/ });
    this.doneButton           = page.getByRole("button", { name: "Done" });
    this.modalCloseButton     = page.getByRole("button", { name: "Close" });
  }

  async goto() {
    await this.page.goto("/en/mock-api");
  }

  async openImportModal() {
    await this.importButton.click();
  }

  async uploadFixture(relativeFixturePath: string) {
    await this.fileInput.setInputFiles(relativeFixturePath);
  }

  routeRow(method: string, path: string): Locator {
    return this.page.locator("label").filter({ hasText: method }).filter({ hasText: path });
  }

  endpointCard(name: string): Locator {
    return this.page.locator(".rounded-lg.border").filter({ hasText: name });
  }

  routeInCard(cardName: string, method: string, path: string): Locator {
    return this.endpointCard(cardName).locator("div").filter({ hasText: method }).filter({ hasText: path }).last();
  }

  // "http://localhost:3000/api/mock/<slug>" — публичный базовый URL мока,
  // напечатанный как <code> прямо под названием эндпоинта в EndpointCard.
  // Фильтруем по "/api/mock/" вместо привязки к конкретной карточке —
  // проще и устойчивее, чем матчить эндпоинт по названию.
  baseUrlCode(): Locator {
    return this.page.locator("code").filter({ hasText: "/api/mock/" }).first();
  }
}
