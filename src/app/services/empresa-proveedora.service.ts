import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { EmpresaProveedora, PaginatedResponse } from '../models';

export interface AfipContribuyente {
  razonSocial: string;
  condicionIva: string;
  domicilio: string;
  tipoPersona: string;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class EmpresaProveedoraService {
  private url = `${environment.apiUrl}/empresas-proveedoras`;
  constructor(private http: HttpClient) {}

  getAll(params?: any) {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) httpParams = httpParams.set(k, params[k]); });
    return this.http.get<PaginatedResponse<EmpresaProveedora>>(this.url, { params: httpParams });
  }

  getById(id: string) { return this.http.get<EmpresaProveedora>(`${this.url}/${id}`); }
  create(data: any) { return this.http.post<EmpresaProveedora>(this.url, data); }
  update(id: string, data: any) { return this.http.patch<EmpresaProveedora>(`${this.url}/${id}`, data); }

  consultarCuit(cuit: string) {
    return this.http.get<AfipContribuyente>(`${this.url}/consultar-cuit/${cuit}`);
  }
}
