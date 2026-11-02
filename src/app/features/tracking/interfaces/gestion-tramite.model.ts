/**
 * Respuesta del backend para una gestión de trámite FUT.
 * Campos que devuelve GestionTramiteResponse (record Java):
 *   idGestion, numero, numeroDocumento, apellidoPaterno, apellidoMaterno,
 *   nombres, responsable, areaResponsable, fechaRecepcion, tipoGestion,
 *   prioridad, fechaLimite, estado (texto legible del estadoGestion),
 *   decision, fechaResolucion, fechaRegistro, fechaActualizacion,
 *   fechaEliminacion, fechaRestauracion.
 */
export interface GestionTramite {
    idGestion?: number;

    // Campo correlativo de fila (del backend)
    numero?: number;

    // Datos del solicitante (vienen del GestionTramiteResponse)
    idSolicitante: number;
    numeroDocumento?: string | null;
    apellidoPaterno?: string | null;   // apellido paterno del SOLICITANTE
    apellidoMaterno?: string | null;   // apellido materno del SOLICITANTE
    nombres?: string | null;           // nombres del SOLICITANTE

    // Responsable de la gestión
    responsable?: string | null;       // nombre completo del responsable (nombres + apellidos)
    areaResponsable?: string | null;   // nombre del área responsable

    // Datos de la gestión
    tipoGestion: string;              // texto legible: Recepción, Evaluación, etc.
    prioridad?: string;               // texto legible: Normal, Urgente, Muy urgente
    /**
     * estado: texto legible del estado de gestión (Pendiente, En proceso, etc.)
     * El backend serializa estadoGestion como "estado" en el JSON de respuesta.
     */
    estado?: string | null;
    fechaRecepcion?: string;
    fechaLimite?: string | null;
    fechaResolucion?: string | null;
    decision?: string | null;
    fundamentoDecision?: string | null;
    observaciones?: string | null;

    // Auditoría
    fechaRegistro?: string;
    fechaActualizacion?: string | null;
    fechaEliminacion?: string | null;
    fechaRestauracion?: string | null;

    // Campos internos para el formulario (no vienen del JSON de respuesta del listado)
    idAreaResponsable?: number | null;
    nombresResponsable?: string | null;
    apellidoPaternoResponsable?: string | null;
    apellidoMaternoResponsable?: string | null;

    // estadoGestion: código interno del estado (PENDIENTE, EN_PROCESO, etc.)
    // Se deriva del campo "estado" del JSON para usarlo en filtros y formulario.
    estadoGestion?: string;
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
