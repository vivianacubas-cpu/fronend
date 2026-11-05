/**
 * Respuesta del backend para una gestión de trámite FUT.
 * Campos que devuelve GestionTramiteResponse (record Java) — en orden del JSON:
 *   idGestion, idSolicitante, idAreaResponsable,
 *   nombresResponsable, apellidoPaternoResponsable, apellidoMaternoResponsable,
 *   numero, numeroDocumento, apellidoPaterno, apellidoMaterno, nombres,
 *   responsable, areaResponsable, fechaRecepcion, tipoGestion, prioridad,
 *   fechaLimite, estado, decision, fundamentoDecision, observaciones,
 *   fechaResolucion, fechaRegistro, fechaActualizacion, fechaEliminacion, fechaRestauracion.
 */
export interface GestionTramite {
    idGestion?: number;

    // IDs internos — vienen en el response para pre-cargar el formulario de edición
    idSolicitante: number;
    idAreaResponsable?: number | null;

    // Campos parciales del responsable — vienen en el response para pre-cargar edición
    nombresResponsable?: string | null;
    apellidoPaternoResponsable?: string | null;
    apellidoMaternoResponsable?: string | null;

    // Campo correlativo de fila (del backend)
    numero?: number;

    // Datos del solicitante (vienen del GestionTramiteResponse)
    numeroDocumento?: string | null;
    apellidoPaterno?: string | null;   // apellido paterno del SOLICITANTE
    apellidoMaterno?: string | null;   // apellido materno del SOLICITANTE
    nombres?: string | null;           // nombres del SOLICITANTE

    // Responsable de la gestión
    responsable?: string | null;       // nombre completo del responsable (calculado por backend)
    areaResponsable?: string | null;   // nombre del área responsable

    // Datos de la gestión
    /**
     * tipoGestion: código interno derivado del texto legible del backend.
     * El backend envía texto legible ("Recepción", "Evaluación", etc.).
     * El servicio lo normaliza a código interno (RECEPCION, EVALUACION, etc.)
     * para que los selectores del formulario funcionen correctamente.
     */
    tipoGestion: string;
    /**
     * prioridad: código interno derivado del texto legible del backend.
     * El backend envía "Normal", "Urgente", "Muy urgente".
     * El servicio los normaliza a NORMAL, URGENTE, MUY_URGENTE.
     */
    prioridad?: string;
    /**
     * estado: texto legible del estado de gestión que devuelve el backend.
     * Valores posibles: "Pendiente", "En proceso", "Observado", "Aprobado", "Rechazado".
     */
    estado?: string | null;
    /**
     * estadoGestion: código interno derivado de "estado" para filtros y selector del formulario.
     * Valores posibles: PENDIENTE, EN_PROCESO, OBSERVADO, APROBADO, RECHAZADO.
     */
    estadoGestion?: string;

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
}

/**
 * Payload de entrada para crear o actualizar una gestión.
 * Coincide con GestionTramiteFormRequest.java del backend.
 */
export interface GestionTramiteRequest {
    idSolicitante: number;
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
