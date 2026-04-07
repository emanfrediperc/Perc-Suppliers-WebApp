import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Pago, PaginatedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class PagoService {
  private url = `${environment.apiUrl}/pagos`;
  constructor(private http: HttpClient) {}
  getAll(params?: any) {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) httpParams = httpParams.set(k, params[k]); });
    return this.http.get<PaginatedResponse<Pago>>(this.url, { params: httpParams });
  }
  getById(id: string) { return this.http.get<Pago>(`${this.url}/${id}`); }
  anular(id: string) { return this.http.patch<Pago>(`${this.url}/${id}/anular`, {}); }

  downloadComprobante(id: string) {
    this.http.get(`${this.url}/${id}/comprobante`, { responseType: 'blob' }).subscribe(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `comprobante-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }
}
