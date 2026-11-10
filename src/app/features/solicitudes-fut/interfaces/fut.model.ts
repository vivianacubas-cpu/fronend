export interface FutPayload {
    solicitante: string;
    fullName: string;
    dni: string;
    tipoDocumento?: string;
    tipoSolicitante?: string;
    department?: string;
    email?: string;
    cellphone: string;
    address: string;
    district: string;
    province: string;
    basis: string;
    attachedDocuments?: string;
    declaredDate: string;
    signatureNote?: string;
    tipoTramite?: string;
    numeroDepto?: string;
    telefonoFijo?: string;
    folios?: number;
    archivoNombre?: string;
    archivoTipo?: string;
    archivoTamano?: number;
    idempotencyKey?: string;
    [key: string]: unknown;
}

export interface FutRecord extends FutPayload {
    id: number;
    trackingCode: string;
    status: string;
    observation: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    tipoTramite?: string;
    tipoSolicitante?: string;
    tipoDocumento?: string;
    department?: string;
    folios?: number;
    archivoNombre?: string;
    celular?: string;
    history: Array<{
        oldStatus: string;
        newStatus: string;
        observation: string;
        changedAt: string;
    }>;
}
