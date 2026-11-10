import { Component, Input } from '@angular/core';

/**
 * Estado vacío genérico para cuando no hay datos que mostrar.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css',
})
export class EmptyStateComponent {
  @Input() title = 'Sin resultados';
  @Input() message = 'No se encontraron registros.';
  @Input() icon = '📭';
}
