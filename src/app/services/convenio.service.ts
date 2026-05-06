import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Convenio, PaginatedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ConvenioService {
  private url = `${environment.apiUrl}/convenios`;
  constructor(private http: HttpClient) {}

  getAll(params?: any) {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) httpParams = httpParams.set(k, params[k]); });
    return this.http.get<PaginatedResponse<Convenio>>(this.url, { params: httpParams });
  }

  getById(id: string) { return this.http.get<Convenio>(`${this.url}/${id}`); }
  create(data: any) { return this.http.post<Convenio>(this.url, data); }
  update(id: string, data: any) { return this.http.patch<Convenio>(`${this.url}/${id}`, data); }
  addEmpresa(id: string, empresaId: string) { return this.http.post<Convenio>(`${this.url}/${id}/empresas`, { empresaId }); }
  removeEmpresa(id: string, empresaId: string) { return this.http.delete<Convenio>(`${this.url}/${id}/empresas/${empresaId}`); }

  getHistorico(id: string, empresaProveedora?: string) {
    let p = new HttpParams();
    if (empresaProveedora) p = p.set('empresaProveedora', empresaProveedora);
    return this.http.get<{
      productor: { _id: string; nombre: string; comisionPorcentaje: number; descuentoPorcentaje: number };
      totalCombinadoAdeudado: number;
      porEmpresa: { _id: string; razonSocial: string; cuit: string; montoTotal: number; saldoPendiente: number; montoPagado: number; cantidad: number }[];
      facturas: any[];
      empresaFiltrada: string | null;
    }>(`${this.url}/${id}/historico`, { params: p });
  }

  historicoExportUrl(id: string, empresaProveedora?: string) {
    return `${this.url}/${id}/historico/export${empresaProveedora ? '?empresaProveedora=' + encodeURIComponent(empresaProveedora) : ''}`;
  }
}
