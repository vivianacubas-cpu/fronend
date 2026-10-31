import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    Solicitante,
    SolicitanteEntrada,
    SolicitanteEstado,
    TipoDocumento,
    Ubigeo,
} from '../../../shared/interfaces/solicitante.model';

/**
 * Servicio del Maestro Solicitante.
 * Base URL: ${environment.apiUrl}/solicitante  (http://localhost:8085/v1/api/solicitante).
 * Endpoints reales del backend (SolicitanteRest):
 *   GET    /                     -> findAll
 *   GET    /estado/{A|I|T}        -> findByEstado
 *   GET    /{id}                 -> findById
 *   GET    /documento/{numero}  -> findByNumeroDocumento  (activo o inactivo)
 *   GET    /tipos-documento      -> catálogo de tipos de documento
 *   GET    /ubigeos              -> catálogo de ubigeos
 *   POST   /save                 -> save
 *   PUT    /update/{id}          -> update
 *   PATCH  /delete/{id}          -> eliminación lógica (estado -> I)
 *   PATCH  /restore/{id}         -> restaurar (estado -> A)
 */
@Injectable({ providedIn: 'root' })
export class SolicitanteService {
    private readonly api = `${environment.apiUrl}/solicitante`;
    private tiposDocumento$?: Observable<TipoDocumento[]>;
    private ubigeos$?: Observable<Ubigeo[]>;

    constructor(private readonly http: HttpClient) {}

    /** GET /v1/api/solicitante — todos (activos e inactivos). */
    findAll(): Observable<Solicitante[]> {
        return this.http.get<unknown[]>(this.api).pipe(map(rows => (Array.isArray(rows) ? rows : []).map(r => this.normalize(r))));
    }

    /** GET /v1/api/solicitante/estado/{estado}; conservado para otros módulos. */
    findByEstado(estado: SolicitanteEstado | 'T'): Observable<Solicitante[]> {
        return this.http.get<unknown[]>(`${this.api}/estado/${estado}`).pipe(
            map(rows => (Array.isArray(rows) ? rows : []).map(r => this.normalize(r))),
        );
    }

    /** GET /v1/api/solicitante/{id} — detalle (404 si no existe). */
    findById(id: number): Observable<Solicitante> {
        return this.http.get<unknown>(`${this.api}/${id}`).pipe(map(r => this.normalize(r)));
    }

    /** GET /v1/api/solicitante/documento/{numero} — búsqueda por documento (200 o 404). */
    findByNumeroDocumento(numero: string): Observable<Solicitante> {
        const value = (numero || '').trim();
        return this.http.get<unknown>(`${this.api}/documento/${encodeURIComponent(value)}`).pipe(map(r => this.normalize(r)));
    }

    /** POST /v1/api/solicitante/save — registrar. 409 si el documento ya existe. */
    save(entrada: SolicitanteEntrada): Observable<Solicitante> {
        return this.http.post<unknown>(`${this.api}/save`, entrada).pipe(map(r => this.normalize(r)));
    }

    /** PUT /v1/api/solicitante/update/{id} — actualizar. No permite editar inactivos. */
    update(id: number, entrada: SolicitanteEntrada): Observable<Solicitante> {
        return this.http.put<unknown>(`${this.api}/update/${id}`, entrada).pipe(map(r => this.normalize(r)));
    }

    /** PATCH /v1/api/solicitante/delete/{id} — eliminación lógica (estado -> I). */
    delete(id: number): Observable<Solicitante> {
        return this.http.patch<unknown>(`${this.api}/delete/${id}`, {}).pipe(map(r => this.normalize(r)));
    }

    /** PATCH /v1/api/solicitante/restore/{id} — restaurar (estado -> A). */
    restore(id: number): Observable<Solicitante> {
        return this.http.patch<unknown>(`${this.api}/restore/${id}`, {}).pipe(map(r => this.normalize(r)));
    }

