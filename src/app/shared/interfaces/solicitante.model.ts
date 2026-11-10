/** Tipo de documento (catálogo dbo.tipo_documento). */
export interface TipoDocumento {
    id: number;
    codigo: string;
    nombre: string;
}

/** Ubigeo (catálogo dbo.ubigeo). */
export interface Ubigeo {
    id: number;
    departamento: string;
    provincia: string;
    distrito: string;
    estado: boolean;
}

/**
 * Entidad Solicitante (tabla maestra dbo.solicitante).
 * Campos reales del backend (pe.edu.vallegrande.app.model.Solicitante).
 */
export interface Solicitante {
    idSolicitante: number;
    idTipoDocumento: number;
    idUbigeo: number;
    tipoDocumento?: string;
    ubicacion?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
    numeroDocumento: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    /** 'A'/'Activo' = activo, 'I'/'Inactivo' = inactivo. */
    estado: string;
    fechaRegistro?: string;
    fechaActualizacion?: string;
    fechaEliminacion?: string;
    fechaRestauracion?: string;
}

/** Datos editables del formulario; el identificador y la auditoría no se ingresan manualmente. */
export type SolicitanteEntrada = Pick<
    Solicitante,
    | 'idTipoDocumento'
    | 'idUbigeo'
    | 'departamento'
    | 'provincia'
    | 'distrito'
    | 'numeroDocumento'
    | 'nombres'
    | 'apellidoPaterno'
    | 'apellidoMaterno'
    | 'telefono'
    | 'correo'
    | 'direccion'
>;

/** Estado lógico legible para la UI. */
export type SolicitanteEstado = 'A' | 'I';
