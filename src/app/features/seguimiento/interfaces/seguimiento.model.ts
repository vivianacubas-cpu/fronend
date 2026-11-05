export interface SeguimientoTramite {
    idSeguimiento: number;
    idSolicitud: number;
    estadoAnterior?: string;
    estadoNuevo: string;
    observacion?: string;
    fechaCambio?: string;
    estado: string;            // 'A' | 'I'
    fechaActualizacion?: string;
    fechaEliminacion?: string;
    fechaRestauracion?: string;
}
