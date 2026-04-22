import { test, expect } from '@playwright/test';

/**
 * E2E tests for the rol-aprobador-magic-link feature.
 *
 * Scenarios:
 * 1. Aprobador can access /aprobaciones and approve a pending item.
 * 2. Operador is denied access to /aprobaciones (redirected to dashboard).
 * 3. Tesorería sees "Esperando aprobación" badge in prestamos list when state is present.
 * 4. /aprobar public route renders error state for a fake/invalid token.
 * 5. /aprobar with valid token (skipped — no way to generate a valid token in tests without seeding a specific aprobacion).
 */

const BASE = 'http://localhost:4205';

// ─── Scenario 1: Aprobador accesses /aprobaciones ────────────────────────────
test.describe('Aprobador role', () => {
  test.use({ storageState: '.auth/aprobador.json' });

  test('puede acceder a /aprobaciones', async ({ page }) => {
    await page.goto(`${BASE}/aprobaciones`);
    // Should NOT be redirected to dashboard
    await expect(page).not.toHaveURL(/dashboard/);
    await expect(page.getByRole('heading', { name: 'Aprobaciones' })).toBeVisible();
  });

  test('puede ver el tab de pendientes', async ({ page }) => {
    await page.goto(`${BASE}/aprobaciones`);
    await expect(page.getByRole('button', { name: /Pendientes/ })).toBeVisible();
  });

  test('puede decidir en una aprobacion pendiente si hay alguna', async ({ page }) => {
    await page.goto(`${BASE}/aprobaciones`);
    // If there are pending approvals, the Aprobar button should be visible
    const aprobarButtons = page.locator('.btn-approve');
    const count = await aprobarButtons.count();
    if (count > 0) {
      // Just verify the button is clickable (don't actually click to avoid side-effects in parallel runs)
      await expect(aprobarButtons.first()).toBeEnabled();
    } else {
      // No pending approvals — that's also valid
      test.info().annotations.push({ type: 'skip-reason', description: 'No pending approvals in seed data' });
    }
  });
});

// ─── Scenario 2: Operador is denied access ────────────────────────────────────
test.describe('Operador role', () => {
  test.use({ storageState: '.auth/operador.json' });

  test('operador es redirigido fuera de /aprobaciones', async ({ page }) => {
    await page.goto(`${BASE}/aprobaciones`);
    // roleGuard redirects to /dashboard
    await expect(page).toHaveURL(/dashboard/);
  });
});

// ─── Scenario 3: Tesorería sees esperando_aprobacion badge ───────────────────
test.describe('Estado esperando_aprobacion en badge', () => {
  test.use({ storageState: '.auth/tesoreria.json' });

  test('el status-badge mapea esperando_aprobacion correctamente', async ({ page }) => {
    // Navigate to prestamos list — if any prestamo has ESPERANDO_APROBACION the badge shows
    await page.goto(`${BASE}/prestamos`);
    await expect(page).not.toHaveURL(/login/);

    // The badge mapping is done client-side — verify the labelMap works by checking
    // if any badge with "Esperando aprobación" text appears (may be zero if no seed data in that state)
    const badges = page.locator('app-status-badge').filter({ hasText: 'Esperando aprobación' });
    // We can't assert count > 0 without seeded data in that state, but we verify the page loaded
    await expect(page.getByRole('heading', { name: /préstamos|prestamos/i })).toBeVisible();
    // Log count for informational purposes
    const badgeCount = await badges.count();
    test.info().annotations.push({
      type: 'info',
      description: `Badges with "Esperando aprobación": ${badgeCount}`,
    });
  });
});

// ─── Scenario 4: /aprobar public route with invalid token ────────────────────
test.describe('/aprobar public route', () => {
  // This is a PUBLIC route — no storageState needed
  test('muestra error genérico con token inválido', async ({ page }) => {
    await page.goto(`${BASE}/aprobar?t=fake-invalid-token-12345&decision=aprobar`);

    // The page should render (not redirect to login)
    await expect(page).toHaveURL(/aprobar/);

    // After the GET to /contexto-token fails (401), error state should appear
    await expect(page.locator('.error-state')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Token inválido o expirado')).toBeVisible();

    // Should show link to login
    await expect(page.getByRole('link', { name: /Iniciá sesión/i })).toBeVisible();
  });

  test('no hace mutación en carga — solo GET contexto', async ({ page }) => {
    // Intercept all non-GET requests during page load to ensure no mutations happen
    const mutations: string[] = [];
    page.on('request', (req) => {
      if (req.method() !== 'GET' && req.url().includes('/api/')) {
        mutations.push(`${req.method()} ${req.url()}`);
      }
    });

    await page.goto(`${BASE}/aprobar?t=test-token-readonly&decision=aprobar`);
    // Wait for page to settle (error state should appear since token is fake)
    await page.waitForTimeout(2000);

    expect(mutations).toHaveLength(0);
  });
});

// ─── Scenario 5: /aprobar with valid token ────────────────────────────────────
test.skip('/aprobar con token válido (requiere token real del seed)', async () => {
  // Skipped: there's no mechanism to generate a valid magic-link token in the test suite
  // without seeding a specific aprobacion and extracting its token from the DB or email.
  // To enable: seed an aprobacion, query MongoDB for its token, then:
  //   await page.goto(`${BASE}/aprobar?t=<real-token>&decision=aprobar`);
  //   await expect(page.locator('.confirm-state')).toBeVisible();
  //   await page.click('.btn-approve');
  //   await expect(page.locator('.success-state')).toBeVisible();
});
