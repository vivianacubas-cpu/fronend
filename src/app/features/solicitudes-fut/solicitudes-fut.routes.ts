import { Routes } from '@angular/router';

/**
 * Rutas de la feature Solicitudes FUT.
 *
 * Exporta dos conjuntos de rutas:
 * - PUBLIC_ROUTES: ruta pública del formulario de nueva solicitud.
 * - ADMIN_ROUTES:  rutas administrativas (listado y detalle) que se
 *   integran como hijas del área /admin en app.routes.ts.
 */

/** Ruta pública: formulario de nueva solicitud FUT. */
export const SOLICITUDES_FUT_PUBLIC_ROUTES: Routes = [
    {
        path: 'fut/nuevo',
        loadComponent: () =>
            import('./pages/fut-create/fut-create.component').then(
                m => m.FutCreateComponent,
            ),
    },
];

/** Rutas administrativas para la gestión de solicitudes FUT (hijas de /admin). */
export const SOLICITUDES_FUT_ADMIN_ROUTES: Routes = [
    {
        path: 'tramites',
        loadComponent: () =>
            import('./pages/fut-list/fut-list.component').then(
                m => m.FutListComponent,
            ),
    },
    {
        path: 'tramites/:id',
        loadComponent: () =>
            import('./pages/fut-detail/fut-detail.component').then(
                m => m.FutDetailComponent,
            ),
    },
];
