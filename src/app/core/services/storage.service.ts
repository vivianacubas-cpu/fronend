import { Injectable } from '@angular/core';

/**
 * Servicio de abstracción sobre localStorage y sessionStorage.
 * Serializa/deserializa JSON automáticamente y captura errores de almacenamiento.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {

  // ── sessionStorage ──────────────────────────────────────────────────────────

  /** Guarda un valor en sessionStorage. */
  setSession<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch { /* cuota superada o modo privado bloqueado */ }
  }

  /** Lee y deserializa un valor de sessionStorage. Devuelve null si no existe. */
  getSession<T>(key: string): T | null {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch { return null; }
  }

  /** Elimina una clave de sessionStorage. */
  removeSession(key: string): void {
    try { sessionStorage.removeItem(key); } catch { /* noop */ }
  }

  /** Borra todo sessionStorage. */
  clearSession(): void {
    try { sessionStorage.clear(); } catch { /* noop */ }
  }

  // ── localStorage ────────────────────────────────────────────────────────────

  /** Guarda un valor en localStorage. */
  setLocal<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* cuota superada */ }
  }

  /** Lee y deserializa un valor de localStorage. Devuelve null si no existe. */
  getLocal<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch { return null; }
  }

  /** Elimina una clave de localStorage. */
  removeLocal(key: string): void {
    try { localStorage.removeItem(key); } catch { /* noop */ }
  }

  /** Borra todo localStorage. */
  clearLocal(): void {
    try { localStorage.clear(); } catch { /* noop */ }
  }
}
