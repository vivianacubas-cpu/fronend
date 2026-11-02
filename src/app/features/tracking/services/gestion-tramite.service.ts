import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GestionTramite, GestionTramiteRequest } from '../interfaces/gestion-tramite.model';

export interface AreaCatalogo {
    idArea: number;
    nombre: string;
}

// Mapa texto legible → código interno para el estado de gestión
const ESTADO_TEXTO_A_CODIGO: Record<string, string> = {
    'Pendiente':  'PENDIENTE',
    'En proceso': 'EN_PROCESO',
    'Observado':  'OBSERVADO',
    'Aprobado':   'APROBADO',
    'Rechazado':  'RECHAZADO',
};

// Mapa texto legible → código interno para tipoGestion
const TIPO_TEXTO_A_CODIGO: Record<string, string> = {
    'Recepción':   'RECEPCION',
    'Evaluación':  'EVALUACION',
    'Derivación':  'DERIVACION',
    'Aprobación':  'APROBACION',
    'Rechazo':     'RECHAZO',
    'Subsanación': 'SUBSANACION',
};

// Mapa texto legible → código interno para prioridad
const PRIORIDAD_TEXTO_A_CODIGO: Record<string, string> = {
    'Normal':      'NORMAL',
    'Urgente':     'URGENTE',
    'Muy urgente': 'MUY_URGENTE',
};

@Injectable({ providedIn: 'root' })
export class GestionTramiteService {
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

    /** GET /v1/api/gestion-tramite/catalogo/areas — áreas (cacheado) */
    catalogoAreas(): Observable<AreaCatalogo[]> {
        if (!this.areas$) {
            this.areas$ = this.http
                .get<AreaCatalogo[]>(`${this.api}/catalogo/areas`)
                .pipe(shareReplay(1));
        }
        return this.areas$;
    }

    /**
     * Normaliza la respuesta del backend al modelo GestionTramite del frontend.
     *
     * El backend (GestionTramiteResponse record) envía en el JSON:
     *   - "estado"          → texto legible del estadoGestion (Pendiente, En proceso, etc.)
     *   - "tipoGestion"     → texto legible (Recepción, Evaluación, etc.)
     *   - "prioridad"       → texto legible (Normal, Urgente, Muy urgente)
     *   - "nombres"         → nombres del SOLICITANTE
     *   - "apellidoPaterno" → apellido paterno del SOLICITANTE
     *   - "apellidoMaterno" → apellido materno del SOLICITANTE
     *   - "responsable"     → nombre completo del responsable
     *   - "areaResponsable" → nombre del área
     *
     * El formulario necesita los códigos internos (PENDIENTE, EN_PROCESO, etc.)
     * para pre-cargar los selectores correctamente.
     */
    private normalize(r: any): GestionTramite {
        if (!r || typeof r !== 'object') return { idSolicitante: 0, tipoGestion: '' };

        // Estado: el JSON trae texto legible en "estado"; derivar código para filtros/formulario
        const estadoTexto: string = r['estado'] ?? '';
        const estadoGestionCodigo: string =
            ESTADO_TEXTO_A_CODIGO[estadoTexto]
            ?? estadoTexto.toUpperCase().replace(/ /g, '_')
            ?? '';

        // TipoGestion: el JSON trae texto legible; derivar código para el formulario
        const tipoGestionTexto: string = r['tipoGestion'] ?? '';
        const tipoGestionCodigo: string =
            TIPO_TEXTO_A_CODIGO[tipoGestionTexto]
            ?? tipoGestionTexto.toUpperCase()
            ?? '';

        // Prioridad: el JSON trae texto legible; derivar código para el formulario
        const prioridadTexto: string = r['prioridad'] ?? '';
        const prioridadCodigo: string =
            PRIORIDAD_TEXTO_A_CODIGO[prioridadTexto]
            ?? prioridadTexto.toUpperCase().replace(/ /g, '_')
            ?? 'NORMAL';

        return {
            idGestion:                  r['idGestion']         ?? undefined,
            numero:                     r['numero']            ?? undefined,
            idSolicitante:              r['idSolicitante']     ?? 0,

            // Datos del SOLICITANTE — vienen directamente en el JSON de respuesta
            numeroDocumento:            r['numeroDocumento']   ?? null,
            apellidoPaterno:            r['apellidoPaterno']   ?? null,
            apellidoMaterno:            r['apellidoMaterno']   ?? null,
            nombres:                    r['nombres']           ?? null,

            // Responsable
            responsable:                r['responsable']       ?? null,
            areaResponsable:            r['areaResponsable']   ?? null,

            // Campos de gestión — códigos internos (para formulario y filtros)
            tipoGestion:                tipoGestionCodigo,
            prioridad:                  prioridadCodigo,
            estadoGestion:              estadoGestionCodigo,

            // Texto legible para mostrar en tabla
            estado:                     estadoTexto,

            fechaRecepcion:             r['fechaRecepcion']    ?? undefined,
            fechaLimite:                r['fechaLimite']       ?? null,
            fechaResolucion:            r['fechaResolucion']   ?? null,
            decision:                   r['decision']          ?? null,
            fundamentoDecision:         r['fundamentoDecision'] ?? null,
            observaciones:              r['observaciones']     ?? null,

            // Auditoría
            fechaRegistro:              r['fechaRegistro']     ?? undefined,
            fechaActualizacion:         r['fechaActualizacion'] ?? null,
            fechaEliminacion:           r['fechaEliminacion']  ?? null,
            fechaRestauracion:          r['fechaRestauracion'] ?? null,

            // Campos parciales del responsable para el formulario
            // Si el backend no los envía en el listado, se derivan del campo "responsable"
            nombresResponsable:         r['nombresResponsable']
                                        ?? this.extraerNombresDeResponsable(r['responsable']),
            apellidoPaternoResponsable: r['apellidoPaternoResponsable']
                                        ?? this.extraerApellidoPaternoDeResponsable(r['responsable']),
            apellidoMaternoResponsable: r['apellidoMaternoResponsable']
                                        ?? this.extraerApellidoMaternoDeResponsable(r['responsable']),
            idAreaResponsable:          r['idAreaResponsable'] ?? null,
        };
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
