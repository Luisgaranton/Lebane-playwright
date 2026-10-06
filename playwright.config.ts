import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

dotenv.config();

const baseURL = (process.env.LEBANE_URL || 'https://tst.lebane.app').trim();

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
      name: 'chromium',
      testMatch: /tests\/e2e\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        locale: 'es-AR',
        timezoneId: 'America/Argentina/Buenos_Aires',
      },
    },
  ],
});