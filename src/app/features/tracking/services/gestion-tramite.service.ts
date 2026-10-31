import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GestionTramite, GestionTramiteRequest } from '../interfaces/gestion-tramite.model';

export interface AreaCatalogo {
    idArea: number;
    nombre: string;
}

@Injectable({ providedIn: 'root' })
export class GestionTramiteService {
    private readonly api = `${environment.apiUrl}/gestion-tramite`;
    private areas$?: Observable<AreaCatalogo[]>;

    constructor(private readonly http: HttpClient) {}

    crear(req: GestionTramiteRequest): Observable<GestionTramite> {
        return this.http.post<GestionTramite>(this.api, req);
    }

    listar(estadoGestion?: string): Observable<GestionTramite[]> {
        const params = estadoGestion ? `?estadoGestion=${estadoGestion}` : '';
        return this.http.get<GestionTramite[]>(`${this.api}${params}`);
    }

    obtener(id: number): Observable<GestionTramite> {
        return this.http.get<GestionTramite>(`${this.api}/${id}`);
    }

    porSolicitante(idSolicitante: number): Observable<GestionTramite[]> {
        return this.http.get<GestionTramite[]>(`${this.api}/solicitante/${idSolicitante}`);
    }

    actualizar(id: number, req: GestionTramiteRequest): Observable<GestionTramite> {
        return this.http.put<GestionTramite>(`${this.api}/${id}`, req);
    }

    eliminar(id: number): Observable<GestionTramite> {
        return this.http.patch<GestionTramite>(`${this.api}/delete/${id}`, {});
    }

    restaurar(id: number): Observable<GestionTramite> {
        return this.http.patch<GestionTramite>(`${this.api}/restore/${id}`, {});
    }

    eliminados(): Observable<GestionTramite[]> {
        return this.http.get<GestionTramite[]>(`${this.api}/eliminados`);
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
}
