import { Locator, Page } from '@playwright/test';
import { elegirOpcion } from './elegir-opcion';

export class ProyectoPage {
  readonly page: Page;
  readonly btnAgregarProyecto: Locator;
  readonly inputNombre: Locator;
  readonly desplegableMoneda: Locator;
  readonly desplegablePais: Locator;
  readonly desplegableEstado: Locator;
  readonly desplegableCiudad: Locator;
  readonly desplegableDireccion: Locator;
  readonly inputNroDireccion: Locator;
  readonly inputFechaFinalizacion: Locator;
  readonly desplegableTipoConstruccion: Locator;
  readonly desplegableModalidadAjuste: Locator;
  readonly inputRazonSocial: Locator;
  readonly registrar: Locator;
  readonly etiquetaNombre: Locator;
  readonly etiquetaMoneda: Locator;
  readonly etiquetaRazonSocial: Locator;

  constructor(page: Page) {
    this.page = page;
    this.btnAgregarProyecto = page.getByRole('button', { name: 'Agregar proyecto' });
    this.inputNombre = page.locator('[data-cy="new-renderer-field-nombreProyecto"]');
    this.desplegableMoneda = page.locator('[data-cy="new-renderer-field-moneda"]');
    this.desplegablePais = page.locator('[data-cy="new-renderer-field-pais"]');
    this.desplegableEstado = page.locator('[data-cy="new-renderer-field-estado"]');
    this.desplegableCiudad = page.locator('[data-cy="new-renderer-field-ciudad"]');
    this.desplegableDireccion = page.locator('[data-cy="new-renderer-field-calle"]');
    this.inputNroDireccion = page.locator('input[name="numeroPuerta"]');
    this.inputFechaFinalizacion = page.locator('[data-cy="new-renderer-field-fechaFin"]');
    this.desplegableTipoConstruccion = page.locator('[data-cy="new-renderer-field-tipoConstruccion"]');
    this.desplegableModalidadAjuste = page.locator('[data-cy="new-renderer-field-modalidadAjuste"]');
    this.inputRazonSocial = page.getByRole('combobox', { name: 'Escribí para buscar o crear' });
    this.registrar = page.getByRole('button', { name: 'Registrar' });
    this.etiquetaNombre = page.getByText('Nombre del proyecto *');
    this.etiquetaMoneda = page.getByText('Moneda *', { exact: true });
    this.etiquetaRazonSocial = page.getByText('Razón Social *');
  }

  nombre(nombreProyecto: string) {
    return this.page.getByText(nombreProyecto).first();
  }

  async abrirNuevo() {
    await this.btnAgregarProyecto.click();
    await this.page.waitForURL(/\/primer-proyecto$/);
  }

  async crear(nombreProyecto: string) {
    await this.abrirNuevo();
    await this.completar(nombreProyecto);
    await this.registrar.click();
    await this.page.waitForURL(/\/proyecto\/\d+$/);
    const id = this.page.url().match(/\/proyecto\/(\d+)/)?.[1];
    if (!id) throw new Error('No se obtuvo el id del proyecto');
    await this.nombre(nombreProyecto).waitFor({ state: 'visible' });
    return id;
  }

  async completarSin(nombreProyecto: string, omite: 'moneda' | 'razonSocial') {
    await this.completar(nombreProyecto, { [omite]: false });
  }

  async elegirMoneda(opcion = 'ARS') {
    await elegirOpcion(this.page, this.desplegableMoneda, opcion);
  }

  async vaciarRazonSocial() {
    await this.inputRazonSocial.click();
    await this.inputRazonSocial.fill('');
    await this.page.keyboard.press('Escape');
  }

  async eliminar(id: string) {
    await this.page.goto(`/proyecto/${id}/informacion-de-proyecto`);
    await this.page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    const dialogo = this.page.getByRole('dialog');
    await dialogo.locator('input').fill('eliminar');
    await dialogo.getByRole('button', { name: 'Confirmar' }).click();
    await this.page.waitForURL((url) => !url.pathname.includes(`/proyecto/${id}`), { timeout: 30_000 });
  }

  private async completar(
    nombreProyecto: string,
    opciones: { moneda?: boolean; razonSocial?: boolean } = {},
  ) {
    await this.inputNombre.fill(nombreProyecto);
    if (opciones.moneda !== false) await this.elegirMoneda();
    await elegirOpcion(this.page, this.desplegablePais, 'Argentina');
    await elegirOpcion(this.page, this.desplegableEstado, 'Buenos Aires');
    await elegirOpcion(this.page, this.desplegableCiudad, 'Campana');
    await this.desplegableDireccion.fill('Calle QA');
    await this.inputNroDireccion.fill('123');
    await this.inputFechaFinalizacion.click();
    await this.inputFechaFinalizacion.pressSequentially('31122026');
    await this.page.keyboard.press('Tab');
    await elegirOpcion(this.page, this.desplegableTipoConstruccion, 'Edificio');
    await elegirOpcion(this.page, this.desplegableModalidadAjuste, 'Definitivo');
    if (opciones.razonSocial !== false) await elegirOpcion(this.page, this.inputRazonSocial, 'razon social');
  }
}
