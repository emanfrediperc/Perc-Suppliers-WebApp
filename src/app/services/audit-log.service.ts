import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from '../models';

export interface AuditLog {
  _id: string;
  usuario: string;
  usuarioEmail: string;
  accion: string;
  entidad: string;
  entidadId?: string;
  cambios?: Record<string, any>;
  ip?: string;
  descripcion?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private url = `${environment.apiUrl}/audit-logs`;

  constructor(private http: HttpClient) {}

  getAll(params?: any) {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) httpParams = httpParams.set(k, params[k]); });
    return this.http.get<PaginatedResponse<AuditLog>>(this.url, { params: httpParams });
  }

  getByEntity(entidad: string, entidadId: string) {
    return this.http.get<AuditLog[]>(`${this.url}/${entidad}/${entidadId}`);
  }
}
