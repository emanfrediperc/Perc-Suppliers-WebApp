import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Factura, Pago, PaginatedResponse, DuplicateCheckResult } from '../models';

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private url = `${environment.apiUrl}/facturas`;

  constructor(private http: HttpClient) {}

  getAll(params?: any) {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) httpParams = httpParams.set(k, params[k]); });
    return this.http.get<PaginatedResponse<Factura>>(this.url, { params: httpParams });
  }

  getById(id: string) { return this.http.get<Factura>(`${this.url}/${id}`); }
  create(data: any) { return this.http.post<Factura>(this.url, data); }
  update(id: string, data: any) { return this.http.patch<Factura>(`${this.url}/${id}`, data); }
  pagar(id: string, data: any) { return this.http.post<Pago>(`${this.url}/${id}/pagar`, data); }

  checkDuplicate(numero: string, empresaProveedora: string, montoTotal?: number) {
    let httpParams = new HttpParams().set('numero', numero).set('empresaProveedora', empresaProveedora);
    if (montoTotal != null) httpParams = httpParams.set('montoTotal', montoTotal.toString());
    return this.http.get<DuplicateCheckResult>(`${this.url}/check-duplicate`, { params: httpParams });
  }

  uploadFile(file: File) {
    const fd = new FormData();
    fd.append('archivo', file);
    return this.http.post<{ archivoUrl: string; archivoKey: string; archivoNombre: string }>(`${this.url}/upload`, fd);
  }

  uploadAndOcr(file: File) {
    const fd = new FormData();
    fd.append('archivo', file);
    return this.http.post<{
      archivoUrl: string; archivoKey: string; archivoNombre: string;
      ocrData: import('../models').OcrExtractedData | null; ocrError: string | null;
    }>(`${this.url}/ocr`, fd);
  }
}
