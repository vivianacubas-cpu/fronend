
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { FutPayload, FutRecord } from '../interfaces/fut.model';

export type { FutPayload, FutRecord } from '../interfaces/fut.model';

type ApiResponse = Record<string, unknown>;

@Injectable({
  providedIn: 'root',
})
export class FutService {
  private readonly api = `${environment.apiUrl}/solicitud`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Registra una nueva solicitud FUT.
   * POST /v1/api/solicitud
   */
  create(payload: FutPayload): Observable<FutRecord> {
    return this.http
      .post<unknown>(this.api, payload)
      .pipe(map((response) => this.normalize(response)));
  }

  /**
   * Consulta una solicitud mediante su código de seguimiento.
   * GET /v1/api/solicitud/seguimiento/{codigo}
   */
  track(code: string): Observable<FutRecord> {
    const trackingCode = encodeURIComponent(
      code.trim().toUpperCase()
    );

    return this.http
      .get<unknown>(`${this.api}/seguimiento/${trackingCode}`)
      .pipe(map((response) => this.normalize(response)));
  }

  /**
   * Obtiene las solicitudes activas, opcionalmente filtradas por estado.
   * GET /v1/api/solicitud?estado=X
   */
  list(status = ''): Observable<FutRecord[]> {
    let params = new HttpParams();
    const normalizedStatus = status.trim();

    if (normalizedStatus) {
      params = params.set('estado', normalizedStatus);
    }

    return this.http
      .get<unknown[]>(this.api, { params })
      .pipe(
        map((rows) =>
          Array.isArray(rows)
            ? rows.map((row) => this.normalize(row))
            : []
        )
      );
  }

  /**
   * Consulta el detalle completo de una solicitud.
   * GET /v1/api/solicitud/{id}
   */
  detail(id: number): Observable<FutRecord> {
    return this.http
      .get<unknown>(`${this.api}/${id}`)
      .pipe(map((response) => this.normalize(response)));
  }

  /**
   * Actualiza los datos de una solicitud existente.
   * PUT /v1/api/solicitud/{id}
   */
  updateRequest(
    id: number,
    payload: FutPayload
  ): Observable<FutRecord> {
    return this.http
      .put<unknown>(`${this.api}/${id}`, payload)
      .pipe(map((response) => this.normalize(response)));
  }

  /**
   * Actualiza el estado y la observación de una solicitud.
   * PATCH /v1/api/solicitud/{id}/estado
   */
  update(
    id: number,
    status: string,
    observation: string
  ): Observable<FutRecord> {
    return this.http
      .patch<unknown>(`${this.api}/${id}/estado`, {
        estado: status,
        observacion: observation,
      })
      .pipe(map((response) => this.normalize(response)));
  }

  /**
   * Elimina lógicamente una solicitud.
   * DELETE /v1/api/solicitud/{id}
   */
  deleteRequest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  /**
   * Restaura una solicitud eliminada.
   * PATCH /v1/api/solicitud/{id}/restaurar
   */
  restoreRequest(id: number): Observable<FutRecord> {
    return this.http
      .patch<unknown>(`${this.api}/${id}/restaurar`, {})
      .pipe(map((response) => this.normalize(response)));
  }

  /**
   * Obtiene las solicitudes eliminadas.
   * GET /v1/api/solicitud/eliminadas
   */
  deleted(): Observable<FutRecord[]> {
    return this.http
      .get<unknown[]>(`${this.api}/eliminadas`)
      .pipe(
        map((rows) =>
          Array.isArray(rows)
            ? rows.map((row) => this.normalize(row))
            : []
        )
      );
  }

