import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Limpia la sesión si el backend responde 401 en rutas protegidas. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const esRutaAuth = req.url.includes('/auth/login') || req.url.includes('/auth/me');
      if (err.status === 401 && !esRutaAuth) {
        auth.limpiar();
      }
      return throwError(() => err);
    }),
  );
};
