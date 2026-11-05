import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface SidebarItem {
  label: string;
  route: string;
  icon?: string;
}

/**
 * Sidebar de navegación para el layout administrativo.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  @Input() items: SidebarItem[] = [];
  @Output() logoutClick = new EventEmitter<void>();

  onLogout(): void {
    this.logoutClick.emit();
  }
}
