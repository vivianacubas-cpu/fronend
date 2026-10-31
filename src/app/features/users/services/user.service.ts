import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../interfaces/user.model';

export type { Usuario } from '../interfaces/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = `${environment.apiUrl}/usuario`;

  constructor(private readonly http: HttpClient) {}

  /** GET /v1/api/usuario — todos */
  findAll(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.api);
  }

  /** GET /v1/api/usuario/{id} */
  findById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.api}/${id}`);
  }

  /** GET /v1/api/usuario/estado/{estado} */
  findByEstado(estado: boolean): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.api}/estado/${estado}`);
  }

  /** POST /v1/api/usuario/save */
  save(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.api}/save`, usuario);
  }

  /** PUT /v1/api/usuario/update/{id} */
  update(id: number, usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.api}/update/${id}`, usuario);
  }

  /** PATCH /v1/api/usuario/delete/{id} — eliminación lógica */
  delete(id: number): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.api}/delete/${id}`, {});
  }

  /** PATCH /v1/api/usuario/restore/{id} — restaurar */
  restore(id: number): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.api}/restore/${id}`, {});
  }
}
