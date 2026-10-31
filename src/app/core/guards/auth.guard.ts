import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Protege las rutas del panel administrativo.
 * Requiere sesión activa con rol DIRECTORA, SECRETARIA o ADMIN.
 * Si no cumple, redirige a /admin/login.
 */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn() && auth.canAccessAdmin()) {
    return true;
  }

  return router.createUrlTree(['/admin/login']);
};
