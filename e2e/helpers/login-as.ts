import { Page } from '@playwright/test';
import { Routes, AuthForm, ChangePasswordForm } from './selectors';

/**
 * UI-driven login helper that transparently handles the mustChangePassword
 * redirect. After the first login the seed user is redirected to /change-password
 * because `mustChangePassword: true` is set by the seeder. This helper detects
 * that redirect and completes the password-change flow before returning.
 *
 * @param page        Playwright page
 * @param email       Seed user email
 * @param seedPassword  The current (seed) password — default matches SEED_PASSWORD env var convention
 * @param newPassword   Password to set when change-password page appears
 */
export async function loginAs(
  page: Page,
  email: string,
  seedPassword: string,
  newPassword = 'TestPassword123!',
): Promise<void> {
  await page.goto(Routes.LOGIN);
  await page.locator(AuthForm.EMAIL_INPUT).fill(email);
  await page.locator(AuthForm.PASSWORD_INPUT).fill(seedPassword);
  await page.getByRole('button', { name: AuthForm.SUBMIT_BUTTON_NAME }).click();

  // If mustChangePassword is true the server redirects the UI to /change-password
  // after a successful login. Handle it transparently.
  await page.waitForURL(/\/(change-password|dashboard)/, { timeout: 10_000 });

  if (page.url().includes('/change-password')) {
    await page.locator(ChangePasswordForm.OLD_PASSWORD_INPUT).fill(seedPassword);
    await page.locator(ChangePasswordForm.NEW_PASSWORD_INPUT).fill(newPassword);
    await page.locator(ChangePasswordForm.CONFIRM_PASSWORD_INPUT).fill(newPassword);
    await page.getByRole('button', { name: ChangePasswordForm.SUBMIT_BUTTON_NAME }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
  }
}

/**
 * Returns the Bearer token stored in localStorage by the AuthService.
 * Useful for making authenticated API requests inside tests.
 */
export async function getStoredToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem('suppliers_access_token'));
  if (!token) throw new Error('No access_token found in localStorage — user may not be logged in');
  return token;
}
