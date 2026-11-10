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
                        id:     Number(o['id'] ?? o['idTipoDocumento'] ?? 0),
                        // El backend devuelve "code" (nuevo) o "codigo" (legacy)
                        codigo: String(o['code'] ?? o['codigo'] ?? ''),
                        // El backend devuelve "name" (nuevo) o "nombre" (legacy)
                        nombre: String(o['name'] ?? o['nombre'] ?? ''),
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
                    // El backend devuelve "department/province/district/status" (nuevo)
                    // o "departamento/provincia/distrito/estado" (legacy)
                    const estadoRaw = o['status'] ?? o['estado'];
                    return {
                        id:           Number(o['id'] ?? o['idUbigeo'] ?? 0),
                        departamento: String(o['department'] ?? o['departamento'] ?? ''),
                        provincia:    String(o['province']   ?? o['provincia']    ?? ''),
                        distrito:     String(o['district']   ?? o['distrito']     ?? ''),
                        estado:       estadoRaw === true || estadoRaw === 1 || estadoRaw === '1'
                                      || estadoRaw === 'true' || estadoRaw === 'ACTIVO',
                    };
                })),
                shareReplay(1),
            );
        }
        return this.ubigeos$;
    }

    /**
     * Normaliza la respuesta del backend a la interfaz Solicitante.
     *
     * El backend (SolicitanteResponse record) usa nombres de campo en INGLÉS:
     *   applicantId      → idSolicitante
     *   documentType     → tipoDocumento
     *   documentNumber   → numeroDocumento
     *   paternalLastName → apellidoPaterno
     *   maternalLastName → apellidoMaterno
     *   firstNames       → nombres
     *   district         → distrito
     *   province         → provincia
     *   department       → departamento
     *   address          → direccion
     *   phoneNumber      → telefono
     *   email            → correo
     *   status           → estado  ("Activo"/"Inactivo" → "A"/"I")
     *   createdAt        → fechaRegistro
     *   updatedAt        → fechaActualizacion
     *   deletedAt        → fechaEliminacion
     *   restoredAt       → fechaRestauracion
     *
     * Se mantiene fallback a los nombres en español para compatibilidad con
     * el alias legacy (/v1/api/solicitante) si en algún momento devuelve
     * el formato anterior.
     */
    private normalize(r: unknown): Solicitante {
        const o = (r ?? {}) as Record<string, unknown>;

        // ── IDs ─────────────────────────────────────────────────────────────
        const idSolicitante =
            this.optionalNumber(o['applicantId'] ?? o['idSolicitante'] ?? o['id_solicitante'] ?? o['id']) ?? 0;

        const idTipoDocumento =
            this.optionalNumber(o['documentTypeId'] ?? o['idTipoDocumento'] ?? o['id_tipo_documento']) ?? 0;

        const idUbigeo =
            this.optionalNumber(o['ubigeoId'] ?? o['idUbigeo'] ?? o['id_ubigeo']) ?? 0;

        // ── Tipo de documento ───────────────────────────────────────────────
        const tipoDocumento =
            o['documentType'] != null ? String(o['documentType'])
            : o['tipoDocumento'] != null ? String(o['tipoDocumento'])
            : undefined;

        // ── Ubicación (texto compuesto) ──────────────────────────────────────
        const ubicacion =
            o['location'] != null ? String(o['location'])
            : o['ubicacion'] != null ? String(o['ubicacion'])
            : undefined;

        // ── Componentes de ubigeo ───────────────────────────────────────────
        const departamento =
            o['department'] != null ? String(o['department'])
            : o['departamento'] != null ? String(o['departamento'])
            : undefined;

        const provincia =
            o['province'] != null ? String(o['province'])
            : o['provincia'] != null ? String(o['provincia'])
            : undefined;

        const distrito =
            o['district'] != null ? String(o['district'])
            : o['distrito'] != null ? String(o['distrito'])
            : undefined;

        // ── Datos personales ────────────────────────────────────────────────
        const numeroDocumento = String(
            o['documentNumber'] ?? o['numeroDocumento'] ?? o['numero_documento'] ?? ''
        );

        const nombres = String(
            o['firstNames'] ?? o['nombres'] ?? ''
        );

        const apellidoPaterno = String(
            o['paternalLastName'] ?? o['apellidoPaterno'] ?? o['apellido_paterno'] ?? ''
        );

        const apellidoMaterno = String(
            o['maternalLastName'] ?? o['apellidoMaterno'] ?? o['apellido_materno'] ?? ''
        );

        const telefono =
            o['phoneNumber'] != null ? String(o['phoneNumber'])
            : o['telefono'] != null ? String(o['telefono'])
            : undefined;

        const correo =
            o['email'] != null ? String(o['email'])
            : o['correo'] != null ? String(o['correo'])
            : undefined;

        const direccion =
            o['address'] != null ? String(o['address'])
            : o['direccion'] != null ? String(o['direccion'])
            : undefined;

        // ── Estado ──────────────────────────────────────────────────────────
        // El backend devuelve "Activo"/"Inactivo" en el campo "status"
        const estadoRaw = String(o['status'] ?? o['estado'] ?? 'A');
        const estado =
            estadoRaw.toUpperCase() === 'ACTIVO'   || estadoRaw === 'A' ? 'A'
            : estadoRaw.toUpperCase() === 'INACTIVO' || estadoRaw === 'I' ? 'I'
            : estadoRaw;

        // ── Fechas de auditoría ─────────────────────────────────────────────
        const fechaRegistro =
            o['createdAt'] != null ? String(o['createdAt'])
            : o['fechaRegistro'] != null ? String(o['fechaRegistro'])
            : o['fecha_registro'] != null ? String(o['fecha_registro'])
            : undefined;

        const fechaActualizacion =
            o['updatedAt'] != null ? String(o['updatedAt'])
            : o['fechaActualizacion'] != null ? String(o['fechaActualizacion'])
            : o['fecha_actualizacion'] != null ? String(o['fecha_actualizacion'])
            : undefined;

        const fechaEliminacion =
            o['deletedAt'] != null ? String(o['deletedAt'])
            : o['fechaEliminacion'] != null ? String(o['fechaEliminacion'])
            : o['fecha_eliminacion'] != null ? String(o['fecha_eliminacion'])
            : undefined;

        const fechaRestauracion =
            o['restoredAt'] != null ? String(o['restoredAt'])
            : o['fechaRestauracion'] != null ? String(o['fechaRestauracion'])
            : o['fecha_restauracion'] != null ? String(o['fecha_restauracion'])
            : undefined;

        return {
            idSolicitante,
            idTipoDocumento,
            idUbigeo,
            tipoDocumento,
            ubicacion,
            departamento,
            provincia,
            distrito,
            numeroDocumento,
            nombres,
            apellidoPaterno,
            apellidoMaterno,
            telefono,
            correo,
            direccion,
            estado,
            fechaRegistro,
            fechaActualizacion,
            fechaEliminacion,
            fechaRestauracion,
        };
    }

    private optionalNumber(value: unknown): number | undefined {
        if (value == null || value === '') return undefined;
        const number = Number(value);
        return Number.isFinite(number) && number > 0 ? number : undefined;
    }
}
