import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  ReportePagosPorPeriodo, ReportePagosPorProveedor, ReporteFacturasVencimiento,
  ReporteRetencionesAcumuladas, ReporteComisionesDescuentos, ReporteEstadoCuenta, ReporteFacturasPorTipo,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private url = `${environment.apiUrl}/reportes`;
  constructor(private http: HttpClient) {}

  private buildParams(filters?: { desde?: string; hasta?: string; empresaProveedora?: string; convenio?: string }): HttpParams {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(k => {
        const val = (filters as any)[k];
        if (val != null && val !== '') params = params.set(k, val);
      });
    }
    return params;
  }

  getPagosPorPeriodo(filters?: any) {
    return this.http.get<ReportePagosPorPeriodo>(`${this.url}/pagos-por-periodo`, { params: this.buildParams(filters) });
  }

  getPagosPorProveedor(filters?: any) {
    return this.http.get<ReportePagosPorProveedor>(`${this.url}/pagos-por-proveedor`, { params: this.buildParams(filters) });
  }

  getFacturasVencimiento(filters?: any) {
    return this.http.get<ReporteFacturasVencimiento>(`${this.url}/facturas-vencimiento`, { params: this.buildParams(filters) });
  }

  getRetencionesAcumuladas(filters?: any) {
    return this.http.get<ReporteRetencionesAcumuladas>(`${this.url}/retenciones-acumuladas`, { params: this.buildParams(filters) });
  }

  getComisionesDescuentos(filters?: any) {
    return this.http.get<ReporteComisionesDescuentos>(`${this.url}/comisiones-descuentos`, { params: this.buildParams(filters) });
  }

  getEstadoCuentaProveedor(filters?: any) {
    return this.http.get<ReporteEstadoCuenta>(`${this.url}/estado-cuenta-proveedor`, { params: this.buildParams(filters) });
  }

  getFacturasPorTipo(filters?: any) {
    return this.http.get<ReporteFacturasPorTipo>(`${this.url}/facturas-por-tipo`, { params: this.buildParams(filters) });
  }

  getEstadoCuentaCompleto(empresaProveedoraId: string) {
    return this.http.get<any>(`${this.url}/estado-cuenta-completo/${empresaProveedoraId}`);
  }
}
