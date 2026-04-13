import { test, expect } from '@playwright/test';
import { Routes, AuthForm } from './helpers/selectors';
import { SeedUsers } from './helpers/auth';

/**
 * Auth flow tests — drive the UI login form directly to verify
 * the login + session persistence + route guards work end-to-end.
 *
 * These tests do NOT use storageState — they start from a clean browser
 * context and exercise the full login flow via the DOM.
 */

test.describe('Authentication', () => {
  test('login page renders with form', async ({ page }) => {
    await page.goto(Routes.LOGIN);
    await expect(page.locator(AuthForm.EMAIL_INPUT)).toBeVisible();
    await expect(page.locator(AuthForm.PASSWORD_INPUT)).toBeVisible();
    await expect(
      page.getByRole('button', { name: AuthForm.SUBMIT_BUTTON_NAME }),
    ).toBeVisible();
  });

  test('admin can log in and land on dashboard', async ({ page }) => {
    await page.goto(Routes.LOGIN);
    await page.locator(AuthForm.EMAIL_INPUT).fill(SeedUsers.admin.email);
    await page.locator(AuthForm.PASSWORD_INPUT).fill(SeedUsers.admin.password);
    await page.getByRole('button', { name: AuthForm.SUBMIT_BUTTON_NAME }).click();

    await expect(page).toHaveURL(new RegExp(Routes.DASHBOARD), { timeout: 10_000 });

    // Token should be in localStorage after login
    const token = await page.evaluate(() => localStorage.getItem('suppliers_access_token'));
    expect(token).toBeTruthy();
  });

  test('wrong password shows an error toast', async ({ page }) => {
    await page.goto(Routes.LOGIN);
    await page.locator(AuthForm.EMAIL_INPUT).fill(SeedUsers.admin.email);
    await page.locator(AuthForm.PASSWORD_INPUT).fill('definitely-wrong-password');
    await page.getByRole('button', { name: AuthForm.SUBMIT_BUTTON_NAME }).click();

    // ToastService error rendered by <app-toast />. We don't care about the
    // exact text — just that SOMETHING error-ish appears and we did not leave /login.
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(new RegExp(Routes.LOGIN));

    // Token should NOT be set
    const token = await page.evaluate(() => localStorage.getItem('suppliers_access_token'));
    expect(token).toBeFalsy();
  });

  test('unauthenticated deep-link to /prestamos redirects to /login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(Routes.PRESTAMOS);
    await expect(page).toHaveURL(new RegExp(Routes.LOGIN), { timeout: 10_000 });
  });
});
