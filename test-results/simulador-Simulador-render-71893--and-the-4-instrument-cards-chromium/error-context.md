# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: simulador.spec.ts >> Simulador >> renders page header and the 4 instrument cards
- Location: e2e/simulador.spec.ts:14:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:4205/prestamos/simulador", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { Routes, Simulador } from './helpers/selectors';
  3  | 
  4  | /**
  5  |  * Simulador smoke tests.
  6  |  *
  7  |  * Uses admin storageState (any auth role works since the simulador is
  8  |  * visible to all authenticated roles).
  9  |  */
  10 | 
  11 | test.describe('Simulador', () => {
  12 |   test.use({ storageState: '.auth/admin.json' });
  13 | 
  14 |   test('renders page header and the 4 instrument cards', async ({ page }) => {
> 15 |     await page.goto(Routes.SIMULADOR);
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  16 |     await expect(page.getByRole('heading', { name: Simulador.PAGE_HEADING })).toBeVisible();
  17 |     await expect(page.locator(Simulador.INSTRUMENT_CARD)).toHaveCount(4);
  18 | 
  19 |     // Each instrument card has an accent-colored header with the product name
  20 |     const headers = await page.locator(Simulador.INSTRUMENT_HEADER).allTextContents();
  21 |     expect(headers.length).toBe(4);
  22 |     expect(headers.join(' ')).toMatch(/Pagaré/);
  23 |     expect(headers.join(' ')).toMatch(/Títulos ON/);
  24 |     expect(headers.join(' ')).toMatch(/Crypto UY/);
  25 |   });
  26 | 
  27 |   test('changing currency to ARS reveals TC Referencial input', async ({ page }) => {
  28 |     await page.goto(Routes.SIMULADOR);
  29 | 
  30 |     // Initially USD — no TC input
  31 |     await expect(page.locator(Simulador.TC_INPUT)).toHaveCount(0);
  32 | 
  33 |     // Switch to ARS
  34 |     await page.locator(Simulador.CURRENCY_SELECT).selectOption('ARS');
  35 | 
  36 |     // TC Referencial input should appear
  37 |     await expect(page.locator(Simulador.TC_INPUT)).toBeVisible();
  38 |   });
  39 | 
  40 |   test('changing the amount updates the per-operation values', async ({ page }) => {
  41 |     await page.goto(Routes.SIMULADOR);
  42 | 
  43 |     // Grab the first instrument card's "Por op" value text
  44 |     const firstCard = page.locator(Simulador.INSTRUMENT_CARD).first();
  45 |     const firstRowInitial = await firstCard.locator('.row').first().locator('.v').textContent();
  46 | 
  47 |     // Change monto por operación to a different value
  48 |     await page.locator(Simulador.AMOUNT_INPUT).fill('500000');
  49 | 
  50 |     // Wait a beat for Angular change detection
  51 |     await page.waitForTimeout(200);
  52 | 
  53 |     const firstRowAfter = await firstCard.locator('.row').first().locator('.v').textContent();
  54 |     expect(firstRowAfter).not.toBe(firstRowInitial);
  55 |   });
  56 | 
  57 |   test('savings block shows a "Mejor" instrument value', async ({ page }) => {
  58 |     await page.goto(Routes.SIMULADOR);
  59 |     // The savings block has 4 savings-item divs, one of them labeled "Mejor: ..."
  60 |     const mejorLabel = page.locator('.savings-label', { hasText: /Mejor:/ });
  61 |     await expect(mejorLabel).toBeVisible();
  62 |   });
  63 | });
  64 | 
```