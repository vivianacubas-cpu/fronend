import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
export const REPORTS_ROUTES: Routes = [
    {
        path: 'admin/reportes',
        loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [authGuard],
    },
];
