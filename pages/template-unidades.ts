import ExcelJS, { CellValue } from 'exceljs';

export type UnidadTemplate = {
  numero: string;
  tipologia: string;
  orientacion: string;
  m2Cubiertos: string;
  precio: string;
  moneda: string;
  estado: string;
  piso: string;
};

function textoCelda(valor: CellValue): string {
  if (valor == null) return '';
  if (typeof valor === 'number' || typeof valor === 'string') return String(valor).trim();
  if (typeof valor === 'object' && 'result' in valor) return textoCelda(valor.result as CellValue);
  if (typeof valor === 'object' && 'text' in valor && typeof valor.text === 'string') return valor.text.trim();
  if (typeof valor === 'object' && 'richText' in valor) return valor.richText.map((parte) => parte.text).join('').trim();
  return '';
}

export async function unidadesDelTemplate(archivo: string) {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(archivo);
  const hoja = libro.getWorksheet('Unidades');
  if (!hoja) throw new Error('El template no tiene la hoja Unidades');

  const unidades: UnidadTemplate[] = [];

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
