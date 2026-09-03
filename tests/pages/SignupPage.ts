import { Page, Locator } from "@playwright/test";

export class SignupPage {
  readonly page: Page;

  readonly emailInput:      Locator;
  readonly passwordInput:   Locator;
  readonly confirmInput:    Locator;
  readonly submitButton:    Locator;
  readonly errorMessage:    Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput    = page.locator("#su-email");
    this.passwordInput = page.locator("#su-password");
    this.confirmInput  = page.locator("#su-confirm");
    this.submitButton  = page.getByRole("button", { name: "Create account" });
    this.errorMessage  = page.locator(".text-red-400");
  }

  async goto() {
    await this.page.goto("/en/auth/signup");
  }

  async fillForm(email: string, password: string, confirmPassword: string = password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmInput.fill(confirmPassword);
  }

  async submit() {
    await this.submitButton.click();
  }
}