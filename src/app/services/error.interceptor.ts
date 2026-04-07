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
      if (error.status === 401) {
        auth.logout();
      } else if (error.status === 403) {
        toast.error('No tiene permisos para realizar esta accion');
      } else if (error.status === 0) {
        toast.error('Error de conexion. Verifique su red');
      } else if (error.status >= 500) {
        toast.error('Error del servidor. Intente nuevamente');
      }
      return throwError(() => error);
    }),
  );
};
