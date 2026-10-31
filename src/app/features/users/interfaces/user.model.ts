export interface Usuario {
    idUsuario?: number;
    idRol: number;
    idArea: number;
    idUbigeo: number;
    nombreUsuario: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correo: string;
    password?: string;
    estado?: boolean;
    fechaRegistro?: string;
    fechaCreacion?: string;
    fechaActualizacion?: string;
    fechaEliminacion?: string;
    fechaRestauracion?: string;
}
