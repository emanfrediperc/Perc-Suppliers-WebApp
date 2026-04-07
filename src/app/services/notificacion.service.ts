import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap, Subscription, interval } from 'rxjs';

export interface Notificacion {
  _id: string;
  usuario: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  entidad?: string;
  entidadId?: string;
  leida: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionService implements OnDestroy {
  private url = `${environment.apiUrl}/notificaciones`;
  private _notificaciones = signal<Notificacion[]>([]);
  private _unreadCount = signal(0);
  private pollingSub: Subscription | null = null;

  notificaciones = this._notificaciones.asReadonly();
  unreadCount = this._unreadCount.asReadonly();

  constructor(private http: HttpClient) {}

  loadNotifications() {
    this.http.get<Notificacion[]>(this.url).subscribe(data => this._notificaciones.set(data));
    this.http.get<number>(`${this.url}/count`).subscribe(count => this._unreadCount.set(count));
  }

  startPolling() {
    this.stopPolling();
    this.loadNotifications();
    this.pollingSub = interval(30000).subscribe(() => this.loadNotifications());
  }

  stopPolling() {
    this.pollingSub?.unsubscribe();
    this.pollingSub = null;
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  markAsRead(id: string) {
    return this.http.patch<Notificacion>(`${this.url}/${id}/leer`, {}).pipe(
      tap(() => {
        this._notificaciones.update(list => list.map(n => n._id === id ? { ...n, leida: true } : n));
        this._unreadCount.update(c => Math.max(0, c - 1));
      }),
    );
  }

  markAllAsRead() {
    return this.http.patch(`${this.url}/leer-todas`, {}).pipe(
      tap(() => {
        this._notificaciones.update(list => list.map(n => ({ ...n, leida: true })));
        this._unreadCount.set(0);
      }),
    );
  }
}
