import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ReportSummary } from '../interfaces/reports.interface';

/**
 * Servicio de Reportes.
 */
@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly api = `${environment.apiUrl}/reportes`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Obtiene el resumen estadístico de trámites.
   */
  getSummary(): Observable<ReportSummary> {
    return this.http.get<ReportSummary>(`${this.api}/resumen`);
  }
}
