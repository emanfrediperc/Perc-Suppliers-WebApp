import { defineConfig } from '@playwright/test';

/**
 * Playwright config for Perc-Suppliers-WebApp E2E tests.
 * Tests the `prestamos` module (backoffice + simulador) end-to-end against
 * the running API on :3100 and WebApp dev server on :4200.
 *
 * Pre-requisites to run:
 *   - Perc-Suppliers-API running on :3100 (with Mongo auth workaround URI)
 *   - Perc-Suppliers-WebApp running on :4200 (npm start)
 *   - perc-mongodb docker container up
 * The globalSetup re-seeds the DB and generates per-role storageState files.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  workers: 1, // Sequential — shared DB state between tests
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:4205',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
