import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

function runRoleGuard(auth: any, router: any, ...roles: string[]): boolean {
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: auth },
      { provide: Router, useValue: router },
    ],
  });
  const guard = roleGuard(...roles);
  return TestBed.runInInjectionContext(() => guard({} as any, {} as any)) as boolean;
}

describe('roleGuard', () => {
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    TestBed.resetTestingModule();
    router = { navigate: vi.fn() };
  });

  it('permite el acceso si el rol del usuario esta permitido', () => {
    const result = runRoleGuard({ user: () => ({ role: 'admin' }) }, router, 'admin', 'tesoreria');
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirige a /dashboard si el rol NO esta permitido', () => {
    const result = runRoleGuard({ user: () => ({ role: 'consulta' }) }, router, 'admin');
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('redirige a /dashboard si no hay usuario', () => {
    const result = runRoleGuard({ user: () => null }, router, 'admin');
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
