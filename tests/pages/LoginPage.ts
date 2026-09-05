import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;

  readonly emailInput:          Locator;
  readonly passwordInput:       Locator;
  readonly submitButton:        Locator;
  readonly errorMessage:        Locator;
  readonly forgotPasswordLink:  Locator;

  constructor(page: Page) {
    this.page = page;
    // id="email" / id="password" — без префикса, в отличие от формы
    // регистрации (#su-email / #su-password). Смотри LoginForm.tsx.
    this.emailInput         = page.locator("#email");
    this.passwordInput      = page.locator("#password");
    this.submitButton       = page.getByRole("button", { name: "Sign in" });
    this.errorMessage       = page.locator(".text-red-400");
    this.forgotPasswordLink = page.getByRole("link", { name: "Forgot password" });
  }

  async goto() {
    await this.page.goto("/en/auth/login");
  }

  async fillForm(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }
}