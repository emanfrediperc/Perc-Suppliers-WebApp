import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { DashboardSummary, DashboardActivity, DashboardPagosPorMes, DashboardFacturasPorEstado, DashboardTopProveedor, DashboardFacturaPorVencer } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private url = `${environment.apiUrl}/dashboard`;
  constructor(private http: HttpClient) {}

  getSummary(filters?: { desde?: string; hasta?: string }) {
    let params = new HttpParams();
    if (filters?.desde) params = params.set('desde', filters.desde);
    if (filters?.hasta) params = params.set('hasta', filters.hasta);
    return this.http.get<DashboardSummary>(`${this.url}/summary`, { params });
  }

  getRecentActivity() { return this.http.get<DashboardActivity>(`${this.url}/recent-activity`); }
  getPagosPorMes() { return this.http.get<DashboardPagosPorMes[]>(`${this.url}/pagos-por-mes`); }
  getFacturasPorEstado() { return this.http.get<DashboardFacturasPorEstado[]>(`${this.url}/facturas-por-estado`); }

  getTopProveedores(filters?: { desde?: string; hasta?: string }) {
    let params = new HttpParams();
    if (filters?.desde) params = params.set('desde', filters.desde);
    if (filters?.hasta) params = params.set('hasta', filters.hasta);
    return this.http.get<DashboardTopProveedor[]>(`${this.url}/top-proveedores`, { params });
  }

  getFacturasPorVencer() { return this.http.get<DashboardFacturaPorVencer[]>(`${this.url}/facturas-por-vencer`); }
}
