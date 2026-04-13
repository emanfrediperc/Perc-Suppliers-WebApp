# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: prestamos.spec.ts >> Role gating — consulta (read only) >> consulta user sees list but no action buttons
- Location: e2e/prestamos.spec.ts:290:7

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
  191 | 
  192 |     // Before renewing: our loan is the only 123.456 row and it's ACTIVE
  193 |     const beforeTarget = page.locator(Listado.TABLE_ROW).filter({ hasText: '123.456' });
  194 |     await expect(beforeTarget).toHaveCount(1);
  195 |     await beforeTarget.locator(Listado.ACTION_RENEW_BUTTON).click();
  196 | 
  197 |     const modal = page.locator(RenewModal.HOST);
  198 |     await expect(modal).toBeVisible();
  199 | 
  200 |     // dueDate is the only required field (capital pre-filled with total)
  201 |     await modal.locator(RenewModal.DUE_DATE_INPUT).fill('2027-06-30');
  202 |     await modal.getByRole('button', { name: RenewModal.SUBMIT_BUTTON_NAME }).click();
  203 |     await expect(modal).not.toBeVisible({ timeout: 5000 });
  204 | 
  205 |     // One more row exists now (the child). Because days=0 → interest=0, the child
  206 |     // inherits capital 123.456 — so BOTH parent and child match the filter.
  207 |     await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(initialCount + 1);
  208 |     const ourLoans = page.locator(Listado.TABLE_ROW).filter({ hasText: '123.456' });
  209 |     await expect(ourLoans).toHaveCount(2);
  210 | 
  211 |     // One of them is RENOVADO (the parent), the other ACTIVE (the child)
  212 |     await expect(
  213 |       ourLoans.filter({ has: page.locator('.badge', { hasText: /^Renovado$/ }) }),
  214 |     ).toHaveCount(1);
  215 |     await expect(
  216 |       ourLoans.filter({ has: page.locator('.badge', { hasText: /^Activo$/ }) }),
  217 |     ).toHaveCount(1);
  218 |   });
  219 | 
  220 |   test('5. clear the active child via confirm dialog', async ({ page }) => {
  221 |     await page.goto(Routes.PRESTAMOS);
  222 | 
  223 |     // The ACTIVE child: filter by 123.456 + Activo badge
  224 |     const activeChildRow = page
  225 |       .locator(Listado.TABLE_ROW)
  226 |       .filter({ hasText: '123.456' })
  227 |       .filter({ has: page.locator('.badge', { hasText: /^Activo$/ }) });
  228 |     await expect(activeChildRow).toHaveCount(1);
  229 |     await activeChildRow.locator(Listado.ACTION_CLEAR_BUTTON).click();
  230 | 
  231 |     // Confirm dialog — the button in the dialog also has title="Cancelar préstamo"
  232 |     // from our confirmText prop, so match by role+name.
  233 |     // Match the modal-overlay directly (the outer <app-confirm-dialog> host has
  234 |     // 0x0 size so Playwright sees it as hidden even when the overlay is showing).
  235 |     const dialog = page.locator('app-confirm-dialog .modal-overlay');
  236 |     await expect(dialog).toBeVisible();
  237 |     await dialog.getByRole('button', { name: /^cancelar préstamo$/i }).click();
  238 |     await expect(dialog).not.toBeVisible({ timeout: 5000 });
  239 | 
  240 |     // After clearing: no active 123.456, one cancelled 123.456
  241 |     await expect(
  242 |       page
  243 |         .locator(Listado.TABLE_ROW)
  244 |         .filter({ hasText: '123.456' })
  245 |         .filter({ has: page.locator('.badge', { hasText: /^Activo$/ }) }),
  246 |     ).toHaveCount(0);
  247 |     await expect(
  248 |       page
  249 |         .locator(Listado.TABLE_ROW)
  250 |         .filter({ hasText: '123.456' })
  251 |         .filter({ has: page.locator('.badge', { hasText: /^Cancelado$/ }) }),
  252 |     ).toHaveCount(1);
  253 |   });
  254 | 
  255 |   test('6. delete the renewed parent via confirm dialog', async ({ page }) => {
  256 |     await page.goto(Routes.PRESTAMOS);
  257 |     const countBefore = await page.locator(Listado.TABLE_ROW).count();
  258 | 
  259 |     // Delete the RENOVADO parent (filter 123.456 + Renovado badge)
  260 |     const parentRow = page
  261 |       .locator(Listado.TABLE_ROW)
  262 |       .filter({ hasText: '123.456' })
  263 |       .filter({ has: page.locator('.badge', { hasText: /^Renovado$/ }) });
  264 |     await expect(parentRow).toHaveCount(1);
  265 |     await parentRow.locator(Listado.ACTION_DELETE_BUTTON).click();
  266 | 
  267 |     // Match the modal-overlay directly (the outer <app-confirm-dialog> host has
  268 |     // 0x0 size so Playwright sees it as hidden even when the overlay is showing).
  269 |     const dialog = page.locator('app-confirm-dialog .modal-overlay');
  270 |     await expect(dialog).toBeVisible();
  271 |     await dialog.getByRole('button', { name: /^eliminar$/i }).click();
  272 |     await expect(dialog).not.toBeVisible({ timeout: 5000 });
  273 | 
  274 |     // Row count decreased; the RENOVADO row is gone
  275 |     await expect(page.locator(Listado.TABLE_ROW)).toHaveCount(countBefore - 1);
  276 |     await expect(
  277 |       page
  278 |         .locator(Listado.TABLE_ROW)
  279 |         .filter({ hasText: '123.456' })
  280 |         .filter({ has: page.locator('.badge', { hasText: /^Renovado$/ }) }),
  281 |     ).toHaveCount(0);
  282 |   });
  283 | });
  284 | 
  285 | // ---------- Role gating ----------
  286 | 
  287 | test.describe('Role gating — consulta (read only)', () => {
  288 |   test.use({ storageState: '.auth/consulta.json' });
  289 | 
  290 |   test('consulta user sees list but no action buttons', async ({ page }) => {
> 291 |     await page.goto(Routes.PRESTAMOS);
      |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  292 |     await expect(page.locator(Listado.TABLE_ROW).first()).toBeVisible();
  293 | 
  294 |     // No "+ Registrar Préstamo" button
  295 |     await expect(
  296 |       page.locator(Listado.REGISTER_BUTTON),
  297 |     ).toHaveCount(0);
  298 | 
  299 |     // No Editar/Renovar/Cancelar/Eliminar buttons anywhere in the table
  300 |     await expect(page.locator(Listado.ACTION_EDIT_BUTTON)).toHaveCount(0);
  301 |     await expect(page.locator(Listado.ACTION_RENEW_BUTTON)).toHaveCount(0);
  302 |     await expect(page.locator(Listado.ACTION_CLEAR_BUTTON)).toHaveCount(0);
  303 |     await expect(page.locator(Listado.ACTION_DELETE_BUTTON)).toHaveCount(0);
  304 |   });
  305 | });
  306 | 
  307 | test.describe('Role gating — contabilidad (read only)', () => {
  308 |   test.use({ storageState: '.auth/contabilidad.json' });
  309 | 
  310 |   test('contabilidad user sees list but no action buttons', async ({ page }) => {
  311 |     await page.goto(Routes.PRESTAMOS);
  312 |     await expect(page.locator(Listado.TABLE_ROW).first()).toBeVisible();
  313 |     await expect(
  314 |       page.locator(Listado.REGISTER_BUTTON),
  315 |     ).toHaveCount(0);
  316 |     await expect(page.locator(Listado.ACTION_EDIT_BUTTON)).toHaveCount(0);
  317 |     await expect(page.locator(Listado.ACTION_DELETE_BUTTON)).toHaveCount(0);
  318 |   });
  319 | });
  320 | 
  321 | test.describe('Role gating — tesoreria (write except delete)', () => {
  322 |   test.use({ storageState: '.auth/tesoreria.json' });
  323 | 
  324 |   test('tesoreria sees write buttons but not delete', async ({ page }) => {
  325 |     await page.goto(Routes.PRESTAMOS);
  326 |     await expect(page.locator(Listado.TABLE_ROW).first()).toBeVisible();
  327 | 
  328 |     // Sees the register button
  329 |     await expect(
  330 |       page.locator(Listado.REGISTER_BUTTON),
  331 |     ).toBeVisible();
  332 | 
  333 |     // Sees at least one Editar button (on an ACTIVE row)
  334 |     await expect(page.locator(Listado.ACTION_EDIT_BUTTON).first()).toBeVisible();
  335 |     await expect(page.locator(Listado.ACTION_RENEW_BUTTON).first()).toBeVisible();
  336 |     await expect(page.locator(Listado.ACTION_CLEAR_BUTTON).first()).toBeVisible();
  337 | 
  338 |     // Does NOT see delete buttons
  339 |     await expect(page.locator(Listado.ACTION_DELETE_BUTTON)).toHaveCount(0);
  340 |   });
  341 | });
  342 | 
```