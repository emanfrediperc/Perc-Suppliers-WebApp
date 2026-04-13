import { APIRequestContext } from '@playwright/test';

/**
 * Login helper for tests that need to call the API directly
 * (e.g. verifying token issuance outside the normal flow).
 *
 * Most tests should NOT use this — they should use per-spec storageState
 * set up by global-setup.ts. This helper is for specs that explicitly
 * exercise the login endpoint.
 */
export async function loginViaApi(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<{ access_token: string; user: { id: string; email: string; role: string } }> {
  const response = await request.post('/api/v1/auth/login', {
    data: { email, password },
  });
  if (!response.ok()) {
    throw new Error(`Login failed for ${email}: ${response.status()} ${await response.text()}`);
  }
  return response.json();
}

export const SeedUsers = {
  admin: { email: 'admin@perc.com', password: 'admin123', role: 'admin' },
  tesoreria: { email: 'tesoreria@perc.com', password: 'admin123', role: 'tesoreria' },
  contabilidad: { email: 'contabilidad@perc.com', password: 'admin123', role: 'contabilidad' },
  consulta: { email: 'consulta@perc.com', password: 'admin123', role: 'consulta' },
} as const;
