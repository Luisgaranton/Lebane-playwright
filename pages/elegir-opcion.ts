import { expect, Locator, Page } from '@playwright/test';

export async function elegirOpcion(page: Page, combo: Locator, opcion: string) {
  const listbox = page.getByRole('listbox');
  for (let intento = 0; intento < 3; intento += 1) {
    if (await listbox.isVisible()) await page.keyboard.press('Escape');
    await combo.click();
    await combo.fill(opcion);
    const option = page.getByRole('option', { name: opcion, exact: true });
    try {
      await option.click({ timeout: 5000 });
      await listbox.waitFor({ state: 'hidden', timeout: 1000 }).catch(async () => {
        await page.keyboard.press('Escape');
        await listbox.waitFor({ state: 'hidden' });
      });
      const chip = page.locator('.MuiChip-label', { hasText: opcion });
      if (await chip.count()) return;
      await expect(combo).toHaveValue(opcion, { timeout: 3000 });
      return;
    } catch {
      await page.keyboard.press('Escape');
    }
  }
  throw new Error(`No se pudo elegir "${opcion}"`);
}
