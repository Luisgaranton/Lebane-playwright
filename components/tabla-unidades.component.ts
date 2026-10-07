import { expect, Locator, Page } from '@playwright/test';
import { precioEnPantalla } from '../pages/precio';

export class TablaUnidadesComponent {
  readonly page: Page;
  readonly btnAdicionarUnidad: Locator;

  constructor(page: Page) {
    this.page = page;
    this.btnAdicionarUnidad = page.getByRole('button', { name: 'Adicionar unidad' });
  }

  fila(numero: string) {
    return this.page.locator('tbody tr').filter({
      has: this.page.locator(`input[value="${numero}"]`).or(this.page.getByText(numero, { exact: true })),
    });
  }

  celdaPrecio(numero: string) {
    return this.fila(numero).locator('[data-column-id="precio"]');
  }

  errorActualizacion() {
    return this.page.getByText('Error al actualizar la unidad');
  }

  alertaActualizacion() {
    return this.page.getByRole('alert').filter({ hasText: 'Error al actualizar la unidad' });
  }

  async total() {
    const fila = this.page.locator('tr').filter({ has: this.page.getByText('Totales', { exact: true }) });
    const celda = fila.locator('[data-column-id="precio"]');
    const destino = (await celda.count()) ? celda : fila;
    await destino.evaluate((nodo) => nodo.scrollIntoView({ inline: 'center', block: 'center' }));
    return destino;
  }

  async agregar(numero: string, precio: string) {
    await this.btnAdicionarUnidad.click();
    const numeroUnidad = this.page.getByPlaceholder(/Valor/);
    await numeroUnidad.fill(numero);
    await numeroUnidad.press('Enter');
    await this.page.keyboard.press('Escape');
    await this.editarPrecio(numero, precio);
    await this.fila(numero).waitFor({ state: 'visible' });
  }

  async editarPrecio(numero: string, precio: string) {
    const celda = this.fila(numero).locator('[data-column-id="precio"]');
    const input = this.page.getByPlaceholder(/Valor/);
    const visible = precioEnPantalla(precio);
    await expect(async () => {
      await celda.scrollIntoViewIfNeeded({ timeout: 2000 });
      await celda.dblclick();
      await input.fill(precio, { timeout: 2000 });
      await this.page.keyboard.press('Enter');
      await expect(celda).toContainText(visible, { timeout: 2000 });
    }).toPass({ timeout: 15000 });
  }

  async cargarConSigno(numero: string, precio: string) {
    const celda = this.celdaPrecio(numero);
    await celda.scrollIntoViewIfNeeded();
    await celda.dblclick();
    await this.page.getByPlaceholder(/Valor/).fill(`-${precio}`);
    await this.page.keyboard.press('Enter');
  }

  async intentarPrecio(numero: string, valor: string) {
    const celda = this.celdaPrecio(numero);
    await celda.scrollIntoViewIfNeeded();
    await celda.dblclick();
    const input = this.page.getByPlaceholder(/Valor/);
    await input.waitFor({ state: 'visible' });
    await input.click();
    await input.fill('');
    if (valor) {
      await this.page.keyboard.insertText(valor);
      await this.page.keyboard.press('Enter');
    }
  }

  async cerrarErrorActualizacion() {
    const cerrar = this.page.getByRole('alert').getByRole('button', { name: 'Cerrar' });
    if (await cerrar.count()) await cerrar.first().click();
  }

  async soltarEdicion() {
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.press('Escape');
  }

  async mostrarColumna(nombre: RegExp) {
    const header = this.page.getByRole('columnheader').filter({ hasText: nombre }).first();
    const contenedor = this.page.locator('.MuiTableContainer-root').first();
    await expect(async () => {
      if (await header.isVisible()) return;
      await contenedor.evaluate((nodo) => {
        nodo.scrollLeft += 350;
      });
      await expect(header).toBeVisible({ timeout: 500 });
    }).toPass({ timeout: 15_000 });
  }

  async eliminar(numero: string) {
    const fila = this.fila(numero);
    const error = this.page.getByRole('alert').filter({ hasText: 'Error al eliminar la unidad' });

    await expect(async () => {
      if ((await fila.count()) === 0) return;

      if (await error.isVisible()) await error.getByRole('button', { name: 'Cerrar' }).click();
      const dialogo = this.page.getByRole('dialog');
      if (await dialogo.isVisible()) await this.page.keyboard.press('Escape');

      await fila.getByRole('button', { name: 'Eliminar' }).click();
      await dialogo.getByRole('button', { name: 'Confirmar' }).click();
      await expect(fila).toHaveCount(0, { timeout: 10_000 });
    }).toPass({ timeout: 35_000 });
  }
}
