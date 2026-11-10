import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor de errores HTTP global.
 *
 * - 401: cierra la sesión y redirige al login.
 * - 403: redirige al panel principal (sin permisos).
 * - 0 / unknown: transforma el error en un mensaje legible (sin conexión al servidor).
 * - Cualquier otro error: reenvía el error para que lo maneje el componente.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth   = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Si el 401 viene del propio endpoint de login, no redirigir:
        // dejar que el componente de login maneje el mensaje de error.
        const isLoginRequest = req.url.includes('/auth/login');
        if (!isLoginRequest) {
          auth.logout();
          void router.navigateByUrl('/admin/login');
          return throwError(() => new Error('Sesión expirada. Por favor vuelve a iniciar sesión.'));
        }
      }

      if (error.status === 403) {
        void router.navigateByUrl('/admin/tramites');
        return throwError(() => new Error('No tienes permisos para acceder a este recurso.'));
      }

      if (error.status === 0) {
        return throwError(() => new Error('No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté en ejecución.'));
      }

      const message =
        (error.error as { message?: string })?.message ??
        error.message ??
        `Error inesperado (${error.status})`;

      return throwError(() => new Error(message));
    }),
  );
};
