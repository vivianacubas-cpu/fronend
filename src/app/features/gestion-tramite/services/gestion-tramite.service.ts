import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GestionTramite, GestionTramiteRequest } from '../interfaces/gestion-tramite.model';

export interface AreaCatalogo {
    idArea: number;
    nombre: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapas: texto legible del backend → código interno usado en el frontend
// El backend envía texto en español para campos legibles (tipoGestion, prioridad)
// y códigos internos para managementStatus (estadoGestion).
// ─────────────────────────────────────────────────────────────────────────────

const ESTADO_TEXTO_A_CODIGO: Record<string, string> = {
    'Pendiente':  'PENDIENTE',
    'En proceso': 'EN_PROCESO',
    'Observado':  'OBSERVADO',
    'Aprobado':   'APROBADO',
    'Rechazado':  'RECHAZADO',
    // por si el backend ya devuelve el código directamente
    'PENDIENTE':  'PENDIENTE',
    'EN_PROCESO': 'EN_PROCESO',
    'OBSERVADO':  'OBSERVADO',
    'APROBADO':   'APROBADO',
    'RECHAZADO':  'RECHAZADO',
};

const TIPO_TEXTO_A_CODIGO: Record<string, string> = {
    'Recepción':   'RECEPCION',
    'Recepcion':   'RECEPCION',
    'Evaluación':  'EVALUACION',
    'Evaluacion':  'EVALUACION',
    'Derivación':  'DERIVACION',
    'Derivacion':  'DERIVACION',
    'Aprobación':  'APROBACION',
    'Aprobacion':  'APROBACION',
    'Rechazo':     'RECHAZO',
    'Subsanación': 'SUBSANACION',
    'Subsanacion': 'SUBSANACION',
    // inglés (swagger)
    'Reception':   'RECEPCION',
    'Evaluation':  'EVALUACION',
    'Derivation':  'DERIVACION',
    'Approval':    'APROBACION',
    'Rejection':   'RECHAZO',
    'Correction':  'SUBSANACION',
    // ya viene como código
    'RECEPCION':   'RECEPCION',
    'EVALUACION':  'EVALUACION',
    'DERIVACION':  'DERIVACION',
    'APROBACION':  'APROBACION',
    'RECHAZO':     'RECHAZO',
    'SUBSANACION': 'SUBSANACION',
};

const PRIORIDAD_TEXTO_A_CODIGO: Record<string, string> = {
    'Normal':      'NORMAL',
    'Urgente':     'URGENTE',
    'Urgent':      'URGENTE',
    'Muy urgente': 'MUY_URGENTE',
    'Very Urgent': 'MUY_URGENTE',
    'NORMAL':      'NORMAL',
    'URGENTE':     'URGENTE',
    'MUY_URGENTE': 'MUY_URGENTE',
};

@Injectable({ providedIn: 'root' })
export class GestionTramiteService {
    // El frontend sigue usando el alias legacy que el backend mantiene por compatibilidad.
    private readonly api = `${environment.apiUrl}/gestion-tramite`;
    private areas$?: Observable<AreaCatalogo[]>;

    constructor(private readonly http: HttpClient) {}

    crear(req: GestionTramiteRequest): Observable<GestionTramite> {
        return this.http.post<any>(this.api, req).pipe(map(r => this.normalize(r)));
    }

    listar(estadoGestion?: string): Observable<GestionTramite[]> {
        const params = estadoGestion ? `?estadoGestion=${estadoGestion}` : '';
        return this.http.get<any[]>(`${this.api}${params}`).pipe(
            map(rows => (Array.isArray(rows) ? rows : []).map(r => this.normalize(r)))
        );
    }

    obtener(id: number): Observable<GestionTramite> {
        return this.http.get<any>(`${this.api}/${id}`).pipe(map(r => this.normalize(r)));
    }

    porSolicitante(idSolicitante: number): Observable<GestionTramite[]> {
        return this.http.get<any[]>(`${this.api}/solicitante/${idSolicitante}`).pipe(
            map(rows => (Array.isArray(rows) ? rows : []).map(r => this.normalize(r)))
        );
    }

    actualizar(id: number, req: GestionTramiteRequest): Observable<GestionTramite> {
        return this.http.put<any>(`${this.api}/update/${id}`, req).pipe(map(r => this.normalize(r)));
    }

    eliminar(id: number): Observable<GestionTramite> {
        return this.http.patch<any>(`${this.api}/delete/${id}`, {}).pipe(map(r => this.normalize(r)));
    }

    restaurar(id: number): Observable<GestionTramite> {
        return this.http.patch<any>(`${this.api}/restore/${id}`, {}).pipe(map(r => this.normalize(r)));
    }

    eliminados(): Observable<GestionTramite[]> {
        return this.http.get<any[]>(`${this.api}/eliminados`).pipe(
            map(rows => (Array.isArray(rows) ? rows : []).map(r => this.normalize(r)))
        );
    }

    /**
     * GET /v1/api/gestion-tramite/catalogo/areas — áreas (cacheado en memoria por sesión).
     *
     * El backend (GestionTramiteFutRest) devuelve { areaId, name }.
     * Normalizamos a { idArea, nombre } para que el template siga funcionando sin cambios.
     */
    catalogoAreas(): Observable<AreaCatalogo[]> {
        if (!this.areas$) {
            this.areas$ = this.http
                .get<any[]>(`${this.api}/catalogo/areas`)
                .pipe(
                    map(rows =>
                        (Array.isArray(rows) ? rows : []).map(r => ({
                            // El backend envía "areaId" (nuevo) o "idArea" (legacy alias)
                            idArea: Number(r['areaId'] ?? r['idArea'] ?? 0),
                            // El backend envía "name" (nuevo) o "nombre" (legacy alias)
                            nombre: String(r['name'] ?? r['nombre'] ?? ''),
                        }))
                    ),
                    shareReplay(1)
                );
        }
        return this.areas$;
    }

    /**
     * Normaliza la respuesta del backend al modelo GestionTramite del frontend.
     *
     * El backend (GestionTramiteResponse record) usa nombres en INGLÉS:
     *   managementId        → idGestion
     *   applicantId         → idSolicitante
     *   documentNumber      → numeroDocumento
     *   paternalLastName    → apellidoPaterno   (del solicitante)
     *   maternalLastName    → apellidoMaterno   (del solicitante)
     *   firstNames          → nombres           (del solicitante)
     *   responsible         → responsable
     *   responsibleAreaId   → idAreaResponsable
     *   responsibleArea     → areaResponsable
     *   managementType      → tipoGestion (texto → código)
     *   priority            → prioridad (texto → código)
     *   managementStatus    → estadoGestion (código)
     *   receptionDate       → fechaRecepcion
     *   deadlineDate        → fechaLimite
     *   resolutionDate      → fechaResolucion
     *   decisionBasis       → fundamentoDecision
     *   observations        → observaciones
     *   createdAt           → fechaRegistro
     *   updatedAt           → fechaActualizacion
     *   deletedAt           → fechaEliminacion
     *   restoredAt          → fechaRestauracion
     *
     * El LegacyGestionTramiteAlias redirige /v1/api/gestion-tramite al mismo servicio,
     * por lo que la respuesta tiene los mismos nombres en inglés.
     */
    private normalize(r: any): GestionTramite {
        if (!r || typeof r !== 'object') return { idSolicitante: 0, tipoGestion: '' };

        // ── IDs ───────────────────────────────────────────────────────────────
        const idGestion: number | undefined =
            r['managementId'] ?? r['idGestion'] ?? undefined;

        const idSolicitante: number =
            Number(r['applicantId'] ?? r['idSolicitante'] ?? 0);

        const idAreaResponsable: number | null =
            r['responsibleAreaId'] != null ? Number(r['responsibleAreaId'])
            : r['idAreaResponsable'] != null ? Number(r['idAreaResponsable'])
            : null;

        // ── Datos del solicitante ─────────────────────────────────────────────
        const numeroDocumento: string | null =
            r['documentNumber'] ?? r['numeroDocumento'] ?? null;

        const apellidoPaterno: string | null =
            r['paternalLastName'] ?? r['apellidoPaterno'] ?? null;

        const apellidoMaterno: string | null =
            r['maternalLastName'] ?? r['apellidoMaterno'] ?? null;

        const nombres: string | null =
            r['firstNames'] ?? r['nombres'] ?? null;

        // ── Responsable ───────────────────────────────────────────────────────
        const responsable: string | null =
            r['responsible'] ?? r['responsable'] ?? null;

        const areaResponsable: string | null =
            r['responsibleArea'] ?? r['areaResponsable'] ?? null;

        // Campos parciales del responsable para pre-cargar el formulario de edición.
        // El backend ahora devuelve responsibleFirstNames/responsiblePaternalLastName/responsibleMaternalLastName.
        // También se aceptan los nombres en español (nombresResponsable, etc.) por compatibilidad legacy.
        const nombresResponsable: string | null =
            r['responsibleFirstNames']
            ?? r['nombresResponsable']
            ?? this.extraerNombresDeResponsable(responsable);

        const apellidoPaternoResponsable: string | null =
            r['responsiblePaternalLastName']
            ?? r['apellidoPaternoResponsable']
            ?? this.extraerApellidoPaternoDeResponsable(responsable);

        const apellidoMaternoResponsable: string | null =
            r['responsibleMaternalLastName']
            ?? r['apellidoMaternoResponsable']
            ?? this.extraerApellidoMaternoDeResponsable(responsable);

        // ── Tipo, prioridad, estado ───────────────────────────────────────────
        const tipoGestionRaw: string = r['managementType'] ?? r['tipoGestion'] ?? '';
        const tipoGestionCodigo: string =
            TIPO_TEXTO_A_CODIGO[tipoGestionRaw]
            ?? tipoGestionRaw.toUpperCase().replace(/ /g, '_')
            ?? tipoGestionRaw;

        const prioridadRaw: string = r['priority'] ?? r['prioridad'] ?? '';
        const prioridadCodigo: string =
            PRIORIDAD_TEXTO_A_CODIGO[prioridadRaw]
            ?? prioridadRaw.toUpperCase().replace(/ /g, '_')
            ?? 'NORMAL';

        // managementStatus ya viene como código (PENDIENTE, EN_PROCESO, etc.)
        const estadoGestionRaw: string = r['managementStatus'] ?? r['estadoGestion'] ?? '';
        const estadoGestionCodigo: string =
            ESTADO_TEXTO_A_CODIGO[estadoGestionRaw]
            ?? estadoGestionRaw.toUpperCase().replace(/ /g, '_')
            ?? '';

        // Texto legible del estado para mostrar en la tabla
        const estadoTextoLegible: string | null = r['estado'] ?? null;

        // ── Fechas ────────────────────────────────────────────────────────────
        const fechaRecepcion: string | undefined =
            r['receptionDate'] ?? r['fechaRecepcion'] ?? undefined;

        const fechaLimite: string | null =
            r['deadlineDate'] ?? r['fechaLimite'] ?? null;

        const fechaResolucion: string | null =
            r['resolutionDate'] ?? r['fechaResolucion'] ?? null;

        const fechaRegistro: string | undefined =
            r['createdAt'] ?? r['fechaRegistro'] ?? undefined;

        const fechaActualizacion: string | null =
            r['updatedAt'] ?? r['fechaActualizacion'] ?? null;

        const fechaEliminacion: string | null =
            r['deletedAt'] ?? r['fechaEliminacion'] ?? null;

        const fechaRestauracion: string | null =
            r['restoredAt'] ?? r['fechaRestauracion'] ?? null;

        // ── Otros campos ──────────────────────────────────────────────────────
        const decision: string | null =
            r['decision'] ?? null;

        const fundamentoDecision: string | null =
            r['decisionBasis'] ?? r['fundamentoDecision'] ?? null;

        const observaciones: string | null =
            r['observations'] ?? r['observaciones'] ?? null;

        return {
            idGestion,
            idSolicitante,
            idAreaResponsable,
            nombresResponsable,
            apellidoPaternoResponsable,
            apellidoMaternoResponsable,
            numero:              r['numero'] ?? undefined,
            numeroDocumento,
            apellidoPaterno,
            apellidoMaterno,
            nombres,
            responsable,
            areaResponsable,
            tipoGestion:         tipoGestionCodigo,
            prioridad:           prioridadCodigo,
            estadoGestion:       estadoGestionCodigo,
            estado:              estadoTextoLegible ?? this.codigoATextoEstado(estadoGestionCodigo),
            fechaRecepcion,
            fechaLimite,
            fechaResolucion,
            decision,
            fundamentoDecision,
            observaciones,
            fechaRegistro,
            fechaActualizacion,
            fechaEliminacion,
            fechaRestauracion,
        };
    }

