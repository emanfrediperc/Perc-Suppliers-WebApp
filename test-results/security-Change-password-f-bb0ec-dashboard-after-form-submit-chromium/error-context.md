# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.ts >> Change password flow >> fresh seed login redirects to /change-password then to /dashboard after form submit
- Location: e2e/security.spec.ts:136:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/change-password/
Received string:  "http://localhost:4205/login"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    13 × unexpected value "http://localhost:4205/login"

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
      - textbox "tu@email.com" [ref=e14]: tesoreria@perc.com
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
  47  |       // After 5 failures the API returns the lockout message
  48  |       await expect(page.locator('app-toast')).toContainText(/bloqueada/i, { timeout: 5_000 });
  49  | 
  50  |       // Attempt 6: even the correct password must fail while locked
  51  |       await page.locator(AuthForm.EMAIL_INPUT).fill(SeedUsers.admin.email);
  52  |       await page.locator(AuthForm.PASSWORD_INPUT).fill(SEED_PASSWORD);
  53  |       await page.getByRole('button', { name: AuthForm.SUBMIT_BUTTON_NAME }).click();
  54  |       await page.waitForTimeout(300);
  55  | 
  56  |       // Still on /login — lockout is active
  57  |       await expect(page).toHaveURL(new RegExp(Routes.LOGIN));
  58  |       await expect(page.locator('app-toast')).toContainText(/bloqueada/i, { timeout: 5_000 });
  59  |     },
  60  |   );
  61  | });
  62  | 
  63  | // ---------------------------------------------------------------------------
  64  | // Role gating (API level) — consulta user
  65  | // ---------------------------------------------------------------------------
  66  | 
  67  | test.describe('Role gating — consulta (API)', () => {
  68  |   test(
  69  |     'consulta can access /facturas page in the UI',
  70  |     { tag: ['@high', '@e2e', '@security', '@SEC-E2E-002'] },
  71  |     async ({ page }) => {
  72  |       await loginAs(page, SeedUsers.consulta.email, SEED_PASSWORD, NEW_PASSWORD);
  73  |       await page.goto(Routes.FACTURAS);
  74  |       // The page should render the Facturas heading (not redirect to login)
  75  |       await expect(page.getByRole('heading', { name: /facturas/i })).toBeVisible({ timeout: 10_000 });
  76  |     },
  77  |   );
  78  | 
  79  |   test(
  80  |     'consulta token is rejected by admin-only POST /auth/register (403)',
  81  |     { tag: ['@critical', '@e2e', '@security', '@SEC-E2E-003'] },
  82  |     async ({ page }) => {
  83  |       await loginAs(page, SeedUsers.consulta.email, SEED_PASSWORD, NEW_PASSWORD);
  84  |       const token = await getStoredToken(page);
  85  | 
  86  |       const response = await page.request.post(`${API_BASE}/api/v1/auth/register`, {
  87  |         headers: { Authorization: `Bearer ${token}` },
  88  |         data: {
  89  |           email: 'hacker@perc.com',
  90  |           password: 'Hack123!',
  91  |           nombre: 'Hacker',
  92  |           apellido: 'Test',
  93  |           role: 'admin',
  94  |         },
  95  |       });
  96  | 
  97  |       expect(response.status()).toBe(403);
  98  |     },
  99  |   );
  100 | 
  101 |   test(
  102 |     'consulta token is rejected by GET /empresas-proveedoras/:id (403)',
  103 |     { tag: ['@critical', '@e2e', '@security', '@SEC-E2E-004'] },
  104 |     async ({ page }) => {
  105 |       await loginAs(page, SeedUsers.consulta.email, SEED_PASSWORD, NEW_PASSWORD);
  106 |       const token = await getStoredToken(page);
  107 | 
  108 |       // First fetch the list — consulta CAN list them
  109 |       const listRes = await page.request.get(`${API_BASE}/api/v1/empresas-proveedoras`, {
  110 |         headers: { Authorization: `Bearer ${token}` },
  111 |       });
  112 |       expect(listRes.status()).toBe(200);
  113 | 
  114 |       const listBody = await listRes.json() as { data: Array<{ _id: string }> };
  115 |       const firstId = listBody.data?.[0]?._id;
  116 | 
  117 |       if (!firstId) {
  118 |         test.skip(); // No seed data available — skip rather than fail
  119 |         return;
  120 |       }
  121 | 
  122 |       // Detail endpoint is gated to admin/tesoreria/contabilidad only
  123 |       const detailRes = await page.request.get(`${API_BASE}/api/v1/empresas-proveedoras/${firstId}`, {
  124 |         headers: { Authorization: `Bearer ${token}` },
  125 |       });
  126 |       expect(detailRes.status()).toBe(403);
  127 |     },
  128 |   );
  129 | });
  130 | 
  131 | // ---------------------------------------------------------------------------
  132 | // Change-password flow
  133 | // ---------------------------------------------------------------------------
  134 | 
  135 | test.describe('Change password flow', () => {
  136 |   test(
  137 |     'fresh seed login redirects to /change-password then to /dashboard after form submit',
  138 |     { tag: ['@critical', '@e2e', '@security', '@SEC-E2E-005'] },
  139 |     async ({ page }) => {
  140 |       // Drive the login manually so we can assert the redirect
  141 |       await page.goto(Routes.LOGIN);
  142 |       await page.locator(AuthForm.EMAIL_INPUT).fill(SeedUsers.tesoreria.email);
  143 |       await page.locator(AuthForm.PASSWORD_INPUT).fill(SEED_PASSWORD);
  144 |       await page.getByRole('button', { name: AuthForm.SUBMIT_BUTTON_NAME }).click();
  145 | 
  146 |       // Should redirect to /change-password because mustChangePassword is true
> 147 |       await expect(page).toHaveURL(new RegExp(Routes.CHANGE_PASSWORD), { timeout: 10_000 });
      |                          ^ Error: expect(page).toHaveURL(expected) failed
  148 | 
  149 |       // The page must show the change-password heading
  150 |       await expect(page.getByRole('heading', { name: /cambiar contraseña/i })).toBeVisible();
  151 | 
  152 |       // Fill the form
  153 |       await page.locator(ChangePasswordForm.OLD_PASSWORD_INPUT).fill(SEED_PASSWORD);
  154 |       await page.locator(ChangePasswordForm.NEW_PASSWORD_INPUT).fill(NEW_PASSWORD);
  155 |       await page.locator(ChangePasswordForm.CONFIRM_PASSWORD_INPUT).fill(NEW_PASSWORD);
  156 |       await page.getByRole('button', { name: ChangePasswordForm.SUBMIT_BUTTON_NAME }).click();
  157 | 
  158 |       // After changing password → redirect to dashboard
  159 |       await expect(page).toHaveURL(new RegExp(Routes.DASHBOARD), { timeout: 10_000 });
  160 |     },
  161 |   );
  162 | 
  163 |   test(
  164 |     'after changing password, re-login with new password goes directly to dashboard',
  165 |     { tag: ['@critical', '@e2e', '@security', '@SEC-E2E-006'] },
  166 |     async ({ page }) => {
  167 |       // Use contabilidad for this test — complete the change-password flow first
  168 |       await loginAs(page, SeedUsers.contabilidad.email, SEED_PASSWORD, NEW_PASSWORD);
  169 | 
  170 |       // Now simulate a full logout + re-login with the new password
  171 |       // Clear localStorage to simulate logout
  172 |       await page.evaluate(() => {
  173 |         localStorage.removeItem('suppliers_access_token');
  174 |         localStorage.removeItem('suppliers_user');
  175 |       });
  176 | 
  177 |       // Navigate to login
  178 |       await page.goto(Routes.LOGIN);
  179 |       await page.locator(AuthForm.EMAIL_INPUT).fill(SeedUsers.contabilidad.email);
  180 |       await page.locator(AuthForm.PASSWORD_INPUT).fill(NEW_PASSWORD);
  181 |       await page.getByRole('button', { name: AuthForm.SUBMIT_BUTTON_NAME }).click();
  182 | 
  183 |       // Should go straight to dashboard — no mustChangePassword redirect
  184 |       await expect(page).toHaveURL(new RegExp(Routes.DASHBOARD), { timeout: 10_000 });
  185 |     },
  186 |   );
  187 | 
  188 |   test(
  189 |     'mismatch passwords show inline error and do not navigate away',
  190 |     { tag: ['@medium', '@e2e', '@security', '@SEC-E2E-007'] },
  191 |     async ({ page }) => {
  192 |       // Get to change-password page by logging in fresh
  193 |       await page.goto(Routes.LOGIN);
  194 |       await page.locator(AuthForm.EMAIL_INPUT).fill(SeedUsers.consulta.email);
  195 |       await page.locator(AuthForm.PASSWORD_INPUT).fill(SEED_PASSWORD);
  196 |       await page.getByRole('button', { name: AuthForm.SUBMIT_BUTTON_NAME }).click();
  197 |       await expect(page).toHaveURL(new RegExp(Routes.CHANGE_PASSWORD), { timeout: 10_000 });
  198 | 
  199 |       await page.locator(ChangePasswordForm.OLD_PASSWORD_INPUT).fill(SEED_PASSWORD);
  200 |       await page.locator(ChangePasswordForm.NEW_PASSWORD_INPUT).fill('NewPass123!');
  201 |       await page.locator(ChangePasswordForm.CONFIRM_PASSWORD_INPUT).fill('DifferentPass456!');
  202 |       await page.getByRole('button', { name: ChangePasswordForm.SUBMIT_BUTTON_NAME }).click();
  203 | 
  204 |       // Angular-side validation catches mismatch before hitting the API
  205 |       await expect(page.locator(ChangePasswordForm.ERROR_MSG)).toContainText(/no coinciden/i);
  206 |       // Must remain on /change-password
  207 |       await expect(page).toHaveURL(new RegExp(Routes.CHANGE_PASSWORD));
  208 |     },
  209 |   );
  210 | });
  211 | 
```