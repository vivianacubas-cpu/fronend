import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { HOME_ROUTES } from './features/home/home.routes';
import { LANDING_ROUTES } from './features/landing/landing.routes';
import { TRAMITE_ROUTES } from './features/tramite/tramite.routes';
import {
    SOLICITUDES_FUT_PUBLIC_ROUTES,
    SOLICITUDES_FUT_ADMIN_ROUTES,
} from './features/solicitudes-fut/solicitudes-fut.routes';
import { SEGUIMIENTO_ROUTES } from './features/seguimiento/seguimiento.routes';
import { SOLICITANTES_ADMIN_ROUTES } from './features/solicitantes/solicitantes.routes';
import { TIPO_TRAMITE_ADMIN_ROUTES } from './features/tipo-tramite/tipo-tramite.routes';
import { GESTION_TRAMITE_ADMIN_ROUTES } from './features/gestion-tramite/gestion-tramite.routes';
import { REPORTS_ADMIN_ROUTES } from './features/reports/reports.routes';
import { USERS_ADMIN_ROUTES } from './features/users/users.routes';

export const routes: Routes = [
    // ── Rutas públicas ──────────────────────────────────────────────────────
    ...HOME_ROUTES,
    ...LANDING_ROUTES,
    ...TRAMITE_ROUTES,
    ...AUTH_ROUTES,
    ...SOLICITUDES_FUT_PUBLIC_ROUTES,
    ...SEGUIMIENTO_ROUTES,

    // ── Área administrativa — todas las páginas comparten el AdminLayoutComponent ──
    {
        path: 'admin',
        loadComponent: () =>
            import('./core/layouts/admin-layout/admin-layout.component').then(
                m => m.AdminLayoutComponent,
            ),
        canActivate: [authGuard],
        children: [
            // Solicitudes FUT (listado y detalle)
            ...SOLICITUDES_FUT_ADMIN_ROUTES,
            // Solicitantes
            ...SOLICITANTES_ADMIN_ROUTES,
            // Tipos de trámite
            ...TIPO_TRAMITE_ADMIN_ROUTES,
            // Gestión de Trámite
            ...GESTION_TRAMITE_ADMIN_ROUTES,
            // Reportes
            ...REPORTS_ADMIN_ROUTES,
            // Usuarios
            ...USERS_ADMIN_ROUTES,
            // Redirigir /admin → /admin/tramites por defecto
            { path: '', redirectTo: 'tramites', pathMatch: 'full' },
        ],
    },

    { path: '**', redirectTo: '' },
];
