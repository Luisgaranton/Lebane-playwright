import fs from 'fs';
import path from 'path';
import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { credenciales } from './support/credenciales';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('guardar la sesion', async ({ page }) => {
  const { user, password } = credenciales();
  const login = new LoginPage(page);
  await login.goto();
  await login.login(user, password);
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
