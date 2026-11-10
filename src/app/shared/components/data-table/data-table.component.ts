import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  pipe?: 'date' | 'currency' | 'uppercase' | 'lowercase';
}

/**
 * Tabla de datos genérica y reutilizable.
 * Acepta columnas y datos por Input y emite eventos de acción por Output.
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css',
})
export class DataTableComponent<T extends Record<string, unknown>> {
  @Input() columns: TableColumn[] = [];
  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No hay registros para mostrar.';
  @Output() rowClick = new EventEmitter<T>();
  @Output() sortChange = new EventEmitter<{ key: string; direction: 'asc' | 'desc' }>();

  sortKey = '';
  sortDir: 'asc' | 'desc' = 'asc';

  sort(key: string): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.sortChange.emit({ key, direction: this.sortDir });
  }

  getValue(row: T, key: string): unknown {
    return row[key];
  }
}
