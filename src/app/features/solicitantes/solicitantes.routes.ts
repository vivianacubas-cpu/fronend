import { Routes } from '@angular/router';

/**
 * Rutas administrativas para la gestión de solicitantes (hijas de /admin).
 */
export const SOLICITANTES_ADMIN_ROUTES: Routes = [
    {
        path: 'solicitantes',
        loadComponent: () =>
            import('./pages/solicitante/solicitante.component').then(
                m => m.SolicitanteComponent,
            ),
    },
];
