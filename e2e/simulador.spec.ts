import { test, expect } from '@playwright/test';
import { Routes, Simulador } from './helpers/selectors';

/**
 * Simulador smoke tests.
 *
 * Uses admin storageState (any auth role works since the simulador is
 * visible to all authenticated roles).
 */

test.describe('Simulador', () => {
  test.use({ storageState: '.auth/admin.json' });

  test('renders page header and the 4 instrument cards', async ({ page }) => {
    await page.goto(Routes.SIMULADOR);
    await expect(page.getByRole('heading', { name: Simulador.PAGE_HEADING })).toBeVisible();
    await expect(page.locator(Simulador.INSTRUMENT_CARD)).toHaveCount(4);

    // Each instrument card has an accent-colored header with the product name
    const headers = await page.locator(Simulador.INSTRUMENT_HEADER).allTextContents();
    expect(headers.length).toBe(4);
    expect(headers.join(' ')).toMatch(/Pagaré/);
    expect(headers.join(' ')).toMatch(/Títulos ON/);
    expect(headers.join(' ')).toMatch(/Crypto UY/);
  });

  test('changing currency to ARS reveals TC Referencial input', async ({ page }) => {
    await page.goto(Routes.SIMULADOR);

    // Initially USD — no TC input
    await expect(page.locator(Simulador.TC_INPUT)).toHaveCount(0);

    // Switch to ARS
    await page.locator(Simulador.CURRENCY_SELECT).selectOption('ARS');

    // TC Referencial input should appear
    await expect(page.locator(Simulador.TC_INPUT)).toBeVisible();
  });

  test('changing the amount updates the per-operation values', async ({ page }) => {
    await page.goto(Routes.SIMULADOR);

    // Grab the first instrument card's "Por op" value text
    const firstCard = page.locator(Simulador.INSTRUMENT_CARD).first();
    const firstRowInitial = await firstCard.locator('.row').first().locator('.v').textContent();

    // Change monto por operación to a different value
    await page.locator(Simulador.AMOUNT_INPUT).fill('500000');

    // Wait a beat for Angular change detection
    await page.waitForTimeout(200);

    const firstRowAfter = await firstCard.locator('.row').first().locator('.v').textContent();
    expect(firstRowAfter).not.toBe(firstRowInitial);
  });

  test('savings block shows a "Mejor" instrument value', async ({ page }) => {
    await page.goto(Routes.SIMULADOR);
    // The savings block has 4 savings-item divs, one of them labeled "Mejor: ..."
    const mejorLabel = page.locator('.savings-label', { hasText: /Mejor:/ });
    await expect(mejorLabel).toBeVisible();
  });
});