    /** GET /v1/api/solicitante/tipos-documento — catálogo (cacheado). */
    tiposDocumento(): Observable<TipoDocumento[]> {
        if (!this.tiposDocumento$) {
            this.tiposDocumento$ = this.http.get<unknown[]>(`${this.api}/tipos-documento`).pipe(
                map(rows => (Array.isArray(rows) ? rows : []).map(r => {
                    const o = (r ?? {}) as Record<string, unknown>;
                    return {
                        id: Number(o['id'] ?? o['idTipoDocumento'] ?? 0),
                        codigo: String(o['codigo'] ?? ''),
                        nombre: String(o['nombre'] ?? ''),
                    };
                })),
                shareReplay(1),
            );
        }
        return this.tiposDocumento$;
    }

    /** GET /v1/api/solicitante/ubigeos — catálogo (cacheado). */
    ubigeos(): Observable<Ubigeo[]> {
        if (!this.ubigeos$) {
            this.ubigeos$ = this.http.get<unknown[]>(`${this.api}/ubigeos`).pipe(
                map(rows => (Array.isArray(rows) ? rows : []).map(r => {
                    const o = (r ?? {}) as Record<string, unknown>;
                    return {
                        id: Number(o['id'] ?? o['idUbigeo'] ?? 0),
                        departamento: String(o['departamento'] ?? ''),
                        provincia: String(o['provincia'] ?? ''),
                        distrito: String(o['distrito'] ?? ''),
                        estado: o['estado'] === true || o['estado'] === 1 || o['estado'] === '1',
                    };
                })),
                shareReplay(1),
            );
        }
        return this.ubigeos$;
    }

    /** Normaliza la respuesta del backend a la interfaz Solicitante (tolera camelCase y snake_case). */
    private normalize(r: unknown): Solicitante {
        const o = (r ?? {}) as Record<string, unknown>;
        const estado = String(o['estado'] ?? 'A');
        return {
            idSolicitante: this.optionalNumber(o['idSolicitante'] ?? o['id_solicitante'] ?? o['id']) ?? 0,
            idTipoDocumento: this.optionalNumber(o['idTipoDocumento'] ?? o['id_tipo_documento']) ?? 0,
            idUbigeo: this.optionalNumber(o['idUbigeo'] ?? o['id_ubigeo']) ?? 0,
            tipoDocumento: o['tipoDocumento'] != null ? String(o['tipoDocumento']) : undefined,
            ubicacion: o['ubicacion'] != null ? String(o['ubicacion']) : undefined,
            departamento: o?.['departamento'] != null ? String(o['departamento']) : undefined,
            provincia:    o?.['provincia']    != null ? String(o['provincia'])    : undefined,
            distrito:     o?.['distrito']     != null ? String(o['distrito'])     : undefined,
            numeroDocumento: String(o?.['numeroDocumento'] ?? o?.['numero_documento'] ?? ''),
            nombres: String(o?.['nombres'] ?? ''),
            apellidoPaterno: String(o?.['apellidoPaterno'] ?? o?.['apellido_paterno'] ?? ''),
            apellidoMaterno: String(o?.['apellidoMaterno'] ?? o?.['apellido_materno'] ?? ''),
            telefono: o?.['telefono'] != null ? String(o['telefono']) : undefined,
            correo: o?.['correo'] != null ? String(o['correo']) : undefined,
            direccion: o?.['direccion'] != null ? String(o['direccion']) : undefined,
            estado: estado.toUpperCase() === 'ACTIVO' ? 'A'
                : estado.toUpperCase() === 'INACTIVO' ? 'I'
                    : estado,
            fechaRegistro: o['fechaRegistro'] != null ? String(o['fechaRegistro']) : (o['fecha_registro'] != null ? String(o['fecha_registro']) : undefined),
            fechaActualizacion: o['fechaActualizacion'] != null ? String(o['fechaActualizacion']) : (o['fecha_actualizacion'] != null ? String(o['fecha_actualizacion']) : undefined),
            fechaEliminacion: o['fechaEliminacion'] != null ? String(o['fechaEliminacion']) : (o['fecha_eliminacion'] != null ? String(o['fecha_eliminacion']) : undefined),
            fechaRestauracion: o['fechaRestauracion'] != null ? String(o['fechaRestauracion']) : (o['fecha_restauracion'] != null ? String(o['fecha_restauracion']) : undefined),
        };
    }

    private optionalNumber(value: unknown): number | undefined {
        if (value == null || value === '') return undefined;
        const number = Number(value);
        return Number.isFinite(number) && number > 0 ? number : undefined;
    }
}
