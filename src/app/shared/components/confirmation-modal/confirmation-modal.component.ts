import { Component, Input, Output, EventEmitter } from '@angular/core';

let modalCounter = 0;

/**
 * Modal de confirmación reutilizable.
 * Muestra un diálogo que espera la acción del usuario.
 *
 * @example
 * <app-confirmation-modal
 *   [open]="showModal"
 *   title="Eliminar registro"
 *   message="¿Está seguro de que desea eliminar este elemento?"
 *   [danger]="true"
 *   (confirm)="onDelete()"
 *   (cancel)="showModal = false"
 * />
 */
@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [],
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.css',
})
export class ConfirmationModalComponent {
  @Input() open = false;
  @Input() title = '¿Confirmar acción?';
  @Input() message = '¿Está seguro de que desea continuar?';
  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel  = 'Cancelar';
  @Input() loading = false;
  /** Usa estilo rojo/peligroso en el botón de confirmar. */
  @Input() danger = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel  = new EventEmitter<void>();

  readonly _id = `modal-${++modalCounter}`;
}
