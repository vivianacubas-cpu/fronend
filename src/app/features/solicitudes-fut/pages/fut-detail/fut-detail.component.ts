import { Component, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { statusInfo } from '../../../../shared/utils/status';
import { FutService, FutPayload } from '../../services/fut.service';
import { AttachmentStore } from '../../services/attachment.store';
@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './fut-detail.component.html'
})
export class FutDetailComponent implements OnDestroy {
    item: any = null;
    status = '';
    observation = '';
    error = '';
    message = '';
    editing = false;
    attachment: {
        name: string;
        type: string;
        size: number;
        url: string;
        safeUrl: SafeResourceUrl;
        isImage: boolean;
        isPdf: boolean;
    } | null = null;
    attachmentError = '';
    private readonly id: number;
    constructor(route: ActivatedRoute, private readonly fut: FutService, private readonly router: Router, private readonly files: AttachmentStore, private readonly sanitizer: DomSanitizer) {
        this.id = Number(route.snapshot.paramMap.get('id'));
        this.loadDetail();
    }
    private loadDetail(): void {
        this.fut.detail(this.id).subscribe({
            next: (result) => {
                this.item = result;
                this.status = result.status || 'RECIBIDO';
                this.observation = result.observation || '';
                this.error = '';
                this.loadAttachment();
            },
            error: (err) => this.error = err?.message || 'No se pudo consultar el detalle.'
        });
    }
    private async loadAttachment(): Promise<void> {
        if (this.attachment)
            return;
        try {
            const a = await this.files.get(this.id);
            if (!a)
                return;
            const url = URL.createObjectURL(a.blob);
            const type = a.type || '';
            this.attachment = { name: a.name, type, size: a.size, url, safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(url),
                isImage: type.startsWith('image/'), isPdf: type === 'application/pdf' || /\.pdf$/i.test(a.name) };
        }
        catch (e: any) {
            this.attachmentError = e?.message || 'No se pudo cargar el archivo adjunto.';
        }
    }
    ngOnDestroy(): void { if (this.attachment)
        URL.revokeObjectURL(this.attachment.url); }
    get info() { return statusInfo(this.item?.status); }
    remove(): void {
        if (!confirm('¿Eliminar lógicamente esta solicitud? Podrás restaurarla desde "Ver eliminadas".'))
            return;
        this.fut.deleteRequest(this.id).subscribe({
            next: () => this.router.navigateByUrl('/admin/tramites'),
            error: (err) => this.error = err?.message || 'No se pudo eliminar la solicitud.'
        });
    }
    startEdit(): void {
        this.error = '';
        this.message = '';
        this.editing = true;
    }
    saveEdit(): void {
        if (!this.item)
            return;
        this.error = '';
        this.message = '';
        const payload: FutPayload = {
            solicitante: this.item.solicitante || '',
            fullName: this.item.fullName || '',
            dni: this.item.dni || '',
            email: this.item.email || '',
            cellphone: this.item.cellphone || '',
            address: this.item.address || '',
            district: this.item.district || '',
            province: this.item.province || '',
            basis: this.item.basis || '',
            attachedDocuments: this.item.attachedDocuments || '',
            declaredDate: this.item.declaredDate ? String(this.item.declaredDate).slice(0, 10) : '',
            signatureNote: this.item.signatureNote || '',
            tipoTramite: this.item.tipoTramite || this.item.solicitante || '',
            tipoSolicitante: this.item.tipoSolicitante || '',
            tipoDocumento: this.item.tipoDocumento || 'DNI',
            apellidoPaterno: this.item.apellidoPaterno || '',
            apellidoMaterno: this.item.apellidoMaterno || '',
            nombres: this.item.nombres || '',
            department: this.item.department || '',
            numeroDepto: this.item.numeroDepto || '',
            telefonoFijo: this.item.telefonoFijo || '',
            folios: this.item.folios ?? null,
            archivoNombre: this.item.archivoNombre || '',
            archivoTipo: this.item.archivoTipo || '',
            archivoTamano: this.item.archivoTamano ?? null
        };
        this.fut.updateRequest(this.id, payload).subscribe({
            next: () => {
                this.message = 'Datos de la solicitud actualizados correctamente.';
                this.editing = false;
                this.loadDetail();
            },
            error: (err) => this.error = err?.message || 'No se pudo actualizar la solicitud.'
        });
    }
    save(): void {
        this.error = '';
        this.message = '';
        this.fut.update(this.id, this.status, this.observation).subscribe({
            next: (record) => {
                this.message = 'Cambios guardados.';
                this.loadDetail();
            },
            error: (err) => this.error = err?.message || 'No se pudo guardar el cambio. Verifica la conexión con el backend.'
        });
    }
}

