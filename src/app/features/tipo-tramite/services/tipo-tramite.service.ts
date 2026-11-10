import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TipoTramite, TipoTramiteEntrada } from '../interfaces/tipo-tramite.model';

@Injectable({ providedIn: 'root' })
export class TipoTramiteService {
    private readonly api = `${environment.apiUrl}/tipo-tramite`;

    constructor(private readonly http: HttpClient) { }

    listar(): Observable<TipoTramite[]> {
        return this.http.get<any[]>(this.api).pipe(map(rows => rows.map(r => this.normalize(r))));
    }

    listarActivos(): Observable<TipoTramite[]> {
        return this.http.get<any[]>(`${this.api}/estado/true`).pipe(map(rows => rows.map(r => this.normalize(r))));
    }

    obtener(id: number): Observable<TipoTramite> {
        return this.http.get<any>(`${this.api}/${id}`).pipe(map(r => this.normalize(r)));
    }

    crear(entrada: TipoTramiteEntrada): Observable<TipoTramite> {
        return this.http.post<any>(this.api, entrada).pipe(map(r => this.normalize(r)));
    }

    actualizar(id: number, entrada: TipoTramiteEntrada): Observable<TipoTramite> {
        return this.http.put<any>(`${this.api}/${id}`, entrada).pipe(map(r => this.normalize(r)));
    }

    cambiarEstado(id: number, estadoActual: boolean): Observable<TipoTramite> {
        return this.http.patch<any>(`${this.api}/${id}/estado`, { estado: !estadoActual }).pipe(map(r => this.normalize(r)));
    }

    eliminar(id: number): Observable<TipoTramite> {
        return this.http.patch<any>(`${this.api}/${id}/estado`, { estado: false }).pipe(map(r => this.normalize(r)));
    }

    restaurar(id: number): Observable<TipoTramite> {
        return this.http.patch<any>(`${this.api}/${id}/estado`, { estado: true }).pipe(map(r => this.normalize(r)));
    }

    private normalize(r: any): TipoTramite {
        return {
            // El backend envía "procedureTypeId" (nuevo) o "idTipoTramite" (legacy)
            idTipoTramite:      r?.procedureTypeId  ?? r?.idTipoTramite    ?? r?.id ?? 0,
            // "code" (nuevo) o "codigo" (legacy)
            codigo:             r?.code             ?? r?.codigo           ?? undefined,
            // "name" (nuevo) o "nombre" (legacy)
            nombre:             r?.name             ?? r?.nombre           ?? '',
            // "category" (nuevo) o "categoria" (legacy)
            categoria:          r?.category         ?? r?.categoria        ?? undefined,
            // "description" (nuevo) o "descripcion" (legacy)
            descripcion:        r?.description      ?? r?.descripcion      ?? '',
            // "requirements" (nuevo) o "requisitos" (legacy)
            requisitos:         r?.requirements     ?? r?.requisitos       ?? '',
            // "estimatedDays" (nuevo) o "plazoEstimadoDias" (legacy)
            plazoEstimadoDias:  r?.estimatedDays    ?? r?.plazoEstimadoDias ?? 0,
            // "requiresDocuments" (nuevo) o "requiereDocumentos" (legacy)
            requiereDocumentos: r?.requiresDocuments ?? r?.requiereDocumentos ?? false,
            // "validFrom" (nuevo) o "vigentDesde" (legacy)
            vigentDesde:        r?.validFrom        ?? r?.vigentDesde      ?? undefined,
            // "status" (nuevo) o "estado" (legacy) — boolean true/false
            estado:             r?.status           ?? r?.estado           ?? true,
            // fechas de auditoría
            fechaRegistro:      r?.createdAt        ?? r?.fechaRegistro    ?? r?.fecha_registro     ?? '',
            fechaActualizacion: r?.updatedAt        ?? r?.fechaActualizacion ?? r?.fecha_actualizacion ?? undefined,
            fechaEliminacion:   r?.deletedAt        ?? r?.fechaEliminacion  ?? r?.fecha_eliminacion   ?? undefined,
            fechaRestauracion:  r?.restoredAt       ?? r?.fechaRestauracion ?? r?.fecha_restauracion  ?? undefined,
        };
    }
}
