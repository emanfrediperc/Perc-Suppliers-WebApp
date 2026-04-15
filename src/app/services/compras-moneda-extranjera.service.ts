import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  CompraMonedaExtranjera,
  CreateCompraMonedaExtranjeraDto,
  AnularCompraMonedaExtranjeraDto,
  CompraMonedaExtranjeraFilters,
  PaginatedCompras,
} from '../models/compra-moneda-extranjera';

@Injectable({ providedIn: 'root' })
export class ComprasMonedaExtranjeraService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/compras-moneda-extranjera`;

  private buildParams(obj: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    }
    return params;
  }

  getAll(filters: CompraMonedaExtranjeraFilters = {}): Observable<PaginatedCompras> {
    return this.http.get<PaginatedCompras>(this.url, {
      params: this.buildParams(filters as Record<string, unknown>),
    });
  }

  getOne(id: string): Observable<CompraMonedaExtranjera> {
    return this.http.get<CompraMonedaExtranjera>(`${this.url}/${id}`);
  }

  create(dto: CreateCompraMonedaExtranjeraDto): Observable<CompraMonedaExtranjera> {
    return this.http.post<CompraMonedaExtranjera>(this.url, dto);
  }

  anular(id: string, dto: AnularCompraMonedaExtranjeraDto): Observable<CompraMonedaExtranjera> {
    return this.http.patch<CompraMonedaExtranjera>(`${this.url}/${id}/anular`, dto);
  }
}
