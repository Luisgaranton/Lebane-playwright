import { Locator, Page } from '@playwright/test';
import { TablaUnidadesComponent } from '../components/tabla-unidades.component';
import { elegirOpcion } from './elegir-opcion';
import { NavegacionPage } from './navegacion.page';

export type DatosLista = { pisos?: string; unidadesPorPiso?: string };

export class ListaPreciosPage {
  readonly page: Page;
  readonly navegacion: NavegacionPage;
  readonly inputPrecioListaM2: Locator;
  readonly inputCantidadPisos: Locator;
  readonly desplegableTipologias: Locator;
  readonly inputUnidadesPorPiso: Locator;
  readonly inputNombreLista: Locator;
  readonly btnGuardar: Locator;
  readonly tabUnidades: Locator;
  readonly btnTemplates: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navegacion = new NavegacionPage(page);
    this.inputPrecioListaM2 = page.locator('input[name="precioListaMetroCuadrado"]');
    this.inputCantidadPisos = page.locator('input[name="pisos"]');
    this.desplegableTipologias = page.locator('[data-cy="new-renderer-field-tipologias"]');
    this.inputUnidadesPorPiso = page.locator('input[name="unidadesPorPiso"]');
    this.inputNombreLista = page.locator('[data-cy="new-renderer-field-versionListaPrecios"]');
    this.btnGuardar = page.getByRole('button', { name: 'Guardar' });
    this.tabUnidades = page.getByRole('tab', { name: 'Unidades' });
    this.btnTemplates = page.getByRole('button', { name: 'Templates' });
  }

  botonLista(nombreLista: string) {
    return this.page.getByRole('button', { name: nombreLista });
  }

  textoLista(nombreLista: string) {
    return this.page.getByText(nombreLista, { exact: true });
  }

  listasImportadas() {
    return this.page.getByText(/Lista precios \d{2}\/\d{2}\/\d{4}/);
  }

  menu() {
    return this.page.getByRole('menu');
  }

  errorArchivoInvalido() {
    return this.page.getByText(
      'No valid entries or contents found, this is not a valid OOXML (Office Open XML) file',
    );
  }

  async crearInicial(nombreLista: string, datos: DatosLista = {}) {
    await this.navegacion.irAUnidades();
    await this.inputPrecioListaM2.fill('150000');
    await this.inputCantidadPisos.fill(datos.pisos ?? '1');
    await elegirOpcion(this.page, this.desplegableTipologias, 'Dos ambientes');
    await this.inputUnidadesPorPiso.fill(datos.unidadesPorPiso ?? '1');
    await this.inputNombreLista.fill(nombreLista);
    await this.btnGuardar.click();
    await this.page.getByText(nombreLista).first().waitFor({ state: 'visible' });
  }

  async abrirGrilla() {
    await this.tabUnidades.click();
    await this.page.getByRole('button', { name: 'Adicionar unidad' }).waitFor({ state: 'visible' });
  }

  async cargarTemplate(archivo: string) {
    await this.enviarTemplate(archivo);
    const dialogo = this.page.getByRole('dialog');
    await dialogo.waitFor({ state: 'visible', timeout: 30_000 });
    await dialogo.getByRole('button', { name: 'Cerrar' }).click();
    await dialogo.waitFor({ state: 'hidden' });
    await this.page.keyboard.press('Escape');

    const listaNueva = this.listasImportadas();
    if (!(await listaNueva.isVisible())) {
      await this.page.getByRole('button', { name: /^Lista / }).click();
      await this.menu().getByText(/Lista precios \d{2}\/\d{2}\/\d{4}/).click();
    }
    await this.cerrarPopover();

    const tabla = new TablaUnidadesComponent(this.page);
    await tabla.fila('303').waitFor({ state: 'visible' });
    await tabla.mostrarColumna(/precio unidad/i);
  }

  async enviarTemplate(archivo: string) {
    await this.btnTemplates.click();
    await this.page.getByRole('button', { name: 'Cargar Template de Unidades', exact: true }).click();
    await this.page.locator('input[type="file"]').setInputFiles(archivo);
    await this.page.getByRole('button', { name: 'Cargar', exact: true }).click();
  }

  async cancelarCarga() {
    const cancelar = this.page.getByRole('button', { name: 'Cancelar' });
    if (await cancelar.isVisible()) await cancelar.click();
    await this.page.keyboard.press('Escape');
    await this.cerrarPopover();
  }

  private async cerrarPopover() {
    const fondo = this.page.locator('.MuiBackdrop-root');
    if (await fondo.count()) await fondo.first().click({ force: true });
  }
}
