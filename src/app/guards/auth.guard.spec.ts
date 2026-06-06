import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

function runGuard(auth: any, router: any, url = '/dashboard'): boolean {
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: auth },
      { provide: Router, useValue: router },
    ],
  });
  return TestBed.runInInjectionContext(() => authGuard({} as any, { url } as any)) as boolean;
}

describe('authGuard', () => {
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    TestBed.resetTestingModule();
    router = { navigate: vi.fn() };
  });

  it('redirige a /login si no esta autenticado', () => {
    const result = runGuard({ isAuthenticated: () => false, user: () => null }, router);
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('redirige a /change-password si mustChangePassword y no esta en esa ruta', () => {
    const auth = { isAuthenticated: () => true, user: () => ({ mustChangePassword: true }) };
    const result = runGuard(auth, router, '/dashboard');
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/change-password']);
  });

  it('permite el acceso si ya esta en /change-password', () => {
    const auth = { isAuthenticated: () => true, user: () => ({ mustChangePassword: true }) };
    const result = runGuard(auth, router, '/change-password');
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('permite el acceso a usuario autenticado sin mustChangePassword', () => {
    const auth = { isAuthenticated: () => true, user: () => ({ mustChangePassword: false }) };
    const result = runGuard(auth, router);
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
