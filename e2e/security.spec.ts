import { test, expect } from '@playwright/test';
import { Routes, AuthForm, ChangePasswordForm } from './helpers/selectors';
import { SeedUsers } from './helpers/auth';
import { loginAs, getStoredToken } from './helpers/login-as';

/**
 * Security E2E tests:
 *  - Account lockout after 5 failed login attempts
 *  - Role-based API access control for consulta user
 *  - Change-password flow (mustChangePassword redirect)
 *
 * These tests drive the UI and/or the API directly — they do NOT use
 * pre-generated storageState files because they exercise auth mechanics
 * that must start from a fresh browser context.
 *
 * IMPORTANT: The seed script sets mustChangePassword: true for all users.
 * Set SEED_PASSWORD=TestSeed123! when running `npm run seed` before this suite.
 * The loginAs helper handles the change-password redirect automatically.
 */

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'admin123';
const NEW_PASSWORD = 'TestPassword123!';
const API_BASE = 'http://localhost:3100';

// ---------------------------------------------------------------------------
// Lockout flow
// ---------------------------------------------------------------------------

test.describe('Account lockout', () => {
  test(
    'locks the account after 5 consecutive wrong-password attempts',
    { tag: ['@critical', '@e2e', '@security', '@SEC-E2E-001'] },
    async ({ page }) => {
      await page.goto(Routes.LOGIN);

      // Attempt 1-5: all with a clearly wrong password
      for (let attempt = 1; attempt <= 5; attempt++) {
        await page.locator(AuthForm.EMAIL_INPUT).fill(SeedUsers.admin.email);
        await page.locator(AuthForm.PASSWORD_INPUT).fill('wrong-password-attempt');
        await page.getByRole('button', { name: AuthForm.SUBMIT_BUTTON_NAME }).click();
        // Wait briefly for the error response
        await page.waitForTimeout(300);
        // We should remain on /login throughout
        await expect(page).toHaveURL(new RegExp(Routes.LOGIN));
      }

      // After 5 failures the API returns the lockout message
      await expect(page.locator('app-toast')).toContainText(/bloqueada/i, { timeout: 5_000 });

      // Attempt 6: even the correct password must fail while locked
      await page.locator(AuthForm.EMAIL_INPUT).fill(SeedUsers.admin.email);
      await page.locator(AuthForm.PASSWORD_INPUT).fill(SEED_PASSWORD);
      await page.getByRole('button', { name: AuthForm.SUBMIT_BUTTON_NAME }).click();
      await page.waitForTimeout(300);

      // Still on /login — lockout is active
      await expect(page).toHaveURL(new RegExp(Routes.LOGIN));
      await expect(page.locator('app-toast')).toContainText(/bloqueada/i, { timeout: 5_000 });
    },
  );
});

// ---------------------------------------------------------------------------
// Role gating (API level) — consulta user
// ---------------------------------------------------------------------------

test.describe('Role gating — consulta (API)', () => {
  test(
    'consulta can access /facturas page in the UI',
    { tag: ['@high', '@e2e', '@security', '@SEC-E2E-002'] },
    async ({ page }) => {
      await loginAs(page, SeedUsers.consulta.email, SEED_PASSWORD, NEW_PASSWORD);
      await page.goto(Routes.FACTURAS);
      // The page should render the Facturas heading (not redirect to login)
      await expect(page.getByRole('heading', { name: /facturas/i })).toBeVisible({ timeout: 10_000 });
    },
  );

  test(
    'consulta token is rejected by admin-only POST /auth/register (403)',
    { tag: ['@critical', '@e2e', '@security', '@SEC-E2E-003'] },
    async ({ page }) => {
      await loginAs(page, SeedUsers.consulta.email, SEED_PASSWORD, NEW_PASSWORD);
      const token = await getStoredToken(page);

      const response = await page.request.post(`${API_BASE}/api/v1/auth/register`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          email: 'hacker@perc.com',
          password: 'Hack123!',
          nombre: 'Hacker',
          apellido: 'Test',
          role: 'admin',
        },
      });

      expect(response.status()).toBe(403);
    },
  );

  test(
    'consulta token is rejected by GET /empresas-proveedoras/:id (403)',
    { tag: ['@critical', '@e2e', '@security', '@SEC-E2E-004'] },
    async ({ page }) => {
      await loginAs(page, SeedUsers.consulta.email, SEED_PASSWORD, NEW_PASSWORD);
      const token = await getStoredToken(page);

      // First fetch the list — consulta CAN list them
      const listRes = await page.request.get(`${API_BASE}/api/v1/empresas-proveedoras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(listRes.status()).toBe(200);

      const listBody = await listRes.json() as { data: Array<{ _id: string }> };
      const firstId = listBody.data?.[0]?._id;

      if (!firstId) {
        test.skip(); // No seed data available — skip rather than fail
        return;
      }

      // Detail endpoint is gated to admin/tesoreria/contabilidad only
      const detailRes = await page.request.get(`${API_BASE}/api/v1/empresas-proveedoras/${firstId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(detailRes.status()).toBe(403);
    },
  );
});

