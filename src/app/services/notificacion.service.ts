import { Injectable, signal, DestroyRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../environments/environment';
import { tap, interval, forkJoin } from 'rxjs';

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
export class NotificacionService {
  private url = `${environment.apiUrl}/notificaciones`;
  private _notificaciones = signal<Notificacion[]>([]);
  private _unreadCount = signal(0);
  private destroyRef = inject(DestroyRef);

  notificaciones = this._notificaciones.asReadonly();
  unreadCount = this._unreadCount.asReadonly();

  constructor(private http: HttpClient) {}

  loadNotifications() {
    forkJoin({
      list: this.http.get<Notificacion[]>(this.url),
      count: this.http.get<number>(`${this.url}/count`),
    }).subscribe(({ list, count }) => {
      this._notificaciones.set(list);
      this._unreadCount.set(count);
    });
  }

  startPolling() {
    this.loadNotifications();
    interval(30000).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadNotifications());
  }

  stopPolling() {}

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
