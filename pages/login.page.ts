import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly userInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userInput = page.getByRole('textbox', { name: 'ejemplo@compañia.com' });
    this.passwordInput = page.getByRole('textbox', { name: 'Contraseña *' })
    this.submitButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(user: string, password: string) {
    await this.userInput.fill(user);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.getByRole('button', { name: 'Agregar proyecto' }).waitFor({ state: 'visible' });
  }
}