import { Routes } from '@angular/router';

export const TRAMITE_ROUTES: Routes = [
    {
        path: 'tramite',
        loadComponent: () => import('./pages/tramite/tramite.component').then(m => m.TramiteComponent),
    },
];
