import { StatusInfo } from '../interfaces/status-info.model';

export type { StatusInfo } from '../interfaces/status-info.model';

const MAP: Record<string, StatusInfo> = {
    RECIBIDO: { label: 'Recibido', css: 'st-received', step: 0, description: 'Tu solicitud fue registrada y está en espera de revisión.' },
    PENDIENTE: { label: 'Pendiente', css: 'st-received', step: 0, description: 'Tu solicitud fue registrada y está en espera de revisión.' },
    EN_REVISION: { label: 'En revisión', css: 'st-review', step: 1, description: 'El personal de la institución está revisando tu solicitud.' },
    'EN REVISIÓN': { label: 'En revisión', css: 'st-review', step: 1, description: 'El personal de la institución está revisando tu solicitud.' },
    OBSERVADO: { label: 'Observado', css: 'st-observed', step: 1, description: 'Tu solicitud tiene observaciones. Acércate a la institución para subsanarlas.' },
    OBSERVADA: { label: 'Observado', css: 'st-observed', step: 1, description: 'Tu solicitud tiene observaciones. Acércate a la institución para subsanarlas.' },
    ATENDIDO: { label: 'Atendido', css: 'st-done', step: 2, description: 'Tu solicitud fue atendida. Revisa tu correo o acércate a la institución.' },
    ATENDIDA: { label: 'Atendido', css: 'st-done', step: 2, description: 'Tu solicitud fue atendida. Revisa tu correo o acércate a la institución.' },
    RECHAZADO: { label: 'No procede', css: 'st-rejected', step: 2, description: 'Tu solicitud no procede. Consulta en la institución para más información.' },
    NO_PROCEDE: { label: 'No procede', css: 'st-rejected', step: 2, description: 'Tu solicitud no procede. Consulta en la institución para más información.' }
};
export function statusInfo(status: string | null | undefined): StatusInfo {
    const key = String(status || '').trim().toUpperCase();
    return MAP[key] || { label: key || 'Sin estado', css: 'st-received', step: 0, description: 'Estado registrado en el sistema.' };
}
