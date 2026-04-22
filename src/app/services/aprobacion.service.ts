import { Injectable, signal, DestroyRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs';

export interface DecisionAprobador {
  userId: string;
  nombre: string;
  email: string;
  decision: string;
  comentario: string;
  fecha: string;
}

export interface IntentoAprobacion {
  numero: number;
  aprobadores: DecisionAprobador[];
  estadoFinal: 'aprobada' | 'rechazada';
  fechaInicio: string;
  fechaFin?: string;
}

export interface Aprobacion {
  _id: string;
  entidad: 'ordenes-pago' | 'pagos' | 'prestamos' | 'compras-fx';
  entidadId: string;
  tipo: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  aprobadores: DecisionAprobador[];
  aprobacionesRequeridas: number;
  monto: number;
  descripcion: string;
  createdBy: string;
  createdByEmail: string;
  datosOperacion?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // Campos de reenvío
  intentos: IntentoAprobacion[];
  reenviosRestantes: number;
  fechaReenvio?: string;
  reenviadoPor?: string;
}

export interface ContextoToken {
  tipo: string;
  entidad: string;
  descripcion: string;
  monto: number;
  solicitante: string;
  fechaSolicitud: string;
  expiraEn: string;
  aprobadorEmail: string;
}

@Injectable({ providedIn: 'root' })
export class AprobacionService {
  private url = `${environment.apiUrl}/aprobaciones`;
  private _pendingCount = signal(0);
  private destroyRef = inject(DestroyRef);
  pendingCount = this._pendingCount.asReadonly();

  constructor(private http: HttpClient) {}

  loadPendingCount() {
    this.http.get<number>(`${this.url}/count`).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(count => this._pendingCount.set(count));
  }

  getPendientes() {
    return this.http.get<Aprobacion[]>(`${this.url}/pendientes`);
  }

  getAll() {
    return this.http.get<Aprobacion[]>(this.url);
  }

  getById(id: string) {
    return this.http.get<Aprobacion>(`${this.url}/${id}`);
  }

  getByEntity(entidad: string, entidadId: string) {
    return this.http.get<Aprobacion[]>(`${this.url}/entidad/${entidad}/${entidadId}`);
  }

  decidir(id: string, decision: string, comentario?: string) {
    return this.http.patch<Aprobacion>(`${this.url}/${id}/decidir`, { decision, comentario }).pipe(
      tap(() => this.loadPendingCount()),
    );
  }

  getContextoToken(token: string): Observable<ContextoToken> {
    return this.http.get<ContextoToken>(
      `${this.url}/contexto-token/${encodeURIComponent(token)}`,
    );
  }

  decidirViaToken(token: string, decision: 'aprobar' | 'rechazar', comentario?: string): Observable<{ mensaje: string; estadoAprobacion: string }> {
    return this.http.post<{ mensaje: string; estadoAprobacion: string }>(
      `${this.url}/decidir-via-token`,
      { token, decision, comentario },
    );
  }

  reenviar(aprobacionId: string): Observable<Aprobacion> {
    return this.http.patch<Aprobacion>(`${this.url}/${aprobacionId}/reenviar`, {});
  }

  reenviarMail(aprobacionId: string): Observable<{ mensaje: string; destinatarios: number }> {
    return this.http.post<{ mensaje: string; destinatarios: number }>(
      `${this.url}/${aprobacionId}/reenviar-mail`,
      {},
    );
  }
}
