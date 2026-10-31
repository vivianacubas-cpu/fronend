import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
@Component({ standalone: true, imports: [CommonModule, FormsModule, RouterLink], templateUrl: './login.component.html', styleUrl: './login.component.css' })
export class LoginComponent {
    username = '';
    password = '';
    error = '';
    loading = false;
    showPw = false;
    constructor(private auth: AuthService, private router: Router) { }
    submit() { this.error = ''; this.loading = true; this.auth.login(this.username, this.password).subscribe({ next: () => { this.loading = false; this.router.navigateByUrl('/admin/tramites'); }, error: (err) => { this.loading = false; this.error = err?.message || 'No se pudo iniciar sesión. Verifica tus credenciales.'; } }); }
}

