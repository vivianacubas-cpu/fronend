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
            idTipoTramite:      r?.idTipoTramite    ?? r?.id ?? 0,
            codigo:             r?.codigo           ?? undefined,
            nombre:             r?.nombre           ?? '',
            categoria:          r?.categoria        ?? undefined,
            descripcion:        r?.descripcion      ?? '',
            requisitos:         r?.requisitos       ?? '',
            plazoEstimadoDias:  r?.plazoEstimadoDias ?? 0,
            requiereDocumentos: r?.requiereDocumentos ?? false,
            vigentDesde:        r?.vigentDesde       ?? undefined,
            estado:             r?.estado           ?? true,
            fechaRegistro:      r?.fechaRegistro    ?? r?.fecha_registro     ?? '',
            fechaActualizacion: r?.fechaActualizacion ?? r?.fecha_actualizacion ?? undefined,
            fechaEliminacion:   r?.fechaEliminacion  ?? r?.fecha_eliminacion   ?? undefined,
            fechaRestauracion:  r?.fechaRestauracion ?? r?.fecha_restauracion  ?? undefined,
        };
    }
}
