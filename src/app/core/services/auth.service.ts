import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { LoginResponse } from '../models/login-response.model';
import { environment } from '../../../environments/environment';

export type { LoginResponse } from '../models/login-response.model';

/** Estructura del usuario tal como lo devuelve GET /v1/api/usuario */
interface UsuarioBackend {
  idUsuario: number;
  idRol: number;
  nombreUsuario: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correo: string;
  estado: boolean;
}

// ─── Usuarios de demostración ────────────────────────────────────────────────
// Permiten ingresar al panel aunque el backend no esté disponible.
// Ambos roles (DIRECTORA y SECRETARIA) tienen acceso completo a /admin/tramites.
// ⚠️ NO usar con datos reales ni en producción.
interface DemoUser {
  username: string;
  password: string;
  fullName: string;
  role: string;
  idUsuario: number;
}

const DEMO_USERS: DemoUser[] = [
  {
    username:  'directora.demo',
    password:  'DirectoraDemo2026!',
    fullName:  'Directora Demo',
    role:      'DIRECTORA',
    idUsuario: 1,
  },
  {
    username:  'secretaria.demo',
    password:  'SecretariaDemo2026!',
    fullName:  'Secretaria Demo',
    role:      'SECRETARIA',
    idUsuario: 2,
  },
];
// ─────────────────────────────────────────────────────────────────────────────

/** Roles con acceso al panel administrativo de trámites. */
export const ADMIN_ROLES = ['DIRECTORA', 'SECRETARIA', 'ADMIN'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'fut-session';
  private readonly apiUrl = `${environment.apiUrl}/usuario`;

  private tokenState = signal<string | null>(this.readSession()?.token ?? null);
  token = this.tokenState.asReadonly();
  user = signal<LoginResponse | null>(this.readSession());

  constructor(private readonly http: HttpClient) {}

  /**
   * Proceso de autenticación:
   * 1. Si las credenciales coinciden con un usuario DEMO → sesión demo inmediata
   *    (sin llamada al backend). Útil para demostraciones sin servidor.
   * 2. Si no es usuario demo → autentica contra el backend real.
   *
   * Roles con acceso al panel de trámites: DIRECTORA, SECRETARIA, ADMIN.
   */
  login(username: string, password: string): Observable<LoginResponse> {
    const u = username.trim().toLowerCase();

    // ── Paso 1: Comprobar modo demo ──────────────────────────────────────────
    const demoUser = DEMO_USERS.find(
      (d) => d.username === u && d.password === password
    );
    if (demoUser) {
      const response: LoginResponse = {
        token:     `demo-${demoUser.idUsuario}-${Date.now()}`,
        username:  demoUser.username,
        fullName:  demoUser.fullName,
        role:      demoUser.role,
        idUsuario: demoUser.idUsuario,
      };
      this.saveSession(response);
      return of(response);
    }

    // ── Paso 2: Autenticación real contra el backend ─────────────────────────
    return this.http.get<UsuarioBackend[]>(`${this.apiUrl}/estado/true`).pipe(
      map((users) => {
        const found = users.find(
          (usr) => usr.nombreUsuario.toLowerCase() === u
        );
        if (!found) {
          throw new Error('Usuario no encontrado o inactivo.');
        }

        const rolMap: Record<number, string> = {
          1: 'DIRECTORA',
          2: 'SECRETARIA',
          3: 'ADMIN',
        };

        const response: LoginResponse = {
          token:     `session-${found.idUsuario}-${Date.now()}`,
          username:  found.nombreUsuario,
          fullName:  `${found.nombres} ${found.apellidoPaterno} ${found.apellidoMaterno}`.trim(),
          role:      rolMap[found.idRol] ?? `ROL_${found.idRol}`,
          idUsuario: found.idUsuario,
        };

        this.saveSession(response);
        return response;
      }),
      catchError((err) => {
        const msg = err?.message?.includes('Usuario')
          ? err.message
          : 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.';
        return throwError(() => new Error(msg));
      })
    );
  }

  /** Devuelve true si el usuario actual puede acceder al panel admin de trámites. */
  canAccessAdmin(): boolean {
    const role = this.user()?.role ?? '';
    return (ADMIN_ROLES as readonly string[]).includes(role);
  }

  logout(): void {
    this.tokenState.set(null);
    this.user.set(null);
    try { sessionStorage.removeItem(this.storageKey); } catch { /* noop */ }
  }

  isLoggedIn(): boolean {
    return !!this.tokenState();
  }

  private saveSession(response: LoginResponse): void {
    this.tokenState.set(response.token);
    this.user.set(response);
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(response));
    } catch { /* storage bloqueado */ }
  }

  private readSession(): LoginResponse | null {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as LoginResponse;
      return parsed?.token && parsed?.username && parsed?.role ? parsed : null;
    } catch { return null; }
  }
}
