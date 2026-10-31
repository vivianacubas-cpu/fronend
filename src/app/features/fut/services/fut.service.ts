import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FutPayload, FutRecord } from '../interfaces/fut.model';

export type { FutPayload, FutRecord } from '../interfaces/fut.model';

@Injectable({ providedIn: 'root' })
export class FutService {
  private readonly api = `${environment.apiUrl}/solicitud`;

  constructor(private readonly http: HttpClient) {}

  /** POST /v1/api/solicitud — registrar nuevo trámite */
  create(payload: FutPayload): Observable<FutRecord> {
    return this.http.post<unknown>(this.api, payload).pipe(map((r) => this.normalize(r)));
  }

  /** GET /v1/api/solicitud/seguimiento/{codigo} — consulta pública */
  track(code: string): Observable<FutRecord> {
    return this.http
      .get<unknown>(`${this.api}/seguimiento/${encodeURIComponent(code.trim().toUpperCase())}`)
      .pipe(map((r) => this.normalize(r)));
  }

  /** GET /v1/api/solicitud?estado=X — lista activas (admin) */
  list(status = ''): Observable<FutRecord[]> {
    let params = new HttpParams();
    if (status.trim()) params = params.set('estado', status.trim());
    return this.http
      .get<unknown[]>(this.api, { params })
      .pipe(map((rows) => rows.map((r) => this.normalize(r))));
  }

  /** GET /v1/api/solicitud/{id} — detalle completo */
  detail(id: number): Observable<FutRecord> {
    return this.http.get<unknown>(`${this.api}/${id}`).pipe(map((r) => this.normalize(r)));
  }

  /** PUT /v1/api/solicitud/{id} — editar datos */
  updateRequest(id: number, payload: FutPayload): Observable<FutRecord> {
    return this.http
      .put<unknown>(`${this.api}/${id}`, payload)
      .pipe(map((r) => this.normalize(r)));
  }

  /** PATCH /v1/api/solicitud/{id}/estado — cambiar estado (admin) */
  update(id: number, status: string, observation: string): Observable<FutRecord> {
    return this.http
      .patch<unknown>(`${this.api}/${id}/estado`, { estado: status, observacion: observation })
      .pipe(map((r) => this.normalize(r)));
  }

  /** DELETE /v1/api/solicitud/{id} — eliminación lógica */
  deleteRequest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  /** PATCH /v1/api/solicitud/{id}/restaurar — restaurar */
  restoreRequest(id: number): Observable<FutRecord> {
    return this.http
      .patch<unknown>(`${this.api}/${id}/restaurar`, {})
      .pipe(map((r) => this.normalize(r)));
  }

  /** GET /v1/api/solicitud/eliminadas — papelera */
  deleted(): Observable<FutRecord[]> {
    return this.http
      .get<unknown[]>(`${this.api}/eliminadas`)
      .pipe(map((rows) => rows.map((r) => this.normalize(r))));
  }

  // ── Normaliza la respuesta del backend a FutRecord ──────────────────────────
  private normalize(r: unknown): FutRecord {
    const o = r as Record<string, unknown>;
    const history = Array.isArray(o?.['history'])
      ? (o['history'] as Record<string, unknown>[]).map((h) => ({
          oldStatus:   String(h['oldStatus']   ?? h['estadoAnterior'] ?? ''),
          newStatus:   String(h['newStatus']   ?? h['estadoNuevo']    ?? ''),
          observation: String(h['observation'] ?? h['observacion']    ?? ''),
          changedAt:   String(h['changedAt']   ?? h['fechaCambio']    ?? ''),
        }))
      : [];

    return {
      ...o,
      // IDs y códigos
      id:           Number(o?.['id'] ?? o?.['idSolicitud'] ?? 0),
      trackingCode: String(o?.['trackingCode'] ?? o?.['codigoSeguimiento'] ?? ''),
      // Estado
      status:      String(o?.['status']      ?? o?.['estado']            ?? 'RECIBIDO'),
      observation: String(o?.['observation'] ?? o?.['observacion']       ?? ''),
      // Fechas
      createdAt:  String(o?.['createdAt']  ?? o?.['fechaRegistro']       ?? ''),
      updatedAt:  String(o?.['updatedAt']  ?? o?.['fechaActualizacion']  ?? o?.['fechaRegistro'] ?? ''),
      deletedAt:  o?.['deletedAt'] != null ? String(o['deletedAt'])
                : o?.['fechaEliminacion'] != null ? String(o['fechaEliminacion'])
                : undefined,
      // Solicitante
      solicitante: String(o?.['solicitante'] ?? o?.['solicito']       ?? ''),
      fullName:    String(o?.['fullName']    ?? o?.['nombreCompleto'] ?? ''),
      email:       String(o?.['email']       ?? o?.['correo']         ?? ''),
      cellphone:   String(o?.['cellphone']   ?? o?.['celular']        ?? ''),
      celular:     String(o?.['celular']     ?? o?.['cellphone']      ?? ''),
      address:     String(o?.['address']     ?? o?.['domicilio']      ?? ''),
      district:    String(o?.['district']    ?? o?.['distrito']       ?? ''),
      province:    String(o?.['province']    ?? o?.['provincia']      ?? ''),
      department:  String(o?.['department']  ?? o?.['departamento']   ?? ''),
      // Trámite
      basis:             String(o?.['basis']             ?? o?.['fundamento']          ?? ''),
      attachedDocuments: String(o?.['attachedDocuments'] ?? o?.['documentosAdjuntos']  ?? ''),
      declaredDate:      String(o?.['declaredDate']      ?? o?.['fechaDeclarada']      ?? ''),
      signatureNote:     String(o?.['signatureNote']     ?? o?.['notaFirma']           ?? ''),
      tipoTramite:       o?.['tipoTramite'] != null ? String(o['tipoTramite']) : undefined,
      tipoSolicitante:   o?.['tipoSolicitante'] != null ? String(o['tipoSolicitante']) : undefined,
      tipoDocumento:     o?.['tipoDocumento'] != null ? String(o['tipoDocumento']) : undefined,
      folios:            o?.['folios'] != null ? Number(o['folios']) : undefined,
      archivoNombre:     o?.['archivoNombre'] != null ? String(o['archivoNombre']) : undefined,
      history,
    } as FutRecord;
  }
}
