import { Routes } from '@angular/router';

/**
 * Ruta pública de seguimiento de trámite por código de seguimiento.
 */
export const SEGUIMIENTO_ROUTES: Routes = [
    {
        path: 'seguimiento',
        loadComponent: () =>
            import('./pages/tracking/tracking.component').then(
                m => m.TrackingComponent,
            ),
    },
];
