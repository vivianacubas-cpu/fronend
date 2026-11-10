import { Routes } from '@angular/router';

/**
 * Rutas administrativas para los tipos de trámite (hijas de /admin).
 */
export const TIPO_TRAMITE_ADMIN_ROUTES: Routes = [
    {
        path: 'tipo-tramite',
        loadComponent: () =>
            import('./pages/tipo-tramite/tipo-tramite.component').then(
                m => m.TipoTramiteComponent,
            ),
    },
];
