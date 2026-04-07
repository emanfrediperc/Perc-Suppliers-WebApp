import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PagoProgramado, PaginatedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class PagoProgramadoService {
  private url = `${environment.apiUrl}/pagos-programados`;
  constructor(private http: HttpClient) {}

  getAll(params?: any) {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) httpParams = httpParams.set(k, params[k]); });
    return this.http.get<PaginatedResponse<PagoProgramado>>(this.url, { params: httpParams });
  }

  getById(id: string) { return this.http.get<PagoProgramado>(`${this.url}/${id}`); }
  getProximos(dias: number = 7) { return this.http.get<PagoProgramado[]>(`${this.url}/proximos`, { params: { dias: dias.toString() } }); }
  create(data: any) { return this.http.post<PagoProgramado>(this.url, data); }
  cancelar(id: string) { return this.http.patch<PagoProgramado>(`${this.url}/${id}/cancelar`, {}); }
}
