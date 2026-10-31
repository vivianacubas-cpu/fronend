import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { HOME_ROUTES } from './features/home/home.routes';
import { LANDING_ROUTES } from './features/landing/landing.routes';
import { REPORTS_ROUTES } from './features/reports/reports.routes';
import { TRAMITE_ROUTES } from './features/tramite/tramite.routes';
import { USERS_ROUTES } from './features/users/users.routes';

export const routes: Routes = [
    // ── Rutas públicas ──────────────────────────────────────────────────────
    ...HOME_ROUTES,
    ...LANDING_ROUTES,
    ...TRAMITE_ROUTES,
    ...AUTH_ROUTES,

    // ── Nueva solicitud (pública) ────────────────────────────────────────────
    {
        path: 'fut/nuevo',
        loadComponent: () =>
            import('./features/fut/pages/fut-create/fut-create.component').then(
                m => m.FutCreateComponent,
            ),
    },

    // ── Seguimiento público ──────────────────────────────────────────────────
    {
        path: 'seguimiento',
        loadComponent: () =>
            import('./features/tracking/pages/tracking/tracking.component').then(
                m => m.TrackingComponent,
            ),
    },

    // ── Área administrativa — todas las páginas comparten el AdminLayoutComponent ──
    {
        path: 'admin',
        loadComponent: () =>
            import('./core/layouts/admin-layout/admin-layout.component').then(
                m => m.AdminLayoutComponent,
            ),
        canActivate: [authGuard],
        children: [
            // Solicitudes FUT (listado)
            {
                path: 'tramites',
                loadComponent: () =>
                    import('./features/fut/pages/fut-list/fut-list.component').then(
                        m => m.FutListComponent,
                    ),
            },
            // Detalle de solicitud
            {
                path: 'tramites/:id',
                loadComponent: () =>
                    import('./features/fut/pages/fut-detail/fut-detail.component').then(
                        m => m.FutDetailComponent,
                    ),
            },
            // Solicitantes
            {
                path: 'solicitantes',
                loadComponent: () =>
                    import('./features/solicitante/pages/solicitante/solicitante.component').then(
                        m => m.SolicitanteComponent,
                    ),
            },
            // Tipos de trámite
            {
                path: 'tipo-tramite',
                loadComponent: () =>
                    import('./features/tipo-tramite/pages/tipo-tramite/tipo-tramite.component').then(
                        m => m.TipoTramiteComponent,
                    ),
            },
            // Gestión de Trámite FUT
            {
                path: 'gestion-tramite',
                loadComponent: () =>
                    import('./features/tracking/pages/gestion-tramite/gestion-tramite.component').then(
                        m => m.GestionTramiteComponent,
                    ),
            },
            // Reportes
            {
                path: 'reportes',
                loadComponent: () =>
                    import('./features/reports/pages/reports/reports.component').then(
                        m => m.ReportsComponent,
                    ),
            },
            // Usuarios
            {
                path: 'usuarios',
                loadComponent: () =>
                    import('./features/users/pages/user-list/user-list.component').then(
                        m => m.UserListComponent,
                    ),
            },
            // Redirigir /admin → /admin/tramites por defecto
            { path: '', redirectTo: 'tramites', pathMatch: 'full' },
        ],
    },

    { path: '**', redirectTo: '' },
];
