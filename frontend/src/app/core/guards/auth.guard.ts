import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.verificarSesion().pipe(
    map((autenticado) => {
      if (!autenticado) {
        return router.createUrlTree(['/login']);
      }

      const usuario = auth.usuario();
      const rol = usuario?.rol ?? usuario?.rol_codigo;
      const url = state.url;

      if (rol === 'DOCENTE' || rol === 'ADMIN') {
        if (
          url.startsWith('/catalogo') ||
          url.startsWith('/dashboard') ||
          url.startsWith('/tema') ||
          url.startsWith('/logica') ||
          url.startsWith('/progreso') ||
          url.startsWith('/logros')
        ) {
          return router.createUrlTree(['/teacher-dashboard']);
        }
      }

      return true;
    }),
  );
};
