import { test, expect, Page } from '@playwright/test';
import {
  Routes,
  Listado,
  FormModal,
  EditModal,
  RenewModal,
  HistoryModal,
  EmpresaPicker,
} from './helpers/selectors';

/**
 * Prestamos backoffice smoke tests.
 *
 * Covers:
 *  - read flows (list, dashboard, filters, net position) as admin
 *  - full create → edit → history → renew → clear → delete lifecycle (serial)
 *  - role gating for consulta, contabilidad, tesoreria
 *
 * Assumes globalSetup has re-seeded the DB with 7 baseline prestamos:
 *  5 ACTIVE (2 USD, 2 ARS, 1 USDC), 1 CLEARED (ARS), 1 RENEWED parent (ARS).
 */

// ---------- Read flows (admin) ----------

test.describe('Prestamos read flows as admin', () => {
  test.use({ storageState: '.auth/admin.json' });

  test('list renders with 7 seeded prestamos', async ({ page }) => {
    await page.goto(Routes.PRESTAMOS);
    await expect(page.getByRole('heading', { name: Listado.PAGE_HEADING })).toBeVisible();
    await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(7);
  });

  test('dashboard summary shows 3 currency cards (USD, ARS, USDC)', async ({ page }) => {
    await page.goto(Routes.PRESTAMOS);
    // Summary grid has one card per currency with active loans. Seed has active
    // in USD, ARS, and USDC → 3 cards expected.
    const cards = page.locator(Listado.SUMMARY_CARD);
    await expect(cards).toHaveCount(3);
    // Use regex with a space before "·" to distinguish "USD · N activos"
    // from "USDC · N activos" (both contain the substring "USD").
    await expect(cards.filter({ hasText: /USD ·/ })).toHaveCount(1);
    await expect(cards.filter({ hasText: /ARS ·/ })).toHaveCount(1);
    await expect(cards.filter({ hasText: /USDC ·/ })).toHaveCount(1);
  });

  test('net position section shows 3 currency blocks', async ({ page }) => {
    await page.goto(Routes.PRESTAMOS);
    const blocks = page.locator(Listado.NET_POSITION_BLOCK);
    await expect(blocks).toHaveCount(3);
  });

  test('filter by status=ACTIVE then Buscar shows only active loans', async ({ page }) => {
    await page.goto(Routes.PRESTAMOS);
    // Wait for initial load
    await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(7);

    // Select first filter = status
    await page.locator(Listado.STATUS_FILTER).selectOption('ACTIVE');
    await page.locator(Listado.BUSCAR_BUTTON).click();

    // Seed has 5 ACTIVE prestamos
    await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(5);

    // All visible status badges should read "Activo"
    const badges = page.locator(Listado.TABLE_ROW).locator(Listado.STATUS_BADGE);
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      await expect(badges.nth(i)).toHaveText(/activo/i);
    }
  });

  test('filter by currency=USDC then Buscar shows 1 row + 1 summary card', async ({ page }) => {
    await page.goto(Routes.PRESTAMOS);
    await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(7);

    await page.locator(Listado.CURRENCY_FILTER).selectOption('USDC');
    await page.locator(Listado.BUSCAR_BUTTON).click();

    await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(1);
    // Dashboard should re-fetch with ?currency=USDC → only 1 card
    await expect(page.locator(Listado.SUMMARY_CARD)).toHaveCount(1);
    await expect(page.locator(Listado.SUMMARY_CARD).first()).toContainText('USDC');
  });

  test('Limpiar resets filters and reloads all loans', async ({ page }) => {
    await page.goto(Routes.PRESTAMOS);
    await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(7);

    await page.locator(Listado.CURRENCY_FILTER).selectOption('USDC');
    await page.locator(Listado.BUSCAR_BUTTON).click();
    await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(1);

    await page.locator(Listado.LIMPIAR_BUTTON).click();
    await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(7);
    await expect(page.locator(Listado.SUMMARY_CARD)).toHaveCount(3);
  });
});

// ---------- Full lifecycle (admin, serial) ----------

