import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type EstadoSolicitud = 'pendiente' | 'en_proceso' | 'pago_en_proceso_perc' | 'procesado' | 'cancelado';
export type TipoSolicitud = 'manual' | 'compromiso';
export type MedioPago = 'transferencia' | 'cheque' | 'efectivo' | 'compensacion' | 'otro';

export interface SolicitudPago {
  _id: string;
  factura: any;
  empresaProveedora: any;
  tipo: TipoSolicitud;
  monto: number;
  fechaVencimiento?: string;
  nota?: string;
  medioPago: MedioPago;
  bancoOrigen?: string;
  estado: EstadoSolicitud;
  createdBy: { user: any; fecha: string };
  aprobadoPor?: { user: any; fecha: string; motivo?: string };
  ejecutadoPor?: { user: any; fecha: string; motivo?: string };
  procesadoPor?: { user: any; fecha: string };
  canceladoPor?: { user: any; fecha: string; motivo?: string };
  comprobantes: { tipo: 'perc' | 'retenciones'; url: string; key: string; nombre: string; fecha: string }[];
  historial: any[];
  reagendadoVeces: number;
  pagoGenerado?: string;
  createdAt: string;
}

export interface CreateSolicitudPagoDto {
  factura: string;
  tipo: TipoSolicitud;
  monto: number;
  fechaVencimiento?: string;
  nota?: string;
  medioPago: MedioPago;
  bancoOrigen?: string;
}

@Injectable({ providedIn: 'root' })
export class SolicitudPagoService {
  private url = `${environment.apiUrl}/solicitudes-pago`;
  constructor(private http: HttpClient) {}

  list(filter: { estado?: string; tipo?: string; factura?: string; empresaProveedora?: string; page?: number; limit?: number } = {}) {
    let params = new HttpParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<{ data: SolicitudPago[]; total: number; page: number; limit: number; totalPages: number }>(this.url, { params });
  }

  get(id: string) { return this.http.get<SolicitudPago>(`${this.url}/${id}`); }

  create(dto: CreateSolicitudPagoDto) { return this.http.post<SolicitudPago>(this.url, dto); }

  aprobar(id: string, motivo?: string) { return this.http.patch<SolicitudPago>(`${this.url}/${id}/aprobar`, { motivo }); }
  ejecutar(id: string, motivo?: string) { return this.http.patch<SolicitudPago>(`${this.url}/${id}/ejecutar`, { motivo }); }
  cancelar(id: string, motivo: string) { return this.http.patch<SolicitudPago>(`${this.url}/${id}/cancelar`, { motivo }); }
  reagendar(id: string, nuevaFecha: string, motivo?: string) {
    return this.http.patch<SolicitudPago>(`${this.url}/${id}/reagendar`, { nuevaFecha, motivo });
  }

  procesar(id: string, fields: {
    perc: File; retenciones: File;
    retencionIIBB?: number; retencionGanancias?: number; retencionIVA?: number; retencionSUSS?: number;
    otrasRetenciones?: number; referenciaPago?: string; observaciones?: string;
  }) {
    const fd = new FormData();
    fd.append('perc', fields.perc);
    fd.append('retenciones', fields.retenciones);
    if (fields.retencionIIBB != null) fd.append('retencionIIBB', String(fields.retencionIIBB));
    if (fields.retencionGanancias != null) fd.append('retencionGanancias', String(fields.retencionGanancias));
    if (fields.retencionIVA != null) fd.append('retencionIVA', String(fields.retencionIVA));
    if (fields.retencionSUSS != null) fd.append('retencionSUSS', String(fields.retencionSUSS));
    if (fields.otrasRetenciones != null) fd.append('otrasRetenciones', String(fields.otrasRetenciones));
    if (fields.referenciaPago) fd.append('referenciaPago', fields.referenciaPago);
    if (fields.observaciones) fd.append('observaciones', fields.observaciones);
    return this.http.patch<SolicitudPago>(`${this.url}/${id}/procesar`, fd);
  }
}
