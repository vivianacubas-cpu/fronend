import { Routes } from '@angular/router';
export const AUTH_ROUTES: Routes = [
    {
        path: 'admin/login',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    },
];
