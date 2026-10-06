import { test } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';

test('rechazar el ingreso con contraseña incorrecta', async ({ page }) => {
  // Dado la pantalla de ingreso
  // Cuando uso el usuario correcto con una contraseña que no es
  // Entonces no entra al sistema
  // Y avisa que controle los datos

  const user = process.env.USER?.trim();
  if (!user) throw new Error('Falta USER en .env');

  const login = new LoginPage(page);
  await login.goto();
  await login.intentarIngreso(user, 'clave-invalida');
  await login.verificarIngresoRechazado();
});
