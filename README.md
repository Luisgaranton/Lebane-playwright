# Automatización — Lista de precios de unidades (Lebane)

Tests end to end de la lista de precios de unidades en un proyecto tipo Desarrolladora, sobre el ambiente de prueba de Lebane.

URL: `https://tst.lebane.app`

## Requisitos

- Node.js 18 o superior
- Las credenciales del ejercicio (llegan por mail; no van en el repositorio)

## Instalación

```bash
npm install
npx playwright install chromium
```

Copiá `.env.example` a `.env` y completá el usuario y la contraseña:

```bash
cp .env.example .env
```

```env
LEBANE_URL=https://tst.lebane.app
USER=tu-usuario
PASSWORD=tu-contraseña
```

## Cómo correr los tests

```bash
npm test
```

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm run test:e2e` | Corre solo `tests/e2e` |
| `npm run test:ui` | Abre la UI de Playwright |
| `npm run test:report` | Abre el reporte HTML de la última corrida |

La suite usa Chromium, corre en serie (`workers: 1`) y apunta a la cuenta compartida del ambiente de prueba. Cada test crea su propio proyecto, así que una corrida completa tarda unos minutos y deja proyectos nuevos en esa cuenta.

Si un test falla, Playwright guarda trace, screenshot y video en `test-results/`. Esos archivos no se suben al repositorio.

## Estructura

```text
pages/                  Page objects (login y lista de precios)
tests/e2e/              Casos de la lista de precios
fixtures/               Template de unidades que se sube en el caso 3
playwright.config.ts    URL, browser, timeouts y reporte
.env.example            Variables que hay que completar en local
```

`pages/login.page.ts` entra a la app. `pages/lista-precios.page.ts` crea el proyecto, arma la lista inicial y opera la grilla (alta manual, template, edición de precio y borrado). Los tests en `tests/e2e/lista-precios.spec.ts` 

## Casos cubiertos

Happy path:

1. **Crear proyecto con lista de precios inicial.** Se completa el formulario, se nombra la lista y se verifica que el proyecto, la lista y la unidad 101 quedaron creados.
2. **Agregar una unidad a mano.** La unidad aparece con el precio cargado y el total de la lista pasa a ese valor.
3. **Cargar el template.** Subir `fixtures/template-unidades.xlsx` crea una lista nueva. La lista original sigue existiendo. Cada fila de la grilla se compara contra el Excel (número, tipología, orientación, m², precio, moneda, estado y piso) y el total es la suma de los precios del archivo.
4. **Modificar el precio.** Editar la unidad 101 actualiza esa lista y su total, sin crear otra lista.

Edge cases:

5. **Eliminar una unidad cuando hay más de una.** Se borra la 102. La lista y la unidad 101 siguen.
6. **Eliminar la última unidad.** La lista desaparece sola.
7. **La unidad sin lista también se elimina.** Después del caso anterior, la unidad 101 ya no está. Se vuelve a entrar a Unidades y la lista y la unidad siguen eliminadas.

## Decisiones de diseño

- **Page Object.** Los locators y los flujos de pantalla viven en `pages/`. El spec se lee como el caso de negocio.
- **Un proyecto por test.** El nombre lleva un timestamp (`QA <timestamp>`, `Lista <timestamp>`). Así los casos no comparten datos y se pueden leer el resultado en la app si algo falla.
- **Una sola corrida a la vez.** `fullyParallel: false` y `workers: 1` porque todos los tests usan la misma cuenta. En paralelo se pisarían el menú y el proyecto activo.
- **El Excel es la fuente esperada.** El caso del template no hardcodea las 9 filas: las lee con ExcelJS y afirma la grilla contra el archivo. Si cambia el template, cambia la expectativa.
- **Locators.** Se usan `data-cy` en el formulario de proyecto (la app los expone) y roles accesibles (`button`, `link`, `tab`, `dialog`) en el resto. El número de unidad se busca en la fila de la grilla.
- **Formato de Argentina.** El browser corre con `locale: es-AR` y `America/Argentina/Buenos_Aires`. Los precios se afirman con el formato que muestra la pantalla (`125.000`), no con el número crudo.
- **Viewport ancho.** La grilla tiene muchas columnas. El test usa 1600×1200 y, cuando hace falta, desplaza la tabla para llegar a Precio unidad.
- **Reintento solo donde la UI es inestable.** Elegir una opción del autocomplete a veces no confirma el valor, y borrar una unidad a veces responde `Error al eliminar la unidad` sin borrarla. Esos dos flujos reintentan la acción. El resto de las verificaciones falla a la primera (`retries: 0`), para no esconder un caso rojo.
- **Credenciales afuera del código.** Van en `.env`, que está en `.gitignore`. `.env.example` documenta los nombres de las variables.

## Otros casos que testearía

Estos casos los dejaría como siguiente capa porque cubren reglas que los siete escenarios no ejercitan, o porque protegen datos que la grilla podría mostrar bien de casualidad.

1. **Lista sin nombre.** La regla dice que el nombre es opcional. Hoy siempre se carga uno. Habría que guardar con el campo vacío y verificar que igual nace una lista (con el nombre que genere la app) y su unidad inicial.
2. **Precio y total en cero al nacer la lista.** La unidad inicial debería mostrarse en `0,00` y el total arrancar en `0,00`, antes de cualquier edición. Confirma el estado de partida y no solo que la fila existe.
3. **El alta manual no abre otra lista.** Crear una unidad a mano tiene que sumarla a la lista actual, dejar la 101 en su lugar y no generar una `Lista precios dd/mm/aaaa`. Esa es la diferencia con el template, que sí crea una lista nueva.
4. **El total baja al borrar una unidad.** En el caso 5 se comprueba que la lista sigue y que la 102 desaparece. Falta afirmar que el total restó el precio de la unidad eliminada y que el de la 101 no cambió.
5. **Campos obligatorios del proyecto.** Registrar sin nombre, sin moneda o sin razón social no debería crear el proyecto. Evita dejar proyectos a medias si el formulario valida mal.
6. **Template inválido.** Un archivo que no es Excel, o un Excel sin la hoja `Unidades`, no debería crear una lista ni modificar la que ya existe. El camino feliz no dice qué pasa cuando el archivo viene mal.
7. **Número de unidad repetido.** Cargar dos veces el mismo número en la misma lista. Hay que fijar si se rechaza o se permite, porque un duplicado rompe la fila que el resto de los tests identifica por número.
8. **Precio inválido.** Negativo, texto o vacío al editar. El total no debería quedar en un valor que no se puede sumar, ni la celda aceptar algo que la pantalla después no puede mostrar.
9. **Cancelar el borrado.** El diálogo pide confirmar. Cancelar (o cerrar) tiene que dejar la unidad y el total como estaban.
10. **Login inválido.** Usuario o contraseña incorrectos no deberían entrar al inicio. El `beforeEach` solo cubre la sesión válida.
11. **Monedas distintas en el total.** El proyecto se crea en ARS y el template trae precios en USD. Habría que verificar que cada unidad conserva la moneda del archivo y que el total no suma ARS y USD como si fueran la misma moneda.

## Limitación conocidas

Los tests no borran el proyecto al terminar. Cada corrida suma proyectos `QA <timestamp>` en la cuenta de prueba. Los nombres son únicos para poder distinguirlos, pero el ambiente se va llenando.

## Idea a futuro

Un skill con las convenciones de este repo (page objects, un proyecto por test, asserts de grilla y total) para generar el spec a partir de una tarjeta de Jira.

La entrada es el título, la descripción y los criterios de aceptación: pegados en el chat o leídos con una conexión a Jira. Las mismas instrucciones sirven en Cursor, Claude o Copilot; cambia solo el archivo donde viven (`SKILL.md`, `CLAUDE.md` o `.github/copilot-instructions.md`).

El ticket define el caso. Los selectores salen de la pantalla o del page object que ya exista.