test.describe('Prestamos lifecycle (admin)', () => {
  test.use({ storageState: '.auth/admin.json' });
  test.describe.configure({ mode: 'serial' });

  let createdRowLocator: ReturnType<Page['locator']>;
  // Use a unique capital value to identify our created loan in the table
  const LIFECYCLE_CAPITAL = '123456';

  test('1. create a new prestamo via form modal', async ({ page }) => {
    await page.goto(Routes.PRESTAMOS);
    const initialCount = await page.locator(Listado.TABLE_ROW).count();

    // Open modal
    await page.locator(Listado.REGISTER_BUTTON).click();
    await expect(page.locator(FormModal.HOST)).toBeVisible();

    const modal = page.locator(FormModal.HOST);

    // Lender picker: search "Perc" → select first result
    const lenderPicker = modal.locator(EmpresaPicker.HOST).first();
    await lenderPicker.locator(EmpresaPicker.INPUT).fill('Perc');
    await lenderPicker.locator(EmpresaPicker.DROPDOWN_ITEM).first().waitFor();
    await lenderPicker.locator(EmpresaPicker.DROPDOWN_ITEM).first().click();
    await expect(lenderPicker.locator(EmpresaPicker.SELECTED_CHIP)).toBeVisible();

    // Borrower picker: search "Inver"
    const borrowerPicker = modal.locator(EmpresaPicker.HOST).nth(1);
    await borrowerPicker.locator(EmpresaPicker.INPUT).fill('Inver');
    await borrowerPicker.locator(EmpresaPicker.DROPDOWN_ITEM).first().waitFor();
    await borrowerPicker.locator(EmpresaPicker.DROPDOWN_ITEM).first().click();
    await expect(borrowerPicker.locator(EmpresaPicker.SELECTED_CHIP)).toBeVisible();

    // Fill the rest of the form
    await modal.locator(FormModal.CAPITAL_INPUT).fill(LIFECYCLE_CAPITAL);
    await modal.locator(FormModal.RATE_INPUT).fill('10');
    await modal.locator(FormModal.DUE_DATE_INPUT).fill('2026-12-31');

    await modal.getByRole('button', { name: FormModal.SUBMIT_BUTTON_NAME }).click();

    // Modal closes + row added
    await expect(page.locator(FormModal.HOST)).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(initialCount + 1);

    // Find our row by unique capital value — formatted as "USD 123.456"
    createdRowLocator = page.locator(Listado.TABLE_ROW).filter({ hasText: '123.456' });
    await expect(createdRowLocator).toHaveCount(1);
  });

  test('2. edit the prestamo with a reason', async ({ page }) => {
    await page.goto(Routes.PRESTAMOS);
    const targetRow = page.locator(Listado.TABLE_ROW).filter({ hasText: '123.456' });
    await targetRow.locator(Listado.ACTION_EDIT_BUTTON).click();

    const modal = page.locator(EditModal.HOST);
    await expect(modal).toBeVisible();

    // Change rate and fill reason
    await modal.locator(EditModal.RATE_INPUT).fill('15');
    await modal.locator(EditModal.REASON_TEXTAREA).fill('Ajuste de tasa por E2E test');

    await modal.getByRole('button', { name: EditModal.SUBMIT_BUTTON_NAME }).click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Updated rate should now be 15% in the row
    const updatedRow = page.locator(Listado.TABLE_ROW).filter({ hasText: '123.456' });
    await expect(updatedRow).toContainText('15%');
  });

  test('3. history modal shows Creado + Editado entries', async ({ page }) => {
    await page.goto(Routes.PRESTAMOS);
    const targetRow = page.locator(Listado.TABLE_ROW).filter({ hasText: '123.456' });
    await targetRow.locator(Listado.ACTION_HISTORY_BUTTON).click();

    const modal = page.locator(HistoryModal.HOST);
    await expect(modal).toBeVisible();
    // Should have at least 2 entries (Creado + Editado)
    await expect(modal.locator(HistoryModal.ENTRY)).toHaveCount(2);
    await expect(modal).toContainText(/creado/i);
    await expect(modal).toContainText(/editado/i);

    // Close modal by clicking the X in glass-modal
    await modal.locator('.close-btn').click();
    await expect(modal).not.toBeVisible();
  });

  test('4. renew creates a child ACTIVE loan', async ({ page }) => {
    await page.goto(Routes.PRESTAMOS);
    const initialCount = await page.locator(Listado.TABLE_ROW).count();

    // Before renewing: our loan is the only 123.456 row and it's ACTIVE
    const beforeTarget = page.locator(Listado.TABLE_ROW).filter({ hasText: '123.456' });
    await expect(beforeTarget).toHaveCount(1);
    await beforeTarget.locator(Listado.ACTION_RENEW_BUTTON).click();

    const modal = page.locator(RenewModal.HOST);
    await expect(modal).toBeVisible();

    // dueDate is the only required field (capital pre-filled with total)
    await modal.locator(RenewModal.DUE_DATE_INPUT).fill('2027-06-30');
    await modal.getByRole('button', { name: RenewModal.SUBMIT_BUTTON_NAME }).click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // One more row exists now (the child). Because days=0 → interest=0, the child
    // inherits capital 123.456 — so BOTH parent and child match the filter.
    await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(initialCount + 1);
    const ourLoans = page.locator(Listado.TABLE_ROW).filter({ hasText: '123.456' });
    await expect(ourLoans).toHaveCount(2);

    // One of them is RENOVADO (the parent), the other ACTIVE (the child)
    await expect(
      ourLoans.filter({ has: page.locator('.badge', { hasText: /^Renovado$/ }) }),
    ).toHaveCount(1);
    await expect(
      ourLoans.filter({ has: page.locator('.badge', { hasText: /^Activo$/ }) }),
    ).toHaveCount(1);
  });

  test('5. clear the active child via confirm dialog', async ({ page }) => {
    await page.goto(Routes.PRESTAMOS);

    // The ACTIVE child: filter by 123.456 + Activo badge
    const activeChildRow = page
      .locator(Listado.TABLE_ROW)
      .filter({ hasText: '123.456' })
      .filter({ has: page.locator('.badge', { hasText: /^Activo$/ }) });
    await expect(activeChildRow).toHaveCount(1);
    await activeChildRow.locator(Listado.ACTION_CLEAR_BUTTON).click();

    // Confirm dialog — the button in the dialog also has title="Cancelar préstamo"
    // from our confirmText prop, so match by role+name.
    // Match the modal-overlay directly (the outer <app-confirm-dialog> host has
    // 0x0 size so Playwright sees it as hidden even when the overlay is showing).
    const dialog = page.locator('app-confirm-dialog .modal-overlay');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /^cancelar préstamo$/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // After clearing: no active 123.456, one cancelled 123.456
    await expect(
      page
        .locator(Listado.TABLE_ROW)
        .filter({ hasText: '123.456' })
        .filter({ has: page.locator('.badge', { hasText: /^Activo$/ }) }),
    ).toHaveCount(0);
    await expect(
      page
        .locator(Listado.TABLE_ROW)
        .filter({ hasText: '123.456' })
        .filter({ has: page.locator('.badge', { hasText: /^Cancelado$/ }) }),
    ).toHaveCount(1);
  });

  test('6. delete the renewed parent via confirm dialog', async ({ page }) => {
    await page.goto(Routes.PRESTAMOS);
    const countBefore = await page.locator(Listado.TABLE_ROW).count();

    // Delete the RENOVADO parent (filter 123.456 + Renovado badge)
    const parentRow = page
      .locator(Listado.TABLE_ROW)
      .filter({ hasText: '123.456' })
      .filter({ has: page.locator('.badge', { hasText: /^Renovado$/ }) });
    await expect(parentRow).toHaveCount(1);
    await parentRow.locator(Listado.ACTION_DELETE_BUTTON).click();

    // Match the modal-overlay directly (the outer <app-confirm-dialog> host has
    // 0x0 size so Playwright sees it as hidden even when the overlay is showing).
    const dialog = page.locator('app-confirm-dialog .modal-overlay');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /^eliminar$/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // Row count decreased; the RENOVADO row is gone
    await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(countBefore - 1);
    await expect(
      page
        .locator(Listado.TABLE_ROW)
        .filter({ hasText: '123.456' })
        .filter({ has: page.locator('.badge', { hasText: /^Renovado$/ }) }),
    ).toHaveCount(0);
  });
});

