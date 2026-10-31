import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const SOLICITANTE_ROUTES: Routes = [
    {
        path: 'admin/solicitantes',
        loadComponent: () => import('./pages/solicitante/solicitante.component').then(m => m.SolicitanteComponent),
        canActivate: [authGuard],
    },
];
