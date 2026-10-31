/**
 * Respuesta del backend para una gestión de trámite FUT.
 * Orden exacto según @JsonPropertyOrder de GestionTramiteFut.java.
 */
export interface GestionTramite {
    idGestion?: number;
    idSolicitante: number;

    // Datos del solicitante (del backend vía @Transient — ocultos en el JSON de respuesta,
    // pero el frontend los obtiene del servicio de solicitantes por idSolicitante)
    numeroDocumento?: string | null;

    // Responsable de la gestión
    nombresResponsable?: string | null;
    apellidoPaterno?: string | null;    // apellidoPaternoResponsable serializado como "apellidoPaterno"
    apellidoMaterno?: string | null;    // apellidoMaternoResponsable serializado como "apellidoMaterno"
    areaResponsable?: string | null;    // nombreAreaResponsable serializado como "areaResponsable"

    // Datos de la gestión
    tipoGestion: string;
    prioridad?: string;
    estadoGestion?: string;
    fechaRecepcion?: string;
    fechaLimite?: string | null;
    fechaResolucion?: string | null;
    decision?: string | null;
    fundamentoDecision?: string | null;
    observaciones?: string | null;

    // Auditoría
    fechaRegistro?: string;
    fechaActualizacion?: string;
    fechaEliminacion?: string;
    fechaRestauracion?: string;

    // Internos — para uso del formulario y la tabla (no vienen todos del JSON de respuesta)
    idAreaResponsable?: number | null;
    apellidoPaternoResponsable?: string | null;
    apellidoMaternoResponsable?: string | null;
    estado?: string;
}

/**
 * Payload de entrada para crear o actualizar una gestión.
 * Coincide con GestionTramiteRequest.java del backend.
 */
export interface GestionTramiteRequest {
    idSolicitante: number;
    nombreResponsable?: string | null;
    nombresResponsable?: string | null;
    apellidoPaternoResponsable?: string | null;
    apellidoMaternoResponsable?: string | null;
    idAreaResponsable?: number | null;
    fechaRecepcion?: string;
    tipoGestion: string;
    prioridad?: string;
    fechaLimite?: string | null;
    estadoGestion?: string;
    decision?: string | null;
    fundamentoDecision?: string | null;
    fechaResolucion?: string | null;
    observaciones?: string | null;
}

export const TIPOS_GESTION = [
    { value: 'RECEPCION',   label: 'Recepción'    },
    { value: 'EVALUACION',  label: 'Evaluación'   },
    { value: 'DERIVACION',  label: 'Derivación'   },
    { value: 'APROBACION',  label: 'Aprobación'   },
    { value: 'RECHAZO',     label: 'Rechazo'      },
    { value: 'SUBSANACION', label: 'Subsanación'  },
];

export const PRIORIDADES = [
    { value: 'NORMAL',      label: 'Normal'       },
    { value: 'URGENTE',     label: 'Urgente'      },
    { value: 'MUY_URGENTE', label: 'Muy urgente'  },
];

export const ESTADOS_GESTION = [
    { value: 'PENDIENTE',   label: 'Pendiente'    },
    { value: 'EN_PROCESO',  label: 'En proceso'   },
    { value: 'OBSERVADO',   label: 'Observado'    },
    { value: 'APROBADO',    label: 'Aprobado'     },
    { value: 'RECHAZADO',   label: 'Rechazado'    },
];
