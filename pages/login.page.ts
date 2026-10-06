import { Page, Locator, expect } from '@playwright/test';

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

  async intentarIngreso(user: string, password: string) {
    await this.userInput.fill(user);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async verificarIngresoRechazado() {
    await expect(this.page.getByText('Error al ingresar, controle bien los datos')).toBeVisible();
    await expect(this.page.getByText('Por favor, asegurate que el correo electrónico es correcto.')).toBeVisible();
    await expect(this.page.getByText('Por favor, asegurate que la contraseña es correcta.')).toBeVisible();
    await expect(this.page.getByRole('button', { name: 'Agregar proyecto' })).toHaveCount(0);
    await expect(this.page).toHaveURL(/\/sign-in/);
  }
}