import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FutService } from '../../../fut';
import { statusInfo } from '../../../../shared/utils/status';
@Component({ standalone: true, imports: [CommonModule, FormsModule, RouterLink], templateUrl: './tracking.component.html', styleUrl: './tracking.component.css' })
export class TrackingComponent {
    code = '';
    result: any = null;
    error = '';
    loading = false;
    copied = false;
    readonly steps = ['Recibido', 'En revisión', 'Finalizado'];
    constructor(private fut: FutService) { }
    get info() { return statusInfo(this.result?.status); }
    get finalLabel() { return this.info.step === 2 ? this.info.label : 'Finalizado'; }
    stepState(i: number): 'done' | 'current' | 'pending' {
        const cur = this.info.step;
        if (i < cur)
            return 'done';
        if (i === cur)
            return 'current';
        return 'pending';
    }
    search() {
        this.error = '';
        this.result = null;
        this.copied = false;
        const c = this.code.trim().toUpperCase();
        if (!c) {
            this.error = 'Escribe tu código de seguimiento.';
            return;
        }
        this.code = c;
        this.loading = true;
        this.fut.track(c).subscribe({
            next: r => { this.result = r; this.loading = false; },
            error: e => { this.error = e?.message || 'No encontramos ese código de seguimiento.'; this.loading = false; }
        });
    }
    clear() { this.code = ''; this.result = null; this.error = ''; this.copied = false; }
    copy() {
        if (this.result?.trackingCode && navigator.clipboard) {
            navigator.clipboard.writeText(this.result.trackingCode).then(() => { this.copied = true; setTimeout(() => this.copied = false, 2000); }).catch(() => { });
        }
    }
    print() { window.print(); }
}
