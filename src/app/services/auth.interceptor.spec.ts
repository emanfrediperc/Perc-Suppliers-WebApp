import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

function runInterceptor(authMock: any, req: any) {
  TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: authMock }] });
  const next = vi.fn().mockReturnValue(of(null));
  TestBed.runInInjectionContext(() => authInterceptor(req, next));
  return next;
}

describe('authInterceptor', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('agrega el header Bearer en requests /api/ cuando hay token', () => {
    const cloned = { cloned: true };
    const req: any = { url: 'http://host/api/v1/facturas', clone: vi.fn().mockReturnValue(cloned) };
    const next = runInterceptor({ getToken: () => 'tok123' }, req);
    expect(req.clone).toHaveBeenCalledWith({ setHeaders: { Authorization: 'Bearer tok123' } });
    expect(next).toHaveBeenCalledWith(cloned);
  });

  it('no agrega header si no hay token', () => {
    const req: any = { url: 'http://host/api/v1/facturas', clone: vi.fn() };
    const next = runInterceptor({ getToken: () => null }, req);
    expect(req.clone).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(req);
  });

  it('ignora requests que no son a /api/', () => {
    const req: any = { url: 'http://host/assets/logo.png', clone: vi.fn() };
    const next = runInterceptor({ getToken: () => 'tok123' }, req);
    expect(req.clone).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(req);
  });
});
