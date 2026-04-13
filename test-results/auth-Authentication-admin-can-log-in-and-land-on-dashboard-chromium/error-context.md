# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> admin can log in and land on dashboard
- Location: e2e/auth.spec.ts:23:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/dashboard/
Received string:  "http://localhost:4205/login"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    14 × unexpected value "http://localhost:4205/login"

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]:
    - generic [ref=e8]: P
    - heading "Perc Suppliers" [level=1] [ref=e9]
    - paragraph [ref=e10]: Ingresa a tu cuenta
  - generic [ref=e11]:
    - generic [ref=e12]:
      - generic [ref=e13]: Email
      - textbox "tu@email.com" [ref=e14]: admin@perc.com
    - generic [ref=e15]:
      - generic [ref=e16]: Contrasena
      - textbox "••••••••" [ref=e17]: admin123
    - button "Iniciar Sesion" [ref=e18] [cursor=pointer]
  - paragraph [ref=e19]:
    - text: No tienes cuenta?
    - link "Registrate" [ref=e20] [cursor=pointer]:
      - /url: /register
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { Routes, AuthForm } from './helpers/selectors';
  3  | import { SeedUsers } from './helpers/auth';
  4  | 
  5  | /**
  6  |  * Auth flow tests — drive the UI login form directly to verify
  7  |  * the login + session persistence + route guards work end-to-end.
  8  |  *
  9  |  * These tests do NOT use storageState — they start from a clean browser
  10 |  * context and exercise the full login flow via the DOM.
  11 |  */
  12 | 
  13 | test.describe('Authentication', () => {
  14 |   test('login page renders with form', async ({ page }) => {
  15 |     await page.goto(Routes.LOGIN);
  16 |     await expect(page.locator(AuthForm.EMAIL_INPUT)).toBeVisible();
  17 |     await expect(page.locator(AuthForm.PASSWORD_INPUT)).toBeVisible();
  18 |     await expect(
  19 |       page.getByRole('button', { name: AuthForm.SUBMIT_BUTTON_NAME }),
  20 |     ).toBeVisible();
  21 |   });
  22 | 
  23 |   test('admin can log in and land on dashboard', async ({ page }) => {
  24 |     await page.goto(Routes.LOGIN);
  25 |     await page.locator(AuthForm.EMAIL_INPUT).fill(SeedUsers.admin.email);
  26 |     await page.locator(AuthForm.PASSWORD_INPUT).fill(SeedUsers.admin.password);
  27 |     await page.getByRole('button', { name: AuthForm.SUBMIT_BUTTON_NAME }).click();
  28 | 
> 29 |     await expect(page).toHaveURL(new RegExp(Routes.DASHBOARD), { timeout: 10_000 });
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  30 | 
  31 |     // Token should be in localStorage after login
  32 |     const token = await page.evaluate(() => localStorage.getItem('suppliers_access_token'));
  33 |     expect(token).toBeTruthy();
  34 |   });
  35 | 
  36 |   test('wrong password shows an error toast', async ({ page }) => {
  37 |     await page.goto(Routes.LOGIN);
  38 |     await page.locator(AuthForm.EMAIL_INPUT).fill(SeedUsers.admin.email);
  39 |     await page.locator(AuthForm.PASSWORD_INPUT).fill('definitely-wrong-password');
  40 |     await page.getByRole('button', { name: AuthForm.SUBMIT_BUTTON_NAME }).click();
  41 | 
  42 |     // ToastService error rendered by <app-toast />. We don't care about the
  43 |     // exact text — just that SOMETHING error-ish appears and we did not leave /login.
  44 |     await page.waitForTimeout(500);
  45 |     await expect(page).toHaveURL(new RegExp(Routes.LOGIN));
  46 | 
  47 |     // Token should NOT be set
  48 |     const token = await page.evaluate(() => localStorage.getItem('suppliers_access_token'));
  49 |     expect(token).toBeFalsy();
  50 |   });
  51 | 
  52 |   test('unauthenticated deep-link to /prestamos redirects to /login', async ({ page }) => {
  53 |     await page.context().clearCookies();
  54 |     await page.goto(Routes.PRESTAMOS);
  55 |     await expect(page).toHaveURL(new RegExp(Routes.LOGIN), { timeout: 10_000 });
  56 |   });
  57 | });
  58 | 
```