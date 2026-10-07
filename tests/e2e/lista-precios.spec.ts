import path from 'path';
import { expect, Page, test } from '@playwright/test';
import { precioEnPantalla } from '../../pages/precio';
import { ProyectoPage } from '../../pages/proyecto.page';
import { unidadesDelTemplate } from '../../pages/template-unidades';
import { olvidarProyecto, prepararLista, proyectoParaLimpiar } from '../support/preparar-lista';

const templateUnidades = path.join(__dirname, '../../fixtures/template-unidades.xlsx');
const templateInvalido = path.join(__dirname, '../../fixtures/sample.pdf');

test.use({ viewport: { width: 1600, height: 1200 } });

test.beforeEach(async ({ page }) => {
  olvidarProyecto();
  await page.goto('/');
  await page.getByRole('button', { name: 'Agregar proyecto' }).waitFor({ state: 'visible' });
});

test.afterEach(async ({ page }, testInfo) => {
  const id = proyectoParaLimpiar();
  if (!id || testInfo.status !== testInfo.expectedStatus) return;
  await new ProyectoPage(page).eliminar(id);
});

async function registroBloqueado(page: Page, proyecto: ProyectoPage) {
  await expect(proyecto.registrar).toBeDisabled();
  await expect(page).toHaveURL(/\/primer-proyecto$/);
}

test('crear proyecto con lista de precios inicial', async ({ page }) => {
  // Dado que el usuario inició sesión
  // Cuando crea un proyecto y nombra la lista de precios inicial
  // Entonces el proyecto queda creado
  // Y la grilla muestra esa lista con la unidad 101

  const { nombreProyecto, nombreLista, proyecto, lista, tabla } = await prepararLista(page);

  await expect(proyecto.nombre(nombreProyecto)).toBeVisible();
  await lista.abrirGrilla();
  await expect(lista.botonLista(nombreLista)).toBeVisible();
  await expect(tabla.fila('101')).toBeVisible();
});

test('agregar unidad manualmente con su precio', async ({ page }) => {
  // Dado un proyecto con una lista de precios inicial
  // Cuando agrego una unidad de forma manual con su precio
  // Entonces la unidad aparece con ese precio
  // Y el total de la lista muestra el valor nuevo

  const { lista, tabla } = await prepararLista(page);
  const numero = `9${Date.now().toString().slice(-3)}`;
  const precio = '125000';

  await lista.abrirGrilla();
  await tabla.agregar(numero, precio);
  await expect(tabla.fila(numero)).toContainText(precioEnPantalla(precio));
  await expect(await tabla.total()).toContainText(precioEnPantalla(precio));
});

