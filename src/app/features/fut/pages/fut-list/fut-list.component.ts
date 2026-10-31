import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FutService } from '../../services/fut.service';
import { AuthService } from '../../../../core/services/auth.service';
import { statusInfo } from '../../../../shared/utils/status';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './fut-list.component.html',
  styleUrl: './fut-list.component.css',
})
export class FutListComponent {
  rows: any[]     = [];
  filtered: any[] = [];
  showDeleted = false;
  status  = '';
  query   = '';
  fromDate = '';
  toDate   = '';
  error   = '';
  loading = false;

  /** Datos del usuario autenticado (directora.demo / secretaria.demo u otro) */
  get currentUser() { return this.auth.user(); }

  constructor(
    private fut:    FutService,
    private auth:   AuthService,
    private router: Router,
  ) { this.load(); }

  load() {
    this.loading = true;
    this.error   = '';
    (this.showDeleted ? this.fut.deleted() : this.fut.list(this.status)).subscribe({
      next:  (r) => { this.rows = Array.isArray(r) ? r : []; this.loading = false; this.applyFilters(); },
      error: (e) => { this.error = e?.message || 'No se pudieron cargar los trámites.'; this.loading = false; this.rows = []; this.filtered = []; },
    });
  }

  applyFilters() {
    const q = this.query.trim().toLocaleLowerCase();
    this.filtered = this.rows.filter((r) => {
      const match = !q || [r.trackingCode, r.fullName, r.dni, r.solicitante].some(
        (v) => String(v || '').toLocaleLowerCase().includes(q)
      );
      const d = String(r.createdAt || r.declaredDate || '').slice(0, 10);
      return match && (!this.fromDate || d >= this.fromDate) && (!this.toDate || d <= this.toDate);
    });
  }

  toggleDeleted() { this.showDeleted = !this.showDeleted; this.load(); }

  remove(r: any) {
    if (!confirm('¿Eliminar lógicamente esta solicitud? Podrás restaurarla después.')) return;
    this.fut.deleteRequest(r.id).subscribe({ next: () => this.load(), error: (e) => this.error = e?.message || 'No se pudo eliminar.' });
  }

  restore(r: any) {
    if (!confirm('¿Restaurar esta solicitud?')) return;
    this.fut.restoreRequest(r.id).subscribe({ next: () => this.load(), error: (e) => this.error = e?.message || 'No se pudo restaurar.' });
  }

  info(s: string)  { return statusInfo(s); }
  count(s: string) { return this.rows.filter((r) => r.status === s).length; }
  logout()         { this.auth.logout(); this.router.navigateByUrl('/admin/login'); }

}
