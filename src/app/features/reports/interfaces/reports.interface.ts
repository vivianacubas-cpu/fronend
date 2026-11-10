/**
 * Interfaces para la feature Reportes.
 */
export interface ReportFilter {
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: string;
  tipoTramite?: string;
}

export interface ReportSummary {
  total: number;
  pendientes: number;
  enProceso: number;
  aprobados: number;
  rechazados: number;
  observados: number;
}
