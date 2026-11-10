/**
 * Wrapper genérico para las respuestas de la API REST.
 * El backend puede devolver datos encapsulados en esta estructura.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

/**
 * Respuesta de error estándar del backend.
 */
export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp?: string;
}
