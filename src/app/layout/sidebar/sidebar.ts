import { Component, input, output, computed, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ThemeService, ThemeMode } from '../../services/theme.service';
import { NotificacionService } from '../../services/notificacion.service';
import { AprobacionService } from '../../services/aprobacion.service';
import { OperadorCountsService } from '../../services/operador-counts.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, UpperCasePipe],
  template: `
    <aside class="sidebar" [class.open]="isOpen()">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">B</span>
          <span class="logo-text">Beethoven</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <span class="nav-section-title">Tesorería</span>

          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" (click)="toggle.emit()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            <span>Dashboard</span>
          </a>

          <a routerLink="/ordenes-pago" routerLinkActive="active" class="nav-item" (click)="toggle.emit()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span>Ordenes de Pago</span>
            @if (canExecute() && operadorCountsService.counts().ordenesPago > 0) {
              <span class="badge badge-action">{{ operadorCountsService.counts().ordenesPago }}</span>
            }
          </a>

          <a routerLink="/facturas" routerLinkActive="active" class="nav-item" (click)="toggle.emit()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
            <span>Facturas</span>
          </a>

          @if (canManage()) {
            <a routerLink="/convenios" routerLinkActive="active" class="nav-item" (click)="toggle.emit()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span>Productores</span>
            </a>

            <a routerLink="/empresas" routerLinkActive="active" class="nav-item" (click)="toggle.emit()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>Empresas</span>
            </a>
          }

          <a routerLink="/reportes" routerLinkActive="active" class="nav-item" (click)="toggle.emit()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
            <span>Reportes</span>
          </a>

          <a routerLink="/estado-cuenta" routerLinkActive="active" class="nav-item" (click)="toggle.emit()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span>Estado de Cuenta</span>
          </a>
        </div>

        <div class="nav-section">
          <span class="nav-section-title">Préstamos</span>

          <a routerLink="/prestamos" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-item" (click)="toggle.emit()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 17l4-4 4 4 6-6"/></svg>
            <span>Préstamos</span>
            @if (canExecute() && operadorCountsService.counts().prestamos > 0) {
              <span class="badge badge-action">{{ operadorCountsService.counts().prestamos }}</span>
            }
          </a>

          <a routerLink="/compras-moneda-extranjera" routerLinkActive="active" class="nav-item" (click)="toggle.emit()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="18"/></svg>
            <span>Compras FX</span>
            @if (canExecute() && operadorCountsService.counts().comprasFx > 0) {
              <span class="badge badge-action">{{ operadorCountsService.counts().comprasFx }}</span>
            }
          </a>
        </div>

        @if (canApprove()) {
          <div class="nav-section">
            <span class="nav-section-title">Aprobaciones</span>

            <a routerLink="/aprobaciones" routerLinkActive="active" class="nav-item" (click)="toggle.emit()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <span>Bandeja</span>
              @if (aprobacionService.pendingCount() > 0) {
                <span class="badge">{{ aprobacionService.pendingCount() }}</span>
              }
            </a>
          </div>
        }

        @if (isAdmin()) {
          <div class="nav-divider"></div>
          <a routerLink="/admin/usuarios" routerLinkActive="active" class="nav-item" (click)="toggle.emit()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Usuarios</span>
          </a>
          <a routerLink="/admin/audit-logs" routerLinkActive="active" class="nav-item" (click)="toggle.emit()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <span>Audit Logs</span>
          </a>
        }
      </nav>

      <div class="sidebar-footer">
        @if (auth.user(); as user) {
          <div class="user-info">
            <div class="user-avatar">{{ user.nombre[0] }}</div>
            <div class="user-details">
              <span class="user-name">{{ user.nombre }} {{ user.apellido }}</span>
              <span class="user-role">{{ user.role | uppercase }}</span>
            </div>
          </div>
        }
        <div class="footer-actions">
          <div class="theme-selector">
            <button
              class="theme-option"
              [class.active]="theme.themeMode() === 'light'"
              (click)="theme.setTheme('light')"
              title="Modo claro">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            </button>
            <button
              class="theme-option"
              [class.active]="theme.themeMode() === 'dark'"
              (click)="theme.setTheme('dark')"
              title="Modo oscuro">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
            <button
              class="theme-option"
              [class.active]="theme.themeMode() === 'system'"
              (click)="theme.setTheme('system')"
              title="Seguir al sistema">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </button>
          </div>
          <button class="logout-btn" (click)="auth.logout()" title="Cerrar sesion">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </aside>
  `,
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit, OnDestroy {
  isOpen = input(false);
  toggle = output<void>();

  private countsInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    public notifService: NotificacionService,
    public aprobacionService: AprobacionService,
    public operadorCountsService: OperadorCountsService,
  ) {}

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.notifService.startPolling();
      this.aprobacionService.loadPendingCount();
      if (this.canExecute()) {
        this.operadorCountsService.load();
        // Refresco suave cada 60s; alcanza para que el operador vea nuevos items
        // sin golpear el endpoint como si fuera notificaciones.
        this.countsInterval = setInterval(() => this.operadorCountsService.load(), 60_000);
      }
    }
  }

  ngOnDestroy() {
    this.notifService.stopPolling();
    if (this.countsInterval) {
      clearInterval(this.countsInterval);
      this.countsInterval = null;
    }
  }

  isAdmin = computed(() => this.auth.user()?.role === 'admin');
  canApprove = computed(() => this.auth.user()?.role === 'aprobador');
  canManage = computed(() => ['admin', 'tesoreria', 'operador'].includes(this.auth.user()?.role || ''));
  canExecute = computed(() => ['admin', 'operador'].includes(this.auth.user()?.role || ''));
}
