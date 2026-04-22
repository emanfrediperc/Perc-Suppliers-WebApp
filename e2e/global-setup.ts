import { request } from '@playwright/test';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Playwright global setup.
 *
 * Steps:
 *  1. Re-seed the Perc-Suppliers Mongo DB via the API's npm run seed script.
 *     Ensures every test run starts with the same 7 prestamos baseline.
 *  2. Login each seed user via POST /api/v1/auth/login (through the WebApp
 *     dev proxy at :4200).
 *  3. Save per-role Playwright storageState JSON files under .auth/ so that
 *     individual specs can `test.use({ storageState: '.auth/admin.json' })`
 *     without having to drive the UI login.
 *
 * Running this setup is slow (~20s — NestJS bootstrap + Mongo seed), but it
 * only runs ONCE per test run regardless of how many specs/tests there are.
 */

const AUTH_DIR = join(__dirname, '..', '.auth');
const API_DIR = '/Users/eze/Perc/Perc-Suppliers/Perc-Suppliers-API';
// Login directly against the API (not via the WebApp dev proxy, which may
// not be wired into ng serve by default). The storageState origin stays
// on the WebApp URL so localStorage is scoped correctly.
const API_BASE_URL = 'http://localhost:3100';
const ORIGIN = 'http://localhost:4205';

const SEED_PASSWORD = process.env.SEED_PASSWORD || 'admin123';
const USERS = [
  { email: 'admin@perc.com', password: SEED_PASSWORD, file: 'admin.json' },
  { email: 'tesoreria@perc.com', password: SEED_PASSWORD, file: 'tesoreria.json' },
  { email: 'aprobador@perc.com', password: SEED_PASSWORD, file: 'aprobador.json' },
  { email: 'operador@perc.com', password: SEED_PASSWORD, file: 'operador.json' },
  { email: 'consulta@perc.com', password: SEED_PASSWORD, file: 'consulta.json' },
];

export default async function globalSetup() {
  // Step 1: re-seed the database
  console.log('\n[global-setup] Re-seeding Perc-Suppliers database...');
  try {
    execSync('npm run seed', {
      cwd: API_DIR,
      env: {
        ...process.env,
        MONGODB_URI:
          'mongodb://mongopsp:mongopsp123@127.0.0.1:27017/perc-suppliers?authSource=admin&directConnection=true',
        JWT_SECRET: process.env.JWT_SECRET || 'C8G6WN4M9+k9Qycrxbo5ISI/nu2N7xSvXouOCMZD0xd59n3qRo2duEL5iLJgcJhm',
        SEED_PASSWORD,
        AWS_S3_ENDPOINT: 'http://localhost:4566',
      },
      stdio: 'inherit',
    });
  } catch (err) {
    console.error('[global-setup] Seed failed. Is the Mongo container up?');
    throw err;
  }

  // Step 2+3: login each user + save storageState
  mkdirSync(AUTH_DIR, { recursive: true });

  const requestContext = await request.newContext({ baseURL: API_BASE_URL });

  for (const user of USERS) {
    const response = await requestContext.post('/api/v1/auth/login', {
      data: { email: user.email, password: user.password },
    });

    if (!response.ok()) {
      throw new Error(
        `[global-setup] Login failed for ${user.email}: ${response.status()} ${await response.text()}`,
      );
    }

    const body = (await response.json()) as {
      access_token: string;
      user: { id: string; email: string; nombre: string; apellido: string; role: string };
    };

    // Build a Playwright storageState with the auth data injected into
    // localStorage for the WebApp origin. The AuthService reads from these keys
    // on construction, so the app will consider the user already logged in.
    const storageState = {
      cookies: [],
      origins: [
        {
          origin: ORIGIN,
          localStorage: [
            { name: 'suppliers_access_token', value: body.access_token },
            { name: 'suppliers_user', value: JSON.stringify(body.user) },
          ],
        },
      ],
    };

    const filePath = join(AUTH_DIR, user.file);
    writeFileSync(filePath, JSON.stringify(storageState, null, 2));
    console.log(`[global-setup] Saved storageState for ${user.email} → ${user.file}`);
  }

  await requestContext.dispose();
  console.log('[global-setup] Done. 5 storageState files ready.\n');
}
