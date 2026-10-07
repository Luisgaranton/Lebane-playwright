import { Page } from '@playwright/test';
import { TablaUnidadesComponent } from '../../components/tabla-unidades.component';
import { DatosLista, ListaPreciosPage } from '../../pages/lista-precios.page';
import { NavegacionPage } from '../../pages/navegacion.page';
import { ProyectoPage } from '../../pages/proyecto.page';

let proyectoCreado: string | undefined;

export function olvidarProyecto() {
  proyectoCreado = undefined;
}

export function proyectoParaLimpiar() {
  return proyectoCreado;
}

export async function prepararLista(page: Page, datos?: DatosLista) {
  const proyecto = new ProyectoPage(page);
  const lista = new ListaPreciosPage(page);
  const tabla = new TablaUnidadesComponent(page);
  const navegacion = new NavegacionPage(page);
  const marca = Date.now();
  const nombreProyecto = `QA ${marca}`;
  const nombreLista = `Lista ${marca}`;

  proyectoCreado = await proyecto.crear(nombreProyecto);
  await lista.crearInicial(nombreLista, datos);

  return { nombreProyecto, nombreLista, proyecto, lista, tabla, navegacion };
}
