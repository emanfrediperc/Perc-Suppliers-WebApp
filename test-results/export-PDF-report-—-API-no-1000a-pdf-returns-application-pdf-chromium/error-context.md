# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: export.spec.ts >> PDF report — API (no UI button yet) >> GET /reportes with formato=pdf returns application/pdf
- Location: e2e/export.spec.ts:108:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Test source

```ts
  1  | import { Page } from '@playwright/test';
  2  | import { Routes, AuthForm, ChangePasswordForm } from './selectors';
  3  | 
  4  | /**
  5  |  * UI-driven login helper that transparently handles the mustChangePassword
  6  |  * redirect. After the first login the seed user is redirected to /change-password
  7  |  * because `mustChangePassword: true` is set by the seeder. This helper detects
  8  |  * that redirect and completes the password-change flow before returning.
  9  |  *
  10 |  * @param page        Playwright page
  11 |  * @param email       Seed user email
  12 |  * @param seedPassword  The current (seed) password — default matches SEED_PASSWORD env var convention
  13 |  * @param newPassword   Password to set when change-password page appears
  14 |  */
  15 | export async function loginAs(
  16 |   page: Page,
  17 |   email: string,
  18 |   seedPassword: string,
  19 |   newPassword = 'TestPassword123!',
  20 | ): Promise<void> {
  21 |   await page.goto(Routes.LOGIN);
  22 |   await page.locator(AuthForm.EMAIL_INPUT).fill(email);
  23 |   await page.locator(AuthForm.PASSWORD_INPUT).fill(seedPassword);
  24 |   await page.getByRole('button', { name: AuthForm.SUBMIT_BUTTON_NAME }).click();
  25 | 
  26 |   // If mustChangePassword is true the server redirects the UI to /change-password
  27 |   // after a successful login. Handle it transparently.
> 28 |   await page.waitForURL(/\/(change-password|dashboard)/, { timeout: 10_000 });
     |              ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  29 | 
  30 |   if (page.url().includes('/change-password')) {
  31 |     await page.locator(ChangePasswordForm.OLD_PASSWORD_INPUT).fill(seedPassword);
  32 |     await page.locator(ChangePasswordForm.NEW_PASSWORD_INPUT).fill(newPassword);
  33 |     await page.locator(ChangePasswordForm.CONFIRM_PASSWORD_INPUT).fill(newPassword);
  34 |     await page.getByRole('button', { name: ChangePasswordForm.SUBMIT_BUTTON_NAME }).click();
  35 |     await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
  36 |   }
  37 | }
  38 | 
  39 | /**
  40 |  * Returns the Bearer token stored in localStorage by the AuthService.
  41 |  * Useful for making authenticated API requests inside tests.
  42 |  */
  43 | export async function getStoredToken(page: Page): Promise<string> {
  44 |   const token = await page.evaluate(() => localStorage.getItem('suppliers_access_token'));
  45 |   if (!token) throw new Error('No access_token found in localStorage — user may not be logged in');
  46 |   return token;
  47 | }
  48 | 
```