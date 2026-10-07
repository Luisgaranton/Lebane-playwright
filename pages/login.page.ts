import { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly userInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorIngreso: Locator;
  readonly avisoCorreo: Locator;
  readonly avisoContrasena: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userInput = page.getByRole('textbox', { name: 'ejemplo@compañia.com' });
    this.passwordInput = page.getByRole('textbox', { name: 'Contraseña *' });
    this.submitButton = page.locator('button[type="submit"]');
    this.errorIngreso = page.getByText('Error al ingresar, controle bien los datos');
    this.avisoCorreo = page.getByText('Por favor, asegurate que el correo electrónico es correcto.');
    this.avisoContrasena = page.getByText('Por favor, asegurate que la contraseña es correcta.');
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
}