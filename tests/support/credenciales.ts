export function credenciales() {
  const user = process.env.LEBANE_USER?.trim();
  const password = process.env.LEBANE_PASSWORD?.trim();
  if (!user || !password) {
    throw new Error('Faltan LEBANE_USER o LEBANE_PASSWORD en .env');
  }
  return { user, password };
}
