import { Routes } from '@angular/router';

/**
 * Rutas administrativas para reportes (hijas de /admin).
 */
export const REPORTS_ADMIN_ROUTES: Routes = [
    {
        path: 'reportes',
        loadComponent: () =>
            import('./pages/reports/reports.component').then(
                m => m.ReportsComponent,
            ),
    },
];