  /**
   * Convierte la respuesta del backend al formato utilizado
   * por el frontend.
   */
  private normalize(response: unknown): FutRecord {
    const data: ApiResponse =
      response !== null &&
      typeof response === 'object' &&
      !Array.isArray(response)
        ? (response as ApiResponse)
        : {};

    const getValue = (
      primary: string,
      fallback?: string
    ): unknown => {
      return data[primary] ?? (
        fallback ? data[fallback] : undefined
      );
    };

    const getString = (
      primary: string,
      fallback?: string,
      defaultValue = ''
    ): string => {
      const value = getValue(primary, fallback);

      return value != null
        ? String(value)
        : defaultValue;
    };

    // Normalizar historial de seguimiento.
    const historyData = Array.isArray(data['history'])
      ? data['history']
      : Array.isArray(data['historial'])
        ? data['historial']
        : [];

    const history = historyData
      .filter(
        (item): item is ApiResponse =>
          item !== null &&
          typeof item === 'object' &&
          !Array.isArray(item)
      )
      .map((item) => ({
        oldStatus: String(
          item['oldStatus'] ??
          item['estadoAnterior'] ??
          ''
        ),
        newStatus: String(
          item['newStatus'] ??
          item['estadoNuevo'] ??
          ''
        ),
        observation: String(
          item['observation'] ??
          item['observacion'] ??
          ''
        ),
        changedAt: String(
          item['changedAt'] ??
          item['fechaCambio'] ??
          ''
        ),
      }));

    return {
      ...data,

      // Identificadores y código de seguimiento.
      id: Number(
        getValue('id') ?? getValue('requestId') ?? getValue('idSolicitud') ?? 0
      ),

      trackingCode: getString(
        'trackingCode',
        'codigoSeguimiento'
      ),

      // Estado y observaciones.
      status: getString(
        'status',
        'estado',
        'RECIBIDO'
      ),

      observation: getString(
        'observation',
        'observacion'
      ),

      // Fechas del trámite.
      createdAt: getString(
        'createdAt',
        'fechaRegistro'
      ),

      updatedAt: getString(
        'updatedAt',
        'fechaActualizacion',
        getString('fechaRegistro')
      ),

      deletedAt:
        getValue('deletedAt', 'fechaEliminacion') != null
          ? String(
              getValue('deletedAt', 'fechaEliminacion')
            )
          : undefined,

      // Información del solicitante.
      // El backend devuelve "procedureRequested" para el nombre del trámite (solicito).
      // El template usa r.solicitante para la columna ASUNTO.
      solicitante: getString('solicitante', 'solicito') ||
        getString('procedureRequested'),

      fullName: getString(
        'fullName',
        'nombreCompleto'
      ),

      email: getString(
        'email',
        'correo'
      ),

      cellphone: getString(
        'cellphone',
        'celular'
      ),

      celular: getString(
        'celular',
        'cellphone'
      ),

      address: getString(
        'address',
        'domicilio'
      ),

      district: getString(
        'district',
        'distrito'
      ),

      province: getString(
        'province',
        'provincia'
      ),

      department: getString(
        'department',
        'departamento'
      ),

      // Información del trámite.
      basis: getString(
        'basis',
        'fundamento'
      ),

      attachedDocuments: getString(
        'attachedDocuments',
        'documentosAdjuntos'
      ),

      declaredDate: getString(
        'declaredDate',
        'fechaDeclarada'
      ),

      signatureNote: getString(
        'signatureNote',
        'notaFirma'
      ),

      tipoTramite:
        getValue('tipoTramite') != null
          ? String(getValue('tipoTramite'))
          // El backend devuelve "procedureRequested" como el nombre del trámite solicitado
          : getValue('procedureRequested') != null
            ? String(getValue('procedureRequested'))
            : undefined,

      tipoSolicitante:
        getValue('tipoSolicitante') != null
          ? String(getValue('tipoSolicitante'))
          // El backend devuelve "applicantType"
          : getValue('applicantType') != null
            ? String(getValue('applicantType'))
            : undefined,

      tipoDocumento:
        getValue('tipoDocumento') != null
          ? String(getValue('tipoDocumento'))
          // El backend devuelve "documentType"
          : getValue('documentType') != null
            ? String(getValue('documentType'))
            : undefined,

      folios:
        getValue('folios') != null
          ? Number(getValue('folios'))
          : undefined,

      archivoNombre:
        getValue('archivoNombre') != null
          ? String(getValue('archivoNombre'))
          : undefined,

      // Historial de seguimiento.
      history,
    } as FutRecord;
  }
}
