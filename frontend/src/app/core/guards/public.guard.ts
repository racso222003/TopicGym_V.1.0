import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const publicGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.verificarSesion().pipe(
    map((autenticado) => {
      if (!autenticado) {
        return true;
      }

      const usuario = auth.usuario();
      const rol = usuario?.rol ?? usuario?.rol_codigo;

      if (rol === 'DOCENTE' || rol === 'ADMIN') {
        return router.createUrlTree(['/teacher-dashboard']);
      }

      return router.createUrlTree(['/catalogo']);
    }),
  );
};
