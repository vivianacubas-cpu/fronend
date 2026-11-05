import { Routes } from '@angular/router';

/**
 * Rutas administrativas para la gestión de usuarios (hijas de /admin).
 */
export const USERS_ADMIN_ROUTES: Routes = [
    {
        path: 'usuarios',
        loadComponent: () =>
            import('./pages/user-list/user-list.component').then(
                m => m.UserListComponent,
            ),
    },
];
