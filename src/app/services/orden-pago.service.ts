import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { OrdenPago, Pago, PaginatedResponse, PagoLoteResultado } from '../models';

@Injectable({ providedIn: 'root' })
export class OrdenPagoService {
  private url = `${environment.apiUrl}/ordenes-pago`;

  constructor(private http: HttpClient) {}

  getAll(params?: any) {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) httpParams = httpParams.set(k, params[k]); });
    return this.http.get<PaginatedResponse<OrdenPago>>(this.url, { params: httpParams });
  }

  getById(id: string) { return this.http.get<OrdenPago>(`${this.url}/${id}`); }
  create(data: any) { return this.http.post<OrdenPago>(this.url, data); }
  update(id: string, data: any) { return this.http.patch<OrdenPago>(`${this.url}/${id}`, data); }
  pagar(id: string, data: any) { return this.http.post<Pago>(`${this.url}/${id}/pagar`, data); }
  syncFinnegans() { return this.http.post<{ created: number; updated: number }>(`${this.url}/sync-finnegans`, {}); }
  pagarLote(pagos: any[]) { return this.http.post<PagoLoteResultado>(`${this.url}/pagar-lote`, { pagos }); }
}
