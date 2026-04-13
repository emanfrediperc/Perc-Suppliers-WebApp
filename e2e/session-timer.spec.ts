import { test, expect } from '@playwright/test';
import { Routes } from './helpers/selectors';
import { loginAs } from './helpers/login-as';

/**
 * Session timer E2E tests.
 *
 * The `app-session-timer` component (powered by IdleService) shows a warning
 * pill only when the idle countdown reaches the 5-minute warning threshold
 * (i.e. after ~25 minutes of inactivity when the full 30-min timeout is used).
 *
 * Waiting 25 minutes in an E2E test is impractical, so these tests instead
 * verify:
 *  1. The `<app-session-timer>` host element is present in the DOM immediately
 *     after login (inside the main layout). Its visibility/content is controlled
 *     by Angular signals — the host is always in the DOM.
 *  2. The warning pill is NOT visible right after login (user is active, timer
 *     hasn't fired yet).
 *  3. IdleService behaviour (timeout logic, displayTime, renew) is covered by
 *     unit tests — see idle.service.spec.ts.
 *
 * Set SEED_PASSWORD=TestSeed123! when running `npm run seed` before this suite.
 */

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'admin123';
const NEW_PASSWORD = 'TestPassword123!';

test.describe('Session timer — structural presence', () => {
  test(
    'app-session-timer component is mounted in DOM after login',
    { tag: ['@medium', '@e2e', '@session', '@SES-E2E-001'] },
    async ({ page }) => {
      await loginAs(page, 'admin@perc.com', SEED_PASSWORD, NEW_PASSWORD);

      // Wait for the main layout to be fully rendered (dashboard heading visible)
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10_000 });

      // The <app-session-timer> component host is rendered inside the main
      // layout regardless of the warning state — Angular always puts it in the DOM.
      const sessionTimerHost = page.locator('app-session-timer');
      await expect(sessionTimerHost).toHaveCount(1);
    },
  );

  test(
    'session warning pill is NOT visible immediately after login (timer not yet expired)',
    { tag: ['@medium', '@e2e', '@session', '@SES-E2E-002'] },
    async ({ page }) => {
      await loginAs(page, 'admin@perc.com', SEED_PASSWORD, NEW_PASSWORD);
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10_000 });

      // The warning pill (.session-pill button) is rendered only when
      // IdleService.showWarning() is true (Angular @if block). It should not
      // be visible right after login since no idle time has elapsed.
      const warningPill = page.locator('app-session-timer .session-pill');
      await expect(warningPill).toHaveCount(0);
    },
  );

  test(
    'session timer component is present on facturas route too (layout persists)',
    { tag: ['@low', '@e2e', '@session', '@SES-E2E-003'] },
    async ({ page }) => {
      await loginAs(page, 'admin@perc.com', SEED_PASSWORD, NEW_PASSWORD);
      await page.goto(Routes.FACTURAS);
      await expect(page.getByRole('heading', { name: /facturas/i })).toBeVisible({ timeout: 10_000 });

      // Verifies the main layout (including the session timer) is kept alive
      // across Angular router navigations — it is a singleton shell component.
      const sessionTimerHost = page.locator('app-session-timer');
      await expect(sessionTimerHost).toHaveCount(1);
    },
  );
});
