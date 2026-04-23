import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar';
import { GlobalSearchComponent } from '../../shared/global-search/global-search';
import { SessionTimerComponent } from '../../shared/session-timer/session-timer';
import { NotificacionService, Notificacion } from '../../services/notificacion.service';
import { IdleService } from '../../services/idle.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, SidebarComponent, GlobalSearchComponent, SessionTimerComponent],
  template: `
    <div class="layout">
      <div class="mobile-header">
        <button class="hamburger-btn" (click)="sidebarOpen.set(true)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <span class="mobile-title">Beethoven</span>
        <button class="notif-btn-mobile" (click)="notifOpen.set(!notifOpen())">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          @if (notifService.unreadCount() > 0) {
            <span class="notif-badge">{{ notifService.unreadCount() }}</span>
          }
        </button>
      </div>
      @if (sidebarOpen()) {
        <div class="sidebar-overlay" (click)="sidebarOpen.set(false)"></div>
      }
      <app-sidebar [isOpen]="sidebarOpen()" (toggle)="sidebarOpen.set(false)" />
      <main class="main-content">
        <div class="top-bar">
          <app-global-search />
          <div class="top-bar-right">
            <app-session-timer />
            <div class="notif-wrapper">
              <button class="notif-btn" (click)="notifOpen.set(!notifOpen())">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                @if (notifService.unreadCount() > 0) {
                  <span class="notif-badge">{{ notifService.unreadCount() }}</span>
                }
              </button>
              @if (notifOpen()) {
                <div class="notif-dropdown">
                  <div class="notif-header">
                    <span>Notificaciones</span>
                    @if (notifService.unreadCount() > 0) {
                      <button class="mark-all-btn" (click)="markAllRead()">Marcar todas</button>
                    }
                  </div>
                  <div class="notif-list">
                    @for (n of notifService.notificaciones(); track n._id) {
                      <div class="notif-item" [class.unread]="!n.leida" (click)="onNotifClick(n)">
                        <div class="notif-icon" [attr.data-type]="n.tipo">
                          @switch (n.tipo) {
                            @case ('aprobacion_pendiente') { <span>!</span> }
                            @case ('aprobacion_reenviada') { <span>!</span> }
                            @case ('aprobacion_para_ejecutar') { <span>▶</span> }
                            @case ('pago_confirmado') { <span>$</span> }
                            @case ('pago_rechazado') { <span>✕</span> }
                            @case ('factura_por_vencer') { <span>!</span> }
                            @default { <span>i</span> }
                          }
                        </div>
                        <div class="notif-content">
                          <div class="notif-title">{{ n.titulo }}</div>
                          <div class="notif-msg">{{ n.mensaje }}</div>
                          <div class="notif-time">{{ formatTime(n.createdAt) }}</div>
                        </div>
                      </div>
                    } @empty {
                      <div class="notif-empty">Sin notificaciones</div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; }
    .main-content {
      flex: 1;
      margin-left: 260px;
      padding: 0 2rem 2rem;
      overflow-y: auto;
      max-height: 100vh;
    }
    .top-bar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 1rem 0;
      margin-bottom: 0.5rem;
      gap: 1rem;
    }
    .top-bar-right { display: flex; align-items: center; gap: 0.75rem; }
    .notif-wrapper { position: relative; }
    .notif-btn, .notif-btn-mobile {
      position: relative;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--color-gray-900);
      transition: all 0.2s;
    }
    .notif-btn:hover { background: var(--glass-hover-bg); }
    .notif-btn-mobile {
      margin-left: auto;
      background: rgba(255,255,255,0.15);
      border-color: transparent;
      color: white;
    }
    .notif-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: white;
      font-size: 0.625rem;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }
    .notif-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 380px;
      max-height: 480px;
      background: var(--bg-card);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      z-index: 1000;
      overflow: hidden;
    }
    .notif-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid var(--glass-border);
      font-weight: 600;
      font-size: 0.875rem;
    }
    .mark-all-btn {
      background: none;
      border: none;
      color: var(--color-primary);
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .notif-list { max-height: 400px; overflow-y: auto; }
    .notif-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      cursor: pointer;
      transition: background 0.15s;
      border-bottom: 1px solid var(--glass-border);
    }
    .notif-item:hover { background: var(--glass-hover-bg); }
    .notif-item.unread { background: rgba(59,130,246,0.05); }
    .notif-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--glass-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-weight: 700;
      font-size: 0.75rem;
      color: var(--color-primary);
    }
    .notif-icon[data-type="factura_por_vencer"] { color: #f59e0b; background: rgba(245,158,11,0.1); }
    .notif-icon[data-type="pago_confirmado"] { color: #10b981; background: rgba(16,185,129,0.1); }
    .notif-icon[data-type="pago_rechazado"] { color: #ef4444; background: rgba(239,68,68,0.1); }
    .notif-content { flex: 1; min-width: 0; }
    .notif-title { font-size: 0.8125rem; font-weight: 600; color: var(--color-gray-900); }
    .notif-msg { font-size: 0.75rem; color: var(--color-gray-700); margin-top: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .notif-time { font-size: 0.6875rem; color: var(--color-gray-500); margin-top: 4px; }
    .notif-empty { padding: 2rem; text-align: center; color: var(--color-gray-500); font-size: 0.875rem; }

    .mobile-header {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 56px;
      background: var(--gradient-sidebar);
      color: white;
      align-items: center;
      gap: 0.75rem;
      padding: 0 1rem;
      z-index: 150;
    }
    .hamburger-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .mobile-title {
      font-size: 1rem;
      font-weight: 600;
    }
    .sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 190;
    }
    @media (max-width: 768px) {
      .mobile-header { display: flex; }
      .sidebar-overlay { display: block; }
      .main-content { margin-left: 0; padding: 1rem; padding-top: calc(56px + 1rem); }
      .top-bar { display: none; }
      .notif-dropdown { width: calc(100vw - 2rem); right: -1rem; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  sidebarOpen = signal(false);
  notifOpen = signal(false);

  constructor(
    private router: Router,
    public notifService: NotificacionService,
    private idleService: IdleService,
  ) {
    this.idleService.start();
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
    ).subscribe(() => {
      this.sidebarOpen.set(false);
      this.notifOpen.set(false);
    });
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  }

  onNotifClick(n: Notificacion) {
    if (!n.leida) {
      this.notifService.markAsRead(n._id).subscribe();
    }
    this.notifOpen.set(false);
    if (n.entidad && n.entidadId) {
      this.router.navigate([`/${n.entidad}`, n.entidadId]);
    }
  }

  markAllRead() {
    this.notifService.markAllAsRead().subscribe();
  }
}
