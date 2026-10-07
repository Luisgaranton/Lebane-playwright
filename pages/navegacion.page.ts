import { Page } from '@playwright/test';

export class NavegacionPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async irAUnidades() {
    await this.page.getByRole('button', { name: 'Clientes' }).click();
    const unidades = this.page.getByRole('link', { name: 'Unidades' });
    await unidades.waitFor({ state: 'visible' });
    await unidades.click();
    await this.page.locator('[data-cy="new-renderer-field-versionListaPrecios"]').waitFor({ state: 'visible' });
  }

  async reingresarAUnidades() {
    await this.page.getByRole('button', { name: 'Dashboard', exact: true }).click();
    await this.page.waitForURL(/\/dashboard/);
    await this.page.getByRole('button', { name: 'Clientes' }).click();
    const unidades = this.page.getByRole('link', { name: 'Unidades' });
    await unidades.waitFor({ state: 'visible' });
    await unidades.click();
    await this.page.waitForURL(/\/areas/);
    const tab = this.page.getByRole('tab', { name: 'Unidades' });
    if ((await tab.isVisible()) && (await tab.getAttribute('aria-selected')) !== 'true') {
      await tab.click();
    }
    const cargado = this.page
      .getByText('No hay registros para mostrar')
      .or(this.page.getByRole('button', { name: 'Adicionar unidad' }))
      .or(this.page.locator('[data-cy="new-renderer-field-versionListaPrecios"]'));
    await cargado.first().waitFor({ state: 'visible', timeout: 30_000 });
  }
}
