import { Injectable } from '@angular/core';
import { buildPdf, PdfDoc } from '../../../shared/utils/pdf';
import { statusInfo } from '../../../shared/utils/status';
@Injectable({ providedIn: 'root' })
export class MailService {
    private fullName(r: any): string {
        return String(r?.fullName || [r?.nombres, r?.apellidoPaterno, r?.apellidoMaterno].filter(Boolean).join(' ')).trim();
    }
    /** PDF con los datos del trámite. Si es una actualización incluye estado, observación e historial. */
    buildPdf(r: any, kind: 'registro' | 'seguimiento'): Uint8Array {
        const st = statusInfo(r.status);
        const doc: PdfDoc = {
            title: kind === 'registro' ? 'Constancia de registro de trámite' : 'Seguimiento de trámite',
            subtitle: `Emitido el ${new Date().toLocaleString('es-PE')}`,
            sections: [
                { title: 'Seguimiento', rows: [
                        { label: 'Código', value: r.trackingCode },
                        { label: 'Estado actual', value: st.label },
                        { label: 'Fecha de registro', value: r.createdAt ? new Date(r.createdAt).toLocaleString('es-PE') : '' },
                        ...(kind === 'seguimiento' ? [{ label: 'Observación', value: r.observation || 'Sin observaciones.' }] : [])
                    ] },
                { title: 'Datos del trámite', rows: [
                        { label: 'Trámite', value: r.tipoTramite || r.solicitante },
                        { label: 'Tipo de solicitante', value: r.tipoSolicitante || '' },
                        { label: 'Fundamentación', value: r.basis },
                        { label: 'Documentos que se adjuntan', value: r.attachedDocuments || 'Ninguno declarado' },
                        { label: 'Archivo adjunto', value: r.archivoNombre || 'Sin archivo adjunto' },
                        { label: 'Folios', value: r.folios != null ? String(r.folios) : '' }
                    ] },
                { title: 'Datos del solicitante', rows: [
                        { label: 'Apellidos y nombres', value: this.fullName(r) },
                        { label: 'Documento', value: `${r.tipoDocumento ? r.tipoDocumento + ' ' : ''}${r.dni || ''}` },
                        { label: 'Dirección', value: [r.address, r.district, r.province, r.department].filter(Boolean).join(', ') },
                        { label: 'Teléfono fijo', value: r.telefonoFijo || 'No indicado' },
                        { label: 'Celular', value: r.celular || r.cellphone || 'No indicado' },
                        { label: 'Correo electrónico', value: r.email || '' }
                    ] }
            ],
            footer: 'Conserve este documento. Con su código de seguimiento puede consultar el estado de su trámite en la página de seguimiento del sistema.'
        };
        if (kind === 'seguimiento' && r.history?.length) {
            doc.sections.push({ title: 'Historial de cambios', paragraphs: r.history.map((h: any) => `${new Date(h.changedAt).toLocaleString('es-PE')} - ${statusInfo(h.oldStatus).label} → ${statusInfo(h.newStatus).label}${h.observation ? ': ' + h.observation : ''}`) });
        }
        return buildPdf(doc);
    }
    download(name: string, pdf: Uint8Array) {
        const url = URL.createObjectURL(new Blob([pdf as BlobPart], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
}

