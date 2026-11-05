import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService, ADMIN_ROLES } from '../services/auth.service';

/**
 * Guard de roles: permite el acceso solo si el usuario autenticado tiene
 * alguno de los roles indicados en el dato de la ruta `data.roles`.
 *
 * Ejemplo de uso en routes:
 *   {
 *     path: 'admin',
 *     canActivate: [authGuard, roleGuard],
 *     data: { roles: ['DIRECTORA', 'ADMIN'] }
 *   }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/admin/login']);
  }

  const allowedRoles: string[] = route.data?.['roles'] ?? [...ADMIN_ROLES];
  const userRole = auth.user()?.role ?? '';

  if (allowedRoles.includes(userRole)) {
    return true;
  }

  // No tiene el rol requerido → redirigir al panel principal
  return router.createUrlTree(['/admin/tramites']);
};
