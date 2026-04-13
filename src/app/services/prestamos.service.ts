import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  Prestamo,
  PrestamoWithComputed,
  CreatePrestamoDto,
  UpdatePrestamoDto,
  RenewPrestamoDto,
  PrestamoFilters,
  EmpresaSearchResult,
  CurrencyCard,
  CurrencyPosition,
  Currency,
} from '../models/prestamo';

@Injectable({ providedIn: 'root' })
export class PrestamosService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/prestamos`;

  private buildParams(obj: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    }
    return params;
  }

  getAll(filters: PrestamoFilters = {}): Observable<PrestamoWithComputed[]> {
    return this.http.get<PrestamoWithComputed[]>(this.url, {
      params: this.buildParams(filters as Record<string, unknown>),
    });
  }

  getOne(id: string): Observable<PrestamoWithComputed> {
    return this.http.get<PrestamoWithComputed>(`${this.url}/${id}`);
  }

  create(dto: CreatePrestamoDto): Observable<Prestamo> {
    return this.http.post<Prestamo>(this.url, dto);
  }

  update(id: string, dto: UpdatePrestamoDto): Observable<Prestamo> {
    return this.http.patch<Prestamo>(`${this.url}/${id}`, dto);
  }

  clear(id: string): Observable<Prestamo> {
    return this.http.post<Prestamo>(`${this.url}/${id}/clear`, {});
  }

  renew(id: string, dto: RenewPrestamoDto): Observable<Prestamo> {
    return this.http.post<Prestamo>(`${this.url}/${id}/renew`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  searchEmpresas(q: string): Observable<EmpresaSearchResult[]> {
    return this.http.get<EmpresaSearchResult[]>(`${this.url}/empresas/search`, {
      params: new HttpParams().set('q', q),
    });
  }

  getDashboardSummary(currency?: Currency): Observable<{ cards: CurrencyCard[] }> {
    return this.http.get<{ cards: CurrencyCard[] }>(`${this.url}/dashboard/summary`, {
      params: this.buildParams({ currency }),
    });
  }

  getNetPosition(currency?: Currency): Observable<{ positions: CurrencyPosition[] }> {
    return this.http.get<{ positions: CurrencyPosition[] }>(`${this.url}/dashboard/net-position`, {
      params: this.buildParams({ currency }),
    });
  }
}
