import { Routes } from '@angular/router';

export const LANDING_ROUTES: Routes = [
    {
        path: 'inicio',
        loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent),
    },
];
