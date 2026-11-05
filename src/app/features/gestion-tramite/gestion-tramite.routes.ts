import { Routes } from '@angular/router';

/**
 * Rutas administrativas para la gestión de trámites (hijas de /admin).
 */
export const GESTION_TRAMITE_ADMIN_ROUTES: Routes = [
    {
        path: 'gestion-tramite',
        loadComponent: () =>
            import('./pages/gestion-tramite/gestion-tramite.component').then(
                m => m.GestionTramiteComponent,
            ),
    },
];
