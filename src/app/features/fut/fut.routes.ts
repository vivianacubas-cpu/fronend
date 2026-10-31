import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
export const FUT_ROUTES: Routes = [
    {
        path: 'fut/nuevo',
        loadComponent: () => import('./pages/fut-create/fut-create.component').then(m => m.FutCreateComponent),
    },
    {
        path: 'admin/tramites',
        loadComponent: () => import('./pages/fut-list/fut-list.component').then(m => m.FutListComponent),
        canActivate: [authGuard],
    },
    {
        path: 'admin/tramites/:id',
        loadComponent: () => import('./pages/fut-detail/fut-detail.component').then(m => m.FutDetailComponent),
        canActivate: [authGuard],
    },
];
