import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type EstadoSolicitud = 'pendiente' | 'en_proceso' | 'pago_en_proceso_perc' | 'procesado' | 'cancelado';
export type TipoSolicitud = 'manual' | 'compromiso';
export type MedioPago = 'transferencia' | 'cheque' | 'efectivo' | 'compensacion' | 'otro';

export interface SolicitudPago {
  _id: string;
  factura?: any;
  ordenPago?: any;
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
  factura?: string;
  ordenPago?: string;
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
  private _pendingCount = signal(0);
  private destroyRef = inject(DestroyRef);
  pendingCount = this._pendingCount.asReadonly();

  constructor(private http: HttpClient) {}

  loadPendingCount() {
    this.http.get<{ count: number; estado: string | null }>(`${this.url}/pending-count`).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (r) => this._pendingCount.set(r.count),
      error: () => this._pendingCount.set(0),
    });
  }

  list(filter: { estado?: string; tipo?: string; factura?: string; empresaProveedora?: string; page?: number; limit?: number } = {}) {
    let params = new HttpParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<{ data: SolicitudPago[]; total: number; page: number; limit: number; totalPages: number }>(this.url, { params });
  }

  get(id: string) { return this.http.get<SolicitudPago>(`${this.url}/${id}`); }

  verificarIntegridad(id: string) {
    return this.http.get<{ valid: boolean; brokenAt: number | null; total: number; conTsa: number }>(`${this.url}/${id}/verificar-integridad`);
  }

  getComprobanteUrl(id: string, tipo: 'perc' | 'retenciones') {
    return this.http.get<{ url: string; nombre: string }>(`${this.url}/${id}/comprobante/${tipo}`);
  }

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
