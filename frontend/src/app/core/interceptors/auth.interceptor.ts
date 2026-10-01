import { HttpInterceptorFn } from '@angular/common/http';

/** Envía la cookie httpOnly de sesión en cada petición a la API. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};
