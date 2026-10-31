export interface LoginResponse {
  token: string;
  username: string;
  fullName: string;
  role: string;
  idUsuario?: number;
}
