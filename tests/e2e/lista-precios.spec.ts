import path from 'path';
import { test } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { ListaPreciosPage } from '../../pages/lista-precios.page';

const templateUnidades = path.join(__dirname, '../../fixtures/template-unidades.xlsx');

test.use({ viewport: { width: 1600, height: 1200 } });

test.beforeEach(async ({ page }) => {
  const user = process.env.USER?.trim();
  const password = process.env.PASSWORD?.trim();
  if (!user || !password) throw new Error('Faltan USER o PASSWORD en .env');

  const login = new LoginPage(page);
  await login.goto();
  await login.login(user, password);
});

test('crear proyecto con lista de precios inicial', async ({ page }) => {
  // Dado que el usuario inició sesión
  // Cuando crea un proyecto y nombra la lista de precios inicial
  // Entonces el proyecto queda creado
  // Y la grilla muestra esa lista con la unidad 101

  const lista = new ListaPreciosPage(page);
  const { nombreProyecto, nombreLista } = await lista.crearProyectoConLista();

  await lista.verificarProyectoCreado(nombreProyecto);
  await lista.abrirGrilla();
  await lista.verificarListaVisible(nombreLista);
  await lista.verificarUnidadVisible('101');
});

test('agregar unidad manualmente con su precio', async ({ page }) => {
  // Dado un proyecto con una lista de precios inicial
  // Cuando agrego una unidad de forma manual con su precio
  // Entonces la unidad aparece con ese precio
  // Y el total de la lista muestra el valor nuevo

  const lista = new ListaPreciosPage(page);
  await lista.crearProyectoConLista();
  const numero = `9${Date.now().toString().slice(-3)}`;
  const precio = '125000';

  await lista.abrirGrilla();
  await lista.agregarUnidad(numero, precio);
  await lista.verificarPrecio(numero, precio);
  await lista.esperarTotalPrecio(precio);
});

test('cargar unidades por template crea una lista nueva', async ({ page }) => {
  // Dado un proyecto con una lista inicial de 3 pisos
  // Cuando cargo el template de unidades
  // Entonces se crea una lista nueva con las unidades del archivo
  // Y la lista original sigue existiendo
  // Y cada fila coincide con el Excel
  // Y el total es la suma de los precios del archivo

  const lista = new ListaPreciosPage(page);
  const { nombreLista } = await lista.crearProyectoConLista({ pisos: '3', unidadesPorPiso: '1' });

  await lista.abrirGrilla();
  await lista.cargarTemplate(templateUnidades);
  await lista.verificarListaImportada(nombreLista);
  await lista.verificarUnidadesDelTemplate(templateUnidades);
});

test('modificar el precio de una unidad actualiza la lista', async ({ page }) => {
  // Dado un proyecto con una sola lista y la unidad 101
  // Cuando modifico el precio de la unidad 101
  // Entonces la misma lista muestra el precio nuevo
  // Y el total se actualiza con ese valor
  // Y no se creó otra lista

  const lista = new ListaPreciosPage(page);
  const { nombreLista } = await lista.crearProyectoConLista();
  const precio = '180000';

  await lista.abrirGrilla();
  await lista.modificarPrecio('101', precio);
  await lista.verificarPrecio('101', precio);
  await lista.esperarTotalPrecio(precio);
  await lista.verificarUnaSolaLista(nombreLista);
});

test('eliminar una unidad conserva la lista', async ({ page }) => {
  // Dado una lista con las unidades 101 y 102
  // Cuando elimino la unidad 102
  // Entonces la lista sigue existiendo
  // Y la unidad 101 permanece
  // Y la unidad 102 desaparece

  const lista = new ListaPreciosPage(page);
  const { nombreLista } = await lista.crearProyectoConLista({ pisos: '1', unidadesPorPiso: '2' });

  await lista.abrirGrilla();
  await lista.eliminarUnidad('102');
  await lista.verificarListaVisible(nombreLista);
  await lista.verificarUnidadVisible('101');
  await lista.verificarUnidadAusente('102');
});

test('eliminar la ultima unidad elimina la lista y la unidad', async ({ page }) => {
  // Dado una lista con una sola unidad
  // Cuando elimino esa unidad
  // Entonces la lista se elimina automáticamente
  // Y la unidad queda sin lista y también desaparece
  // Y al volver a entrar a Unidades la lista y la unidad siguen eliminadas

  const lista = new ListaPreciosPage(page);
  const { nombreLista } = await lista.crearProyectoConLista({ pisos: '1', unidadesPorPiso: '1' });

  await lista.abrirGrilla();
  await lista.eliminarUnidad('101');
  await lista.verificarListaAusente(nombreLista);
  await lista.verificarUnidadAusente('101');
  await lista.reingresarAUnidades();
  await lista.verificarListaAusente(nombreLista);
  await lista.verificarUnidadAusente('101');
});
