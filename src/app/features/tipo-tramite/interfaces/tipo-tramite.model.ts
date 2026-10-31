/** Modelo lógico de tipo_tramite: 10 campos de negocio y 4 campos de auditoría. */
export interface TipoTramite {
    idTipoTramite: number;
    codigo?: string;
    nombre: string;
    categoria?: string;
    descripcion?: string;
    requisitos?: string;
    plazoEstimadoDias?: number;
    requiereDocumentos?: boolean;
    vigentDesde?: string;
    estado: boolean;
    fechaRegistro?: string;
    fechaActualizacion?: string;
    fechaEliminacion?: string;
    fechaRestauracion?: string;
}

/** Datos editables del formulario; los campos de auditoria y el ID no se ingresan manualmente. */
export type TipoTramiteEntrada = Omit<TipoTramite, 'idTipoTramite' | 'fechaRegistro' | 'fechaActualizacion' | 'fechaEliminacion' | 'fechaRestauracion'>;
