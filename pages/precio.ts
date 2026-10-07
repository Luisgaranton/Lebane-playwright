export function precioEnPantalla(valor: string) {
  const formateado = Number(valor).toLocaleString('es-AR');
  return new RegExp(formateado.replace(/\./g, '[.,]'));
}
