import { Injectable, signal, computed } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

/**
 * Servicio de notificaciones toast para retroalimentación al usuario.
 * Uso:
 *   this.notifications.show('Guardado correctamente', 'success');
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications = signal<Notification[]>([]);

  readonly notifications = this._notifications.asReadonly();
  readonly hasNotifications = computed(() => this._notifications().length > 0);

  /**
   * Muestra una notificación.
   * @param message Texto a mostrar
   * @param type    Tipo visual (success, error, warning, info)
   * @param duration Milisegundos antes de desaparecer automáticamente (default 4000)
   */
  show(message: string, type: NotificationType = 'info', duration = 4000): void {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const notification: Notification = { id, type, message, duration };

    this._notifications.update(n => [...n, notification]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  /** Elimina una notificación por su id. */
  dismiss(id: string): void {
    this._notifications.update(n => n.filter(x => x.id !== id));
  }

  /** Elimina todas las notificaciones activas. */
  clear(): void {
    this._notifications.set([]);
  }
}
