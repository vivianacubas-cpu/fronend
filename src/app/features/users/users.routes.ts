import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
export const USERS_ROUTES: Routes = [
    {
        path: 'admin/usuarios',
        loadComponent: () => import('./pages/user-list/user-list.component').then(m => m.UserListComponent),
        canActivate: [authGuard],
    },
];