// ---------- Role gating ----------

test.describe('Role gating — consulta (read only)', () => {
  test.use({ storageState: '.auth/consulta.json' });

  test('consulta user sees list but no action buttons', async ({ page }) => {
    await page.goto(Routes.PRESTAMOS);
    await expect(page.locator(Listado.TABLE_ROW).first()).toBeVisible();

    // No "+ Registrar Préstamo" button
    await expect(
      page.locator(Listado.REGISTER_BUTTON),
    ).toHaveCount(0);

    // No Editar/Renovar/Cancelar/Eliminar buttons anywhere in the table
    await expect(page.locator(Listado.ACTION_EDIT_BUTTON)).toHaveCount(0);
    await expect(page.locator(Listado.ACTION_RENEW_BUTTON)).toHaveCount(0);
    await expect(page.locator(Listado.ACTION_CLEAR_BUTTON)).toHaveCount(0);
    await expect(page.locator(Listado.ACTION_DELETE_BUTTON)).toHaveCount(0);
  });
});

test.describe('Role gating — contabilidad (read only)', () => {
  test.use({ storageState: '.auth/contabilidad.json' });

  test('contabilidad user sees list but no action buttons', async ({ page }) => {
    await page.goto(Routes.PRESTAMOS);
    await expect(page.locator(Listado.TABLE_ROW).first()).toBeVisible();
    await expect(
      page.locator(Listado.REGISTER_BUTTON),
    ).toHaveCount(0);
    await expect(page.locator(Listado.ACTION_EDIT_BUTTON)).toHaveCount(0);
    await expect(page.locator(Listado.ACTION_DELETE_BUTTON)).toHaveCount(0);
  });
});

test.describe('Role gating — tesoreria (write except delete)', () => {
  test.use({ storageState: '.auth/tesoreria.json' });

  test('tesoreria sees write buttons but not delete', async ({ page }) => {
    await page.goto(Routes.PRESTAMOS);
    await expect(page.locator(Listado.TABLE_ROW).first()).toBeVisible();

    // Sees the register button
    await expect(
      page.locator(Listado.REGISTER_BUTTON),
    ).toBeVisible();

    // Sees at least one Editar button (on an ACTIVE row)
    await expect(page.locator(Listado.ACTION_EDIT_BUTTON).first()).toBeVisible();
    await expect(page.locator(Listado.ACTION_RENEW_BUTTON).first()).toBeVisible();
    await expect(page.locator(Listado.ACTION_CLEAR_BUTTON).first()).toBeVisible();

    // Does NOT see delete buttons
    await expect(page.locator(Listado.ACTION_DELETE_BUTTON)).toHaveCount(0);
  });
});