    /** Convierte el código de estado al texto legible en español para mostrar en tabla. */
    private codigoATextoEstado(codigo: string): string {
        const mapa: Record<string, string> = {
            'PENDIENTE':  'Pendiente',
            'EN_PROCESO': 'En proceso',
            'OBSERVADO':  'Observado',
            'APROBADO':   'Aprobado',
            'RECHAZADO':  'Rechazado',
        };
        return mapa[codigo] ?? codigo;
    }

    /** Extrae los nombres (todo excepto las últimas 2 palabras) del nombre completo del responsable. */
    private extraerNombresDeResponsable(responsable?: string | null): string | null {
        if (!responsable) return null;
        const partes = responsable.trim().split(/\s+/);
        if (partes.length <= 2) return partes[0] ?? null;
        return partes.slice(0, partes.length - 2).join(' ');
    }

    /** Extrae el apellido paterno (penúltima palabra) del nombre completo del responsable. */
    private extraerApellidoPaternoDeResponsable(responsable?: string | null): string | null {
        if (!responsable) return null;
        const partes = responsable.trim().split(/\s+/);
        if (partes.length < 2) return null;
        return partes[partes.length - 2];
    }

    /** Extrae el apellido materno (última palabra) del nombre completo del responsable. */
    private extraerApellidoMaternoDeResponsable(responsable?: string | null): string | null {
        if (!responsable) return null;
        const partes = responsable.trim().split(/\s+/);
        if (partes.length < 2) return null;
        return partes[partes.length - 1];
    }
}
