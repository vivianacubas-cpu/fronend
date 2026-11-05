/**
 * Interfaces para la feature Auth.
 */

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  token: string;
  username: string;
  fullName: string;
  role: string;
  idUsuario?: number;
}
