import { Component, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Cierra la sesión administrativa
   * y redirige al usuario al inicio de sesión.
   */
  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/admin/login');
  }
}