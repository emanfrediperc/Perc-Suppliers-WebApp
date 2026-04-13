# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: prestamos.spec.ts >> Prestamos read flows as admin >> filter by status=ACTIVE then Buscar shows only active loans
- Location: e2e/prestamos.spec.ts:54:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:4205/prestamos", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | import {
  3   |   Routes,
  4   |   Listado,
  5   |   FormModal,
  6   |   EditModal,
  7   |   RenewModal,
  8   |   HistoryModal,
  9   |   EmpresaPicker,
  10  | } from './helpers/selectors';
  11  | 
  12  | /**
  13  |  * Prestamos backoffice smoke tests.
  14  |  *
  15  |  * Covers:
  16  |  *  - read flows (list, dashboard, filters, net position) as admin
  17  |  *  - full create → edit → history → renew → clear → delete lifecycle (serial)
  18  |  *  - role gating for consulta, contabilidad, tesoreria
  19  |  *
  20  |  * Assumes globalSetup has re-seeded the DB with 7 baseline prestamos:
  21  |  *  5 ACTIVE (2 USD, 2 ARS, 1 USDC), 1 CLEARED (ARS), 1 RENEWED parent (ARS).
  22  |  */
  23  | 
  24  | // ---------- Read flows (admin) ----------
  25  | 
  26  | test.describe('Prestamos read flows as admin', () => {
  27  |   test.use({ storageState: '.auth/admin.json' });
  28  | 
  29  |   test('list renders with 7 seeded prestamos', async ({ page }) => {
  30  |     await page.goto(Routes.PRESTAMOS);
  31  |     await expect(page.getByRole('heading', { name: Listado.PAGE_HEADING })).toBeVisible();
  32  |     await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(7);
  33  |   });
  34  | 
  35  |   test('dashboard summary shows 3 currency cards (USD, ARS, USDC)', async ({ page }) => {
  36  |     await page.goto(Routes.PRESTAMOS);
  37  |     // Summary grid has one card per currency with active loans. Seed has active
  38  |     // in USD, ARS, and USDC → 3 cards expected.
  39  |     const cards = page.locator(Listado.SUMMARY_CARD);
  40  |     await expect(cards).toHaveCount(3);
  41  |     // Use regex with a space before "·" to distinguish "USD · N activos"
  42  |     // from "USDC · N activos" (both contain the substring "USD").
  43  |     await expect(cards.filter({ hasText: /USD ·/ })).toHaveCount(1);
  44  |     await expect(cards.filter({ hasText: /ARS ·/ })).toHaveCount(1);
  45  |     await expect(cards.filter({ hasText: /USDC ·/ })).toHaveCount(1);
  46  |   });
  47  | 
  48  |   test('net position section shows 3 currency blocks', async ({ page }) => {
  49  |     await page.goto(Routes.PRESTAMOS);
  50  |     const blocks = page.locator(Listado.NET_POSITION_BLOCK);
  51  |     await expect(blocks).toHaveCount(3);
  52  |   });
  53  | 
  54  |   test('filter by status=ACTIVE then Buscar shows only active loans', async ({ page }) => {
> 55  |     await page.goto(Routes.PRESTAMOS);
      |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  56  |     // Wait for initial load
  57  |     await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(7);
  58  | 
  59  |     // Select first filter = status
  60  |     await page.locator(Listado.STATUS_FILTER).selectOption('ACTIVE');
  61  |     await page.locator(Listado.BUSCAR_BUTTON).click();
  62  | 
  63  |     // Seed has 5 ACTIVE prestamos
  64  |     await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(5);
  65  | 
  66  |     // All visible status badges should read "Activo"
  67  |     const badges = page.locator(Listado.TABLE_ROW).locator(Listado.STATUS_BADGE);
  68  |     const count = await badges.count();
  69  |     for (let i = 0; i < count; i++) {
  70  |       await expect(badges.nth(i)).toHaveText(/activo/i);
  71  |     }
  72  |   });
  73  | 
  74  |   test('filter by currency=USDC then Buscar shows 1 row + 1 summary card', async ({ page }) => {
  75  |     await page.goto(Routes.PRESTAMOS);
  76  |     await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(7);
  77  | 
  78  |     await page.locator(Listado.CURRENCY_FILTER).selectOption('USDC');
  79  |     await page.locator(Listado.BUSCAR_BUTTON).click();
  80  | 
  81  |     await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(1);
  82  |     // Dashboard should re-fetch with ?currency=USDC → only 1 card
  83  |     await expect(page.locator(Listado.SUMMARY_CARD)).toHaveCount(1);
  84  |     await expect(page.locator(Listado.SUMMARY_CARD).first()).toContainText('USDC');
  85  |   });
  86  | 
  87  |   test('Limpiar resets filters and reloads all loans', async ({ page }) => {
  88  |     await page.goto(Routes.PRESTAMOS);
  89  |     await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(7);
  90  | 
  91  |     await page.locator(Listado.CURRENCY_FILTER).selectOption('USDC');
  92  |     await page.locator(Listado.BUSCAR_BUTTON).click();
  93  |     await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(1);
  94  | 
  95  |     await page.locator(Listado.LIMPIAR_BUTTON).click();
  96  |     await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(7);
  97  |     await expect(page.locator(Listado.SUMMARY_CARD)).toHaveCount(3);
  98  |   });
  99  | });
  100 | 
  101 | // ---------- Full lifecycle (admin, serial) ----------
  102 | 
  103 | test.describe('Prestamos lifecycle (admin)', () => {
  104 |   test.use({ storageState: '.auth/admin.json' });
  105 |   test.describe.configure({ mode: 'serial' });
  106 | 
  107 |   let createdRowLocator: ReturnType<Page['locator']>;
  108 |   // Use a unique capital value to identify our created loan in the table
  109 |   const LIFECYCLE_CAPITAL = '123456';
  110 | 
  111 |   test('1. create a new prestamo via form modal', async ({ page }) => {
  112 |     await page.goto(Routes.PRESTAMOS);
  113 |     const initialCount = await page.locator(Listado.TABLE_ROW).count();
  114 | 
  115 |     // Open modal
  116 |     await page.locator(Listado.REGISTER_BUTTON).click();
  117 |     await expect(page.locator(FormModal.HOST)).toBeVisible();
  118 | 
  119 |     const modal = page.locator(FormModal.HOST);
  120 | 
  121 |     // Lender picker: search "Perc" → select first result
  122 |     const lenderPicker = modal.locator(EmpresaPicker.HOST).first();
  123 |     await lenderPicker.locator(EmpresaPicker.INPUT).fill('Perc');
  124 |     await lenderPicker.locator(EmpresaPicker.DROPDOWN_ITEM).first().waitFor();
  125 |     await lenderPicker.locator(EmpresaPicker.DROPDOWN_ITEM).first().click();
  126 |     await expect(lenderPicker.locator(EmpresaPicker.SELECTED_CHIP)).toBeVisible();
  127 | 
  128 |     // Borrower picker: search "Inver"
  129 |     const borrowerPicker = modal.locator(EmpresaPicker.HOST).nth(1);
  130 |     await borrowerPicker.locator(EmpresaPicker.INPUT).fill('Inver');
  131 |     await borrowerPicker.locator(EmpresaPicker.DROPDOWN_ITEM).first().waitFor();
  132 |     await borrowerPicker.locator(EmpresaPicker.DROPDOWN_ITEM).first().click();
  133 |     await expect(borrowerPicker.locator(EmpresaPicker.SELECTED_CHIP)).toBeVisible();
  134 | 
  135 |     // Fill the rest of the form
  136 |     await modal.locator(FormModal.CAPITAL_INPUT).fill(LIFECYCLE_CAPITAL);
  137 |     await modal.locator(FormModal.RATE_INPUT).fill('10');
  138 |     await modal.locator(FormModal.DUE_DATE_INPUT).fill('2026-12-31');
  139 | 
  140 |     await modal.getByRole('button', { name: FormModal.SUBMIT_BUTTON_NAME }).click();
  141 | 
  142 |     // Modal closes + row added
  143 |     await expect(page.locator(FormModal.HOST)).not.toBeVisible({ timeout: 5000 });
  144 |     await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(initialCount + 1);
  145 | 
  146 |     // Find our row by unique capital value — formatted as "USD 123.456"
  147 |     createdRowLocator = page.locator(Listado.TABLE_ROW).filter({ hasText: '123.456' });
  148 |     await expect(createdRowLocator).toHaveCount(1);
  149 |   });
  150 | 
  151 |   test('2. edit the prestamo with a reason', async ({ page }) => {
  152 |     await page.goto(Routes.PRESTAMOS);
  153 |     const targetRow = page.locator(Listado.TABLE_ROW).filter({ hasText: '123.456' });
  154 |     await targetRow.locator(Listado.ACTION_EDIT_BUTTON).click();
  155 | 
```