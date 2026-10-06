import { Page, Locator, expect } from '@playwright/test';
import ExcelJS, { CellValue } from 'exceljs';

function precioEnPantalla(valor: string) {
  const formateado = Number(valor).toLocaleString('es-AR');
  return new RegExp(formateado.replace(/\./g, '[.,]'));
}

function textoCelda(valor: CellValue): string {
  if (valor == null) return '';
  if (typeof valor === 'number' || typeof valor === 'string') return String(valor).trim();
  if (typeof valor === 'object' && 'result' in valor) return textoCelda(valor.result as CellValue);
  if (typeof valor === 'object' && 'text' in valor && typeof valor.text === 'string') return valor.text.trim();
  if (typeof valor === 'object' && 'richText' in valor) return valor.richText.map((parte) => parte.text).join('').trim();
  return '';
}

async function unidadesDelTemplate(archivo: string) {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(archivo);
  const hoja = libro.getWorksheet('Unidades');
  if (!hoja) throw new Error('El template no tiene la hoja Unidades');

  const unidades: {
    numero: string;
    tipologia: string;
    orientacion: string;
    m2Cubiertos: string;
    precio: string;
    moneda: string;
    estado: string;
    piso: string;
  }[] = [];

  hoja.eachRow((fila, numeroFila) => {
    if (numeroFila === 1) return;
    const numero = textoCelda(fila.getCell(1).value);
    if (!numero) return;
    unidades.push({
      numero: String(Number(numero)),
      tipologia: textoCelda(fila.getCell(2).value),
      orientacion: textoCelda(fila.getCell(3).value),
      m2Cubiertos: textoCelda(fila.getCell(4).value),
      precio: textoCelda(fila.getCell(9).value),
      moneda: textoCelda(fila.getCell(10).value),
      estado: textoCelda(fila.getCell(11).value),
      piso: String(Number(textoCelda(fila.getCell(20).value))),
    });
  });

  return unidades;
}

