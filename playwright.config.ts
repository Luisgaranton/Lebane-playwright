import path from 'path';
import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

dotenv.config();

const baseURL = (process.env.LEBANE_URL || 'https://tst.lebane.app').trim();
const authFile = path.join(__dirname, 'playwright/.auth/user.json');
const navegador = {
  ...devices['Desktop Chrome'],
  locale: 'es-AR',
  timezoneId: 'America/Argentina/Buenos_Aires',
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 180_000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      testMatch: /lista-precios\.spec\.ts/,
      use: {
        ...navegador,
        storageState: authFile,
      },
    },
    {
      name: 'chromium-sin-sesion',
      testMatch: /login\.spec\.ts/,
      use: navegador,
    },
  ],
});