// ---------------------------------------------------------------------------
// Change-password flow
// ---------------------------------------------------------------------------

test.describe('Change password flow', () => {
  test(
    'fresh seed login redirects to /change-password then to /dashboard after form submit',
    { tag: ['@critical', '@e2e', '@security', '@SEC-E2E-005'] },
    async ({ page }) => {
      // Drive the login manually so we can assert the redirect
      await page.goto(Routes.LOGIN);
      await page.locator(AuthForm.EMAIL_INPUT).fill(SeedUsers.tesoreria.email);
      await page.locator(AuthForm.PASSWORD_INPUT).fill(SEED_PASSWORD);
      await page.getByRole('button', { name: AuthForm.SUBMIT_BUTTON_NAME }).click();

      // Should redirect to /change-password because mustChangePassword is true
      await expect(page).toHaveURL(new RegExp(Routes.CHANGE_PASSWORD), { timeout: 10_000 });

      // The page must show the change-password heading
      await expect(page.getByRole('heading', { name: /cambiar contraseña/i })).toBeVisible();

      // Fill the form
      await page.locator(ChangePasswordForm.OLD_PASSWORD_INPUT).fill(SEED_PASSWORD);
      await page.locator(ChangePasswordForm.NEW_PASSWORD_INPUT).fill(NEW_PASSWORD);
      await page.locator(ChangePasswordForm.CONFIRM_PASSWORD_INPUT).fill(NEW_PASSWORD);
      await page.getByRole('button', { name: ChangePasswordForm.SUBMIT_BUTTON_NAME }).click();

      // After changing password → redirect to dashboard
      await expect(page).toHaveURL(new RegExp(Routes.DASHBOARD), { timeout: 10_000 });
    },
  );

  test(
    'after changing password, re-login with new password goes directly to dashboard',
    { tag: ['@critical', '@e2e', '@security', '@SEC-E2E-006'] },
    async ({ page }) => {
      // Use contabilidad for this test — complete the change-password flow first
      await loginAs(page, SeedUsers.contabilidad.email, SEED_PASSWORD, NEW_PASSWORD);

      // Now simulate a full logout + re-login with the new password
      // Clear localStorage to simulate logout
      await page.evaluate(() => {
        localStorage.removeItem('suppliers_access_token');
        localStorage.removeItem('suppliers_user');
      });

      // Navigate to login
      await page.goto(Routes.LOGIN);
      await page.locator(AuthForm.EMAIL_INPUT).fill(SeedUsers.contabilidad.email);
      await page.locator(AuthForm.PASSWORD_INPUT).fill(NEW_PASSWORD);
      await page.getByRole('button', { name: AuthForm.SUBMIT_BUTTON_NAME }).click();

      // Should go straight to dashboard — no mustChangePassword redirect
      await expect(page).toHaveURL(new RegExp(Routes.DASHBOARD), { timeout: 10_000 });
    },
  );

  test(
    'mismatch passwords show inline error and do not navigate away',
    { tag: ['@medium', '@e2e', '@security', '@SEC-E2E-007'] },
    async ({ page }) => {
      // Get to change-password page by logging in fresh
      await page.goto(Routes.LOGIN);
      await page.locator(AuthForm.EMAIL_INPUT).fill(SeedUsers.consulta.email);
      await page.locator(AuthForm.PASSWORD_INPUT).fill(SEED_PASSWORD);
      await page.getByRole('button', { name: AuthForm.SUBMIT_BUTTON_NAME }).click();
      await expect(page).toHaveURL(new RegExp(Routes.CHANGE_PASSWORD), { timeout: 10_000 });

      await page.locator(ChangePasswordForm.OLD_PASSWORD_INPUT).fill(SEED_PASSWORD);
      await page.locator(ChangePasswordForm.NEW_PASSWORD_INPUT).fill('NewPass123!');
      await page.locator(ChangePasswordForm.CONFIRM_PASSWORD_INPUT).fill('DifferentPass456!');
      await page.getByRole('button', { name: ChangePasswordForm.SUBMIT_BUTTON_NAME }).click();

      // Angular-side validation catches mismatch before hitting the API
      await expect(page.locator(ChangePasswordForm.ERROR_MSG)).toContainText(/no coinciden/i);
      // Must remain on /change-password
      await expect(page).toHaveURL(new RegExp(Routes.CHANGE_PASSWORD));
    },
  );
});
