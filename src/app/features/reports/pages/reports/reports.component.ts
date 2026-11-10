import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FutService } from '../../../solicitudes-fut';
@Component({ standalone: true, imports: [CommonModule, RouterLink], templateUrl: './reports.component.html' })
export class ReportsComponent {
    rows: any[] = [];
    error = '';
    constructor(f: FutService) { f.list().subscribe({ next: r => this.rows = r, error: () => this.error = 'No se pudieron cargar los datos.' }); }
    count(s: string) { return this.rows.filter(r => r.status === s).length; }
}
