import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs';

export interface Aprobacion {
  _id: string;
  entidad: string;
  entidadId: string;
  tipo: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  aprobadores: { userId: string; nombre: string; email: string; decision: string; comentario: string; fecha: string }[];
  aprobacionesRequeridas: number;
  monto: number;
  descripcion: string;
  createdBy: string;
  createdByEmail: string;
  datosOperacion?: Record<string, any>;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AprobacionService {
  private url = `${environment.apiUrl}/aprobaciones`;
  private _pendingCount = signal(0);
  pendingCount = this._pendingCount.asReadonly();

  constructor(private http: HttpClient) {}

  loadPendingCount() {
    this.http.get<number>(`${this.url}/count`).subscribe(count => this._pendingCount.set(count));
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
}