export class ListaPreciosPage {
  readonly page: Page;
  readonly menuClientes: Locator;
  readonly menuUnidades: Locator;
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
  readonly inputPrecioListaM2: Locator;
  readonly inputCantidadPisos: Locator;
  readonly desplegableTipologias: Locator;
  readonly inputUnidadesPorPiso: Locator;
  readonly inputNombreLista: Locator;
  readonly btnGuardar: Locator;
  readonly btnRegistrar: Locator;
  readonly tabUnidades: Locator;
  readonly btnAdicionarUnidad: Locator;
  readonly btnTemplates: Locator;

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
    this.inputPrecioListaM2 = page.locator('input[name="precioListaMetroCuadrado"]');
    this.inputCantidadPisos = page.locator('input[name="pisos"]');
    this.desplegableTipologias = page.locator('[data-cy="new-renderer-field-tipologias"]');
    this.inputUnidadesPorPiso = page.locator('input[name="unidadesPorPiso"]');
    this.inputNombreLista = page.locator('[data-cy="new-renderer-field-versionListaPrecios"]');
    this.btnGuardar = page.getByRole('button', { name: 'Guardar' });
    this.btnRegistrar = page.getByRole('button', { name: 'Registrar' });
    this.menuClientes = page.getByRole('button', { name: 'Clientes' });
    this.menuUnidades = page.getByRole('link', { name: 'Unidades' });
    this.tabUnidades = page.getByRole('tab', { name: 'Unidades' });
    this.btnAdicionarUnidad = page.getByRole('button', { name: 'Adicionar unidad' });
    this.btnTemplates = page.getByRole('button', { name: 'Templates' });
  }
  

  private async elegir(combo: Locator, opcion: string) {
    const listbox = this.page.getByRole('listbox');
    for (let intento = 0; intento < 3; intento += 1) {
      if (await listbox.isVisible()) await this.page.keyboard.press('Escape');
      await combo.click();
      await combo.fill(opcion);
      const option = this.page.getByRole('option', { name: opcion, exact: true });
      try {
        await option.click({ timeout: 5000 });
        await listbox.waitFor({ state: 'hidden', timeout: 1000 }).catch(async () => {
          await this.page.keyboard.press('Escape');
          await listbox.waitFor({ state: 'hidden' });
        });
        const chip = this.page.locator('.MuiChip-label', { hasText: opcion });
        if (await chip.count()) return;
        await expect(combo).toHaveValue(opcion, { timeout: 3000 });
        return;
      } catch {
        await this.page.keyboard.press('Escape');
      }
    }
    throw new Error(`No se pudo elegir "${opcion}"`);
  }

  private fila(numero: string) {
    return this.page.locator('tbody tr').filter({
      has: this.page.locator(`input[value="${numero}"]`).or(this.page.getByText(numero, { exact: true })),
    });
  }

  async abrirNuevoProyecto() {
    await this.btnAgregarProyecto.click();
    await expect(this.page).toHaveURL(/\/primer-proyecto$/);
  }

  async crearProyecto(nombreProyecto: string) {
    await this.abrirNuevoProyecto();
    await this.inputNombre.fill(nombreProyecto);
    await this.elegir(this.desplegableMoneda, 'ARS');
    await this.elegir(this.desplegablePais, 'Argentina');
    await this.elegir(this.desplegableEstado, 'Buenos Aires');
    await this.elegir(this.desplegableCiudad, 'Campana');
    await this.desplegableDireccion.fill('Calle QA');
    await this.inputNroDireccion.fill('123');
    await this.inputFechaFinalizacion.click();

    await this.inputFechaFinalizacion.pressSequentially('31122026');
    await this.page.keyboard.press('Tab');
    await this.elegir(this.desplegableTipoConstruccion, 'Edificio');
    await this.elegir(this.desplegableModalidadAjuste, 'Definitivo');
    await this.elegir(this.inputRazonSocial, 'razon social');
    await expect(this.btnRegistrar).toBeEnabled();
    await this.btnRegistrar.click();
    await this.page.waitForURL(/\/proyecto\/\d+$/);
    await expect(this.page.getByText(nombreProyecto).first()).toBeVisible();
  }

  async irAUnidades() {
    await this.menuClientes.click();
    await expect(this.menuUnidades).toBeVisible();
    await this.menuUnidades.click();
    await this.inputNombreLista.waitFor({ state: 'visible' });
  }

  async reingresarAUnidades() {
    await this.page.getByRole('button', { name: 'Dashboard', exact: true }).click();
    await this.page.waitForURL(/\/dashboard/);
    await this.menuClientes.click();
    await expect(this.menuUnidades).toBeVisible();
    await this.menuUnidades.click();
    await this.page.waitForURL(/\/areas/);
    if ((await this.tabUnidades.isVisible()) && (await this.tabUnidades.getAttribute('aria-selected')) !== 'true') {
      await this.tabUnidades.click();
    }
    const cargado = this.page
      .getByText('No hay registros para mostrar')
      .or(this.btnAdicionarUnidad)
      .or(this.inputNombreLista);
    await expect(cargado.first()).toBeVisible({ timeout: 30_000 });
  }

  async crearListaInicial(
    nombreLista: string,
    datos: { pisos?: string; unidadesPorPiso?: string } = {},
  ) {
    await this.irAUnidades();
    await this.inputPrecioListaM2.fill('150000');
    await this.inputCantidadPisos.fill(datos.pisos ?? '1');
    await this.elegir(this.desplegableTipologias, 'Dos ambientes');
    await this.inputUnidadesPorPiso.fill(datos.unidadesPorPiso ?? '1');
    await this.inputNombreLista.fill(nombreLista);
    await this.btnGuardar.click();
    await expect(this.page.getByText(nombreLista).first()).toBeVisible();
  }

  async crearProyectoConLista(datos?: { pisos?: string; unidadesPorPiso?: string }) {
    const marca = Date.now();
    const nombreProyecto = `QA ${marca}`;
    const nombreLista = `Lista ${marca}`;
    await this.crearProyecto(nombreProyecto);
    await this.crearListaInicial(nombreLista, datos);
    return { nombreProyecto, nombreLista };
  }

  async abrirGrilla() {
    await this.tabUnidades.click();
    await this.btnAdicionarUnidad.waitFor({ state: 'visible' });
  }

  async verificarProyectoCreado(nombreProyecto: string) {
    await expect(this.page.getByText(nombreProyecto).first()).toBeVisible();
  }

  async verificarListaVisible(nombreLista: string) {
    await expect(this.page.getByRole('button', { name: nombreLista })).toBeVisible();
  }

  async verificarListaAusente(nombreLista: string) {
    await expect(this.page.getByRole('button', { name: nombreLista })).toHaveCount(0);
  }

  async verificarUnidadVisible(numero: string) {
    await expect(this.fila(numero)).toBeVisible();
  }

  async verificarUnidadAusente(numero: string) {
    await expect(this.fila(numero)).toHaveCount(0);
  }

  async verificarPrecio(numero: string, precio: string) {
    await expect(this.fila(numero)).toContainText(precioEnPantalla(precio));
  }

  async verificarUnaSolaLista(nombreLista: string) {
    await expect(this.page.getByText(/Lista precios \d{2}\/\d{2}\/\d{4}/)).toHaveCount(0);
    const boton = this.page.getByRole('button', { name: nombreLista });
    await expect(boton).toBeVisible();
    await boton.click();
    const menu = this.page.getByRole('menu');
    const opciones = menu.getByText(/^Lista /);
    await expect(opciones).toHaveCount(1);
    await expect(opciones).toContainText(nombreLista);
    await this.page.keyboard.press('Escape');
  }

  async verificarListaImportada(nombreListaOriginal: string) {
    const listaImportada = this.page.getByText(/Lista precios \d{2}\/\d{2}\/\d{4}/).first();
    await expect(listaImportada).toBeVisible();
    await listaImportada.click();
    await expect(this.page.getByRole('menu').getByText(nombreListaOriginal)).toBeVisible();
    await this.page.keyboard.press('Escape');
  }

  async verificarUnidadesDelTemplate(archivo: string) {
    const unidades = await unidadesDelTemplate(archivo);
    expect(unidades.length).toBeGreaterThan(0);

    for (const unidad of unidades) {
      const fila = this.fila(unidad.numero);
      await fila.scrollIntoViewIfNeeded();
      await expect(fila).toContainText(unidad.tipologia);
      await expect(fila).toContainText(unidad.orientacion);
      await expect(fila).toContainText(unidad.moneda);
      await expect(fila).toContainText(unidad.estado);
      await expect(fila).toContainText(new RegExp(`Piso ${unidad.piso}(?!\\d)`));
      await expect(fila).toContainText(precioEnPantalla(unidad.m2Cubiertos));
      await expect(fila).toContainText(precioEnPantalla(unidad.precio));
    }

    const total = unidades.reduce((suma, unidad) => suma + Number(unidad.precio), 0);
    await this.esperarTotalPrecio(String(total));
  }

  private async editarPrecio(numero: string, precio: string) {
    const celda = this.fila(numero).locator('[data-column-id="precio"]');
    const input = this.page.getByPlaceholder(/Valor/);
    const visible = Number(precio).toLocaleString('es-AR').replace(/\./g, '[.,]');
    await expect(async () => {
      await celda.scrollIntoViewIfNeeded({ timeout: 2000 });
      await celda.dblclick();
      await input.fill(precio, { timeout: 2000 });
      await this.page.keyboard.press('Enter');
      await expect(celda).toContainText(new RegExp(visible), { timeout: 2000 });
    }).toPass({ timeout: 15000 });
  }

  async esperarTotalPrecio(precio: string) {
    const fila = this.page.locator('tr').filter({ has: this.page.getByText('Totales', { exact: true }) });
    const celda = fila.locator('[data-column-id="precio"]');
    const destino = (await celda.count()) ? celda : fila;
    await destino.evaluate((nodo) => nodo.scrollIntoView({ inline: 'center', block: 'center' }));
    const visible = Number(precio).toLocaleString('es-AR').replace(/\./g, '[.,]');
    await expect(destino).toContainText(new RegExp(visible), { timeout: 15_000 });
  }

  async agregarUnidad(numero: string, precio: string) {
    await this.btnAdicionarUnidad.click();
    const numeroUnidad = this.page.getByPlaceholder(/Valor/);
    await numeroUnidad.fill(numero);
    await numeroUnidad.press('Enter');
    await this.page.keyboard.press('Escape');
    await this.editarPrecio(numero, precio);
    await expect(this.fila(numero)).toBeVisible();
  }

  async cargarTemplate(archivo: string) {
    await this.btnTemplates.click();
    await this.page.getByRole('button', { name: 'Cargar Template de Unidades', exact: true }).click();
    await this.page.locator('input[type="file"]').setInputFiles(archivo);
    await this.page.getByRole('button', { name: 'Cargar', exact: true }).click();

    const dialogo = this.page.getByRole('dialog');
    await dialogo.waitFor({ state: 'visible', timeout: 30_000 });
    await dialogo.getByRole('button', { name: 'Cerrar' }).click();
    await expect(dialogo).toBeHidden();
    await this.page.keyboard.press('Escape');

    const listaNueva = this.page.getByText(/Lista precios \d{2}\/\d{2}\/\d{4}/);
    if (!(await listaNueva.isVisible())) {
      await this.page.getByRole('button', { name: /^Lista / }).click();
      await this.page.getByRole('menu').getByText(/Lista precios \d{2}\/\d{2}\/\d{4}/).click();
    }
    await this.cerrarPopover();
    await expect(this.fila('303')).toBeVisible();
    await this.mostrarColumna(/precio unidad/i);
  }

  private async cerrarPopover() {
    const fondo = this.page.locator('.MuiBackdrop-root');
    if (await fondo.count()) await fondo.first().click({ force: true });
  }

  private async mostrarColumna(nombre: RegExp) {
    const header = this.page.getByRole('columnheader').filter({ hasText: nombre }).first();
    const contenedor = this.page.locator('.MuiTableContainer-root').first();
    for (let paso = 0; paso < 20; paso += 1) {
      if (await header.isVisible()) return;
      await contenedor.evaluate((nodo) => {
        nodo.scrollLeft += 350;
      });
    }
  }

  async modificarPrecio(numero: string, precioNuevo: string) {
    await this.editarPrecio(numero, precioNuevo);
  }

  async eliminarUnidad(numero: string) {
    const fila = this.fila(numero);
    const error = this.page.getByRole('alert').filter({ hasText: 'Error al eliminar la unidad' });
    for (let intento = 0; intento < 3; intento += 1) {
      await fila.getByRole('button', { name: 'Eliminar' }).click();
      await this.page.getByRole('dialog').getByRole('button', { name: 'Confirmar' }).click();
      const limite = Date.now() + 10_000;
      while (Date.now() < limite) {
        if ((await fila.count()) === 0) return;
        if (await error.isVisible()) break;
        await this.page.waitForTimeout(250);
      }
      if (await error.isVisible()) await error.getByRole('button', { name: 'Cerrar' }).click();
      if (await this.page.getByRole('dialog').isVisible()) await this.page.keyboard.press('Escape');
    }
    await expect(fila).toHaveCount(0);
  }
}
