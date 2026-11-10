import { Component, Input } from '@angular/core';

/**
 * Indicador de carga genérico (spinner + texto opcional).
 */
@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.css',
})
export class LoadingComponent {
  @Input() label = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
}