test('cargar unidades por template crea una lista nueva', async ({ page }) => {
  // Dado un proyecto con una lista inicial de 3 pisos
  // Cuando cargo el template de unidades
  // Entonces se crea una lista nueva con las unidades del archivo
  // Y la lista original sigue existiendo
  // Y cada fila coincide con el Excel
  // Y el total es la suma de los precios del archivo

  const { nombreLista, lista, tabla } = await prepararLista(page, { pisos: '3', unidadesPorPiso: '1' });

  await lista.abrirGrilla();
  await lista.cargarTemplate(templateUnidades);

  const listaImportada = lista.listasImportadas().first();
  await expect(listaImportada).toBeVisible();
  await listaImportada.click();
  await expect(lista.menu().getByText(nombreLista)).toBeVisible();
  await page.keyboard.press('Escape');

  const unidades = await unidadesDelTemplate(templateUnidades);
  expect(unidades.length).toBeGreaterThan(0);
  for (const unidad of unidades) {
    const fila = tabla.fila(unidad.numero);
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
  await expect(await tabla.total()).toContainText(precioEnPantalla(String(total)));
});

test('modificar el precio de una unidad actualiza la lista', async ({ page }) => {
  // Dado un proyecto con una sola lista y la unidad 101
  // Cuando modifico el precio de la unidad 101
  // Entonces la misma lista muestra el precio nuevo
  // Y el total se actualiza con ese valor
  // Y no se creó otra lista

  const { nombreLista, lista, tabla } = await prepararLista(page);
  const precio = '180000';

  await lista.abrirGrilla();
  await tabla.editarPrecio('101', precio);
  await expect(tabla.fila('101')).toContainText(precioEnPantalla(precio));
  await expect(await tabla.total()).toContainText(precioEnPantalla(precio));
  await expect(lista.listasImportadas()).toHaveCount(0);
  const boton = lista.botonLista(nombreLista);
  await expect(boton).toBeVisible();
  await boton.click();
  const opciones = lista.menu().getByText(/^Lista /);
  await expect(opciones).toHaveCount(1);
  await expect(opciones).toContainText(nombreLista);
  await page.keyboard.press('Escape');
});

test('eliminar una unidad conserva la lista', async ({ page }) => {
  // Dado una lista con las unidades 101 y 102
  // Cuando elimino la unidad 102
  // Entonces la lista sigue existiendo
  // Y la unidad 101 permanece
  // Y la unidad 102 desaparece

  const { nombreLista, lista, tabla } = await prepararLista(page, { pisos: '1', unidadesPorPiso: '2' });

  await lista.abrirGrilla();
  await tabla.eliminar('102');
  await expect(lista.botonLista(nombreLista)).toBeVisible();
  await expect(tabla.fila('101')).toBeVisible();
  await expect(tabla.fila('102')).toHaveCount(0);
});

test('eliminar la ultima unidad elimina la lista y la unidad', async ({ page }) => {
  // Dado una lista con una sola unidad
  // Cuando elimino esa unidad
  // Entonces la lista se elimina automáticamente
  // Y la unidad queda sin lista y también desaparece
  // Y al volver a entrar a Unidades la lista y la unidad siguen eliminadas

  const { nombreLista, lista, tabla, navegacion } = await prepararLista(page, { pisos: '1', unidadesPorPiso: '1' });

  await lista.abrirGrilla();
  await tabla.eliminar('101');
  await expect(lista.botonLista(nombreLista)).toHaveCount(0);
  await expect(tabla.fila('101')).toHaveCount(0);
  await navegacion.reingresarAUnidades();
  await expect(lista.botonLista(nombreLista)).toHaveCount(0);
  await expect(tabla.fila('101')).toHaveCount(0);
});

test('no registrar el proyecto sin campos obligatorios', async ({ page }) => {
  // Dado el formulario de un proyecto nuevo
  // Cuando falta el nombre, la moneda o la razón social
  // Entonces Registrar sigue deshabilitado
  // Y no se crea el proyecto

  const proyecto = new ProyectoPage(page);
  const nombre = `QA ${Date.now()}`;

  await proyecto.abrirNuevo();
  await expect(proyecto.etiquetaNombre).toBeVisible();
  await expect(proyecto.etiquetaMoneda).toBeVisible();
  await expect(proyecto.etiquetaRazonSocial).toBeVisible();
  await registroBloqueado(page, proyecto);

  await proyecto.inputNombre.fill(nombre);
  await registroBloqueado(page, proyecto);

  await proyecto.completarSin(nombre, 'moneda');
  await registroBloqueado(page, proyecto);

  await proyecto.elegirMoneda();
  await proyecto.vaciarRazonSocial();
  await registroBloqueado(page, proyecto);
});

test('rechazar un template que no es excel', async ({ page }) => {
  // Dado un proyecto con su lista inicial
  // Cuando cargo un archivo que no es el Excel de unidades
  // Entonces la app avisa que el archivo no es válido
  // Y no se crea otra lista
  // Y la lista original y la unidad 101 siguen

  const { nombreLista, lista, tabla } = await prepararLista(page);

  await lista.abrirGrilla();
  await lista.enviarTemplate(templateInvalido);
  await expect(lista.errorArchivoInvalido()).toBeVisible();
  await lista.cancelarCarga();
  await expect(lista.textoLista(nombreLista).first()).toBeVisible();
  await expect(lista.listasImportadas()).toHaveCount(0);
  await expect(tabla.fila('101')).toBeVisible();
});

test.describe('validaciones de precio', () => {
  async function listaConPrecio(page: Page, precio: string) {
    const escenario = await prepararLista(page);
    await escenario.lista.abrirGrilla();
    await escenario.tabla.editarPrecio('101', precio);
    return escenario.tabla;
  }

  test('un precio negativo se guarda sin el signo', async ({ page }) => {
    // Dado la unidad 101 con precio 0,00
    // Cuando cargo un precio negativo
    // Entonces se guarda el importe sin el signo
    // Y el total pasa a ese valor

    const { lista, tabla } = await prepararLista(page);
    const precio = '50';

    await lista.abrirGrilla();
    await expect(tabla.celdaPrecio('101')).toContainText('0,00');
    await expect(await tabla.total()).toContainText('0,00');
    await tabla.cargarConSigno('101', precio);
    await expect(tabla.celdaPrecio('101')).toContainText(precio);
    await expect(tabla.celdaPrecio('101')).not.toContainText('-');
    await expect(await tabla.total()).toContainText(precio);
    await expect(tabla.alertaActualizacion()).toHaveCount(0);
  });

  test('un texto no cambia el precio', async ({ page }) => {
    // Dado la unidad 101 con un precio cargado
    // Cuando escribo texto en el precio
    // Entonces la app avisa que no pudo actualizar la unidad
    // Y el importe queda igual

    const tabla = await listaConPrecio(page, '50');

    await tabla.intentarPrecio('101', 'abc');
    await expect(tabla.errorActualizacion().first()).toBeVisible();
    await tabla.cerrarErrorActualizacion();
    await expect(tabla.celdaPrecio('101')).not.toContainText('abc');
    await tabla.soltarEdicion();
    await expect(await tabla.total()).toContainText('50');
  });

  test('un precio vacío no cambia el importe', async ({ page }) => {
    // Dado la unidad 101 con un precio cargado
    // Cuando dejo el precio vacío
    // Entonces el importe queda igual

    const tabla = await listaConPrecio(page, '50');

    await tabla.intentarPrecio('101', '');
    await tabla.soltarEdicion();
    await expect(await tabla.total()).toContainText('50');
  });
});
