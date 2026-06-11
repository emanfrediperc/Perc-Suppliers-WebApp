import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ToastService } from '../shared/toast/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error) => {
      // El backend (NestJS) devuelve { message } como string o como array (validaciones).
      const raw = error?.error?.message;
      const backendMsg = Array.isArray(raw) ? raw.join(', ') : raw;

      // Solo cerrar sesión en un 401 de una sesión YA activa y fuera del flujo de
      // autenticación. Si no, un código 2FA incorrecto (o un login fallido) — que el
      // backend responde como 401 — echaría al usuario en medio del flujo.
      const url = req.url;
      const esFlujoAuth =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/totp');
      if (error.status === 401 && auth.isAuthenticated() && !esFlujoAuth) {
        auth.logout();
      } else if (error.status === 403) {
        toast.error('No tiene permisos para realizar esta accion');
      } else if (error.status === 400 || error.status === 422) {
        toast.error(backendMsg || 'Datos invalidos. Revise el formulario');
      } else if (error.status === 409) {
        toast.error(backendMsg || 'Conflicto: el recurso ya existe o esta en uso');
      } else if (error.status === 0) {
        toast.error('Error de conexion. Verifique su red');
      } else if (error.status >= 500) {
        toast.error('Error del servidor. Intente nuevamente');
      }
      return throwError(() => error);
    }),
  );
};
