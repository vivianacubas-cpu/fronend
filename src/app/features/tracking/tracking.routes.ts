import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const TRACKING_ROUTES: Routes = [
    {
        path: 'seguimiento',
        loadComponent: () => import('./pages/tracking/tracking.component').then(m => m.TrackingComponent),
    },
    {
        path: 'admin/gestion-tramite',
        loadComponent: () => import('./pages/gestion-tramite/gestion-tramite.component').then(m => m.GestionTramiteComponent),
        canActivate: [authGuard],
    },
];
