import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardSummary, DashboardActivity, DashboardPagosPorMes, DashboardFacturasPorEstado, DashboardTopProveedor, DashboardFacturaPorVencer } from '../models';

const CACHE_TTL_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private url = `${environment.apiUrl}/dashboard`;
  private cache = new Map<string, { data: any; timestamp: number }>();

  constructor(private http: HttpClient) {}

  invalidateCache() {
    this.cache.clear();
  }

  private getCached<T>(key: string, req$: Observable<T>): Observable<T> {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return of(entry.data as T);
    }
    return req$.pipe(tap(data => this.cache.set(key, { data, timestamp: Date.now() })));
  }

  getSummary(filters?: { desde?: string; hasta?: string }) {
    let params = new HttpParams();
    if (filters?.desde) params = params.set('desde', filters.desde);
    if (filters?.hasta) params = params.set('hasta', filters.hasta);
    const key = `summary:${filters?.desde ?? ''}:${filters?.hasta ?? ''}`;
    return this.getCached<DashboardSummary>(key, this.http.get<DashboardSummary>(`${this.url}/summary`, { params }));
  }

  getRecentActivity() {
    return this.getCached<DashboardActivity>('recent-activity', this.http.get<DashboardActivity>(`${this.url}/recent-activity`));
  }

  getPagosPorMes() {
    return this.getCached<DashboardPagosPorMes[]>('pagos-por-mes', this.http.get<DashboardPagosPorMes[]>(`${this.url}/pagos-por-mes`));
  }

  getFacturasPorEstado() {
    return this.getCached<DashboardFacturasPorEstado[]>('facturas-por-estado', this.http.get<DashboardFacturasPorEstado[]>(`${this.url}/facturas-por-estado`));
  }

  getTopProveedores(filters?: { desde?: string; hasta?: string }) {
    let params = new HttpParams();
    if (filters?.desde) params = params.set('desde', filters.desde);
    if (filters?.hasta) params = params.set('hasta', filters.hasta);
    const key = `top-proveedores:${filters?.desde ?? ''}:${filters?.hasta ?? ''}`;
    return this.getCached<DashboardTopProveedor[]>(key, this.http.get<DashboardTopProveedor[]>(`${this.url}/top-proveedores`, { params }));
  }

  getFacturasPorVencer() {
    return this.getCached<DashboardFacturaPorVencer[]>('facturas-por-vencer', this.http.get<DashboardFacturaPorVencer[]>(`${this.url}/facturas-por-vencer`));
  }
}
