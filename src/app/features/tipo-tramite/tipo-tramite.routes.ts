import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
export const TIPO_TRAMITE_ROUTES: Routes = [
    {
        path: 'admin/tipo-tramite',
        loadComponent: () => import('./pages/tipo-tramite/tipo-tramite.component').then(m => m.TipoTramiteComponent),
        canActivate: [authGuard],
    },
];
