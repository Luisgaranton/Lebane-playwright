import { expect, test } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { credenciales } from '../support/credenciales';

test('rechazar el ingreso con contraseña incorrecta', async ({ page }) => {
  // Dado la pantalla de ingreso
  // Cuando uso el usuario correcto con una contraseña que no es
  // Entonces no entra al sistema
  // Y avisa que controle los datos

  const { user } = credenciales();
  const login = new LoginPage(page);
  await login.goto();
  await login.intentarIngreso(user, 'clave-invalida');

  await expect(login.errorIngreso).toBeVisible();
  await expect(login.avisoCorreo).toBeVisible();
  await expect(login.avisoContrasena).toBeVisible();
  await expect(page.getByRole('button', { name: 'Agregar proyecto' })).toHaveCount(0);
  await expect(page).toHaveURL(/\/sign-in/);
});
