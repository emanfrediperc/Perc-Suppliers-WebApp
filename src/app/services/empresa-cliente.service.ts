import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { EmpresaCliente, PaginatedResponse } from '../models';

export interface AfipContribuyente {
  razonSocial: string;
  condicionIva: string;
  domicilio: string;
  tipoPersona: string;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class EmpresaClienteService {
  private url = `${environment.apiUrl}/empresas-clientes`;
  constructor(private http: HttpClient) {}

  getAll(params?: any) {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) httpParams = httpParams.set(k, params[k]); });
    return this.http.get<PaginatedResponse<EmpresaCliente>>(this.url, { params: httpParams });
  }

  getById(id: string) { return this.http.get<EmpresaCliente>(`${this.url}/${id}`); }
  create(data: any) { return this.http.post<EmpresaCliente>(this.url, data); }
  update(id: string, data: any) { return this.http.patch<EmpresaCliente>(`${this.url}/${id}`, data); }

  consultarCuit(cuit: string) {
    return this.http.get<AfipContribuyente>(`${this.url}/consultar-cuit/${cuit}`);
  }
}
