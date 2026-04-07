import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FacturaService } from '../../../services/factura.service';
import { PagoService } from '../../../services/pago.service';
import { Factura, Pago } from '../../../models';
import { environment } from '../../../../environments/environment';
import { PageHeaderComponent } from '../../../shared/page-header/page-header';
import { GlassCardComponent } from '../../../shared/glass-card/glass-card';
import { GlassTableComponent, TableColumn } from '../../../shared/glass-table/glass-table';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../shared/toast/toast.service';
import { ToastComponent } from '../../../shared/toast/toast';
import { PagoModalComponent } from '../pago-modal/pago-modal';
import { ComentariosSectionComponent } from '../../../shared/comentarios-section/comentarios-section';

@Component({
  selector: 'app-factura-detail',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, PageHeaderComponent, GlassCardComponent, GlassTableComponent, StatusBadgeComponent, ConfirmDialogComponent, ToastComponent, PagoModalComponent, ComentariosSectionComponent],
  template: `
    <app-toast />
    @if (loading()) {
      <div class="card-glass" style="padding:2rem"><div class="skeleton skeleton-text-lg" style="width:40%"></div></div>
    } @else if (factura()) {
      <app-page-header [title]="'Factura ' + factura()!.numero" [subtitle]="(isNotaCredito() ? 'Nota de Credito ' : isNotaDebito() ? 'Nota de Debito ' : 'Tipo ') + factura()!.tipo + ' - ' + (factura()!.empresaProveedora?.razonSocial || '')">
        <button class="btn-secondary" (click)="goBack()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Volver
        </button>
        @if (factura()!.estado !== 'pagada' && factura()!.estado !== 'anulada') {
          <button class="btn-primary" (click)="showPago.set(true)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Registrar Pago
          </button>
        }
      </app-page-header>

      <div class="detail-grid">
        <app-glass-card title="Informacion de la Factura">
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Numero</span><span class="info-value">{{ factura()!.numero }}</span></div>
            <div class="info-item"><span class="info-label">Tipo</span><span class="info-value">{{ factura()!.tipo }}</span></div>
            <div class="info-item"><span class="info-label">Fecha</span><span class="info-value">{{ factura()!.fecha | date:'dd/MM/yyyy' }}</span></div>
            @if (factura()!.fechaVencimiento) {
              <div class="info-item"><span class="info-label">Vencimiento</span><span class="info-value">{{ factura()!.fechaVencimiento | date:'dd/MM/yyyy' }}</span></div>
            }
            <div class="info-item"><span class="info-label">Monto Neto</span><span class="info-value">{{ factura()!.montoNeto | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
            <div class="info-item"><span class="info-label">IVA</span><span class="info-value">{{ factura()!.montoIva | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
            <div class="info-item"><span class="info-label">Monto Total</span><span class="info-value">{{ factura()!.montoTotal | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
            <div class="info-item"><span class="info-label">Moneda</span><span class="info-value">{{ factura()!.moneda }}</span></div>
            <div class="info-item"><span class="info-label">Estado</span><span class="info-value"><app-status-badge [status]="factura()!.estado" /></span></div>
            @if (factura()!.empresaCliente) {
              <div class="info-item"><span class="info-label">Cliente</span><span class="info-value">{{ factura()!.empresaCliente!.razonSocial }}</span></div>
            }
            @if (isNotaCredito() || isNotaDebito()) {
              <div class="info-item">
                <span class="info-label">Tipo Documento</span>
                <span class="info-value nc-badge" [class.nd]="isNotaDebito()">{{ isNotaCredito() ? 'Nota de Credito' : 'Nota de Debito' }}</span>
              </div>
            }
            @if (factura()!.facturaRelacionada) {
              <div class="info-item">
                <span class="info-label">Factura Relacionada</span>
                <span class="info-value">
                  <a class="archivo-link" [routerLink]="['/facturas', factura()!.facturaRelacionada!._id]">{{ factura()!.facturaRelacionada!.numero }}</a>
                </span>
              </div>
            }
            @if (factura()!.archivoUrl) {
              <div class="info-item">
                <span class="info-label">Archivo</span>
                <span class="info-value">
                  <a [href]="factura()!.archivoUrl" target="_blank" rel="noopener" class="archivo-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    {{ factura()!.archivoNombre || 'Ver archivo' }}
                  </a>
                </span>
              </div>
            }
          </div>
        </app-glass-card>

        <div class="amounts-row">
          <div class="card-glass amount-card paid">
            <div class="amount-label">Pagado</div>
            <div class="amount-value">{{ factura()!.montoPagado | currency:'ARS':'ARS ':'1.2-2' }}</div>
          </div>
          <div class="card-glass amount-card pending">
            <div class="amount-label">Saldo Pendiente</div>
            <div class="amount-value">{{ factura()!.saldoPendiente | currency:'ARS':'ARS ':'1.2-2' }}</div>
          </div>
        </div>
      </div>

      <h3 class="section-title">Historial de Pagos ({{ factura()!.pagos?.length || 0 }})</h3>
      @if (factura()!.pagos?.length) {
        <app-glass-table [columns]="pagoColumns" [data]="factura()!.pagos">
          <ng-template #row let-p>
            <td>{{ p.fechaPago | date:'dd/MM/yyyy' }}</td>
            <td>{{ p.montoBase | currency:'ARS':'ARS ':'1.2-2' }}</td>
            <td>{{ p.montoNeto | currency:'ARS':'ARS ':'1.2-2' }}</td>
            <td>{{ p.medioPago }}</td>
            <td><app-status-badge [status]="p.estado" /></td>
            <td class="actions-cell">
              <button class="btn-comprobante" (click)="downloadComprobante(p)" title="Descargar comprobante">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>
              @if (p.estado !== 'anulado') {
                <button class="btn-anular" (click)="confirmAnular(p)" title="Anular pago">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              }
            </td>
          </ng-template>
        </app-glass-table>
      } @else {
        <div class="card-glass" style="padding:1.5rem;text-align:center;color:var(--color-gray-400)">Sin pagos registrados</div>
      }

      <!-- Notas internas -->
      <app-comentarios-section entidad="factura" [entidadId]="factura()?._id || ''" />
    }

    <app-pago-modal [open]="showPago()" [factura]="factura()" (close)="showPago.set(false)" (paid)="onPaid()" />

    <app-confirm-dialog
      [open]="showConfirmAnular()"
      title="Anular Pago"
      [message]="'Esta seguro de anular este pago por ' + (pagoToAnular()?.montoBase || 0 | currency:'ARS':'ARS ':'1.2-2') + '? Esta accion recalculara los montos de la factura.'"
      confirmText="Anular"
      confirmClass="danger"
      (confirm)="anularPago()"
      (cancel)="showConfirmAnular.set(false)"
    />
  `,
  styles: [`
    :host { display: block; }
    .detail-grid { margin-bottom: 1.5rem; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.125rem; }
    .info-label { font-size: 0.75rem; font-weight: 500; color: var(--color-gray-500); text-transform: uppercase; letter-spacing: 0.05em; }
    .info-value { font-size: 0.9375rem; font-weight: 500; color: var(--color-gray-900); }
    .amounts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
    .amount-card { padding: 1rem; text-align: center; }
    .amount-label { font-size: 0.75rem; font-weight: 500; color: var(--color-gray-500); text-transform: uppercase; }
    .amount-value { font-size: 1.25rem; font-weight: 700; margin-top: 0.25rem; }
    .amount-card.paid .amount-value { color: var(--color-success); }
    .amount-card.pending .amount-value { color: var(--color-warning); }
    .section-title { font-size: 1rem; font-weight: 600; color: var(--color-gray-900); margin-bottom: 0.75rem; }
    .actions-cell { text-align: right; }
    .btn-anular {
      background: none; border: none; color: var(--color-error); cursor: pointer;
      padding: 0.25rem; border-radius: var(--radius-sm);
      transition: background var(--transition-fast);
    }
    .btn-anular:hover { background: rgba(239, 68, 68, 0.1); }
    .archivo-link {
      display: inline-flex; align-items: center; gap: 0.375rem;
      color: var(--color-primary); text-decoration: none; font-weight: 500;
      transition: opacity var(--transition-fast);
    }
    .archivo-link:hover { opacity: 0.8; text-decoration: underline; }
    .nc-badge {
      display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px;
      font-size: 0.75rem; font-weight: 600; background: rgba(34,197,94,0.1); color: #16a34a;
    }
    .nc-badge.nd { background: rgba(239,68,68,0.1); color: #dc2626; }
    .btn-comprobante {
      background: none; border: none; color: var(--color-primary); cursor: pointer;
      padding: 0.25rem; border-radius: var(--radius-sm); margin-right: 0.25rem;
      transition: background var(--transition-fast);
    }
    .btn-comprobante:hover { background: rgba(99,102,241,0.1); }
  `],
})
export class FacturaDetailComponent implements OnInit {
  loading = signal(true);
  factura = signal<Factura | null>(null);
  showPago = signal(false);
  showConfirmAnular = signal(false);
  pagoToAnular = signal<Pago | null>(null);

  isNotaCredito = () => this.factura()?.tipo?.startsWith('NC-') || false;
  isNotaDebito = () => this.factura()?.tipo?.startsWith('ND-') || false;

  pagoColumns: TableColumn[] = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'montoBase', label: 'Monto Base' },
    { key: 'montoNeto', label: 'Monto Neto' },
    { key: 'medioPago', label: 'Medio' },
    { key: 'estado', label: 'Estado' },
    { key: 'acciones', label: '', width: '80px' },
  ];

  constructor(
    private route: ActivatedRoute,
    private service: FacturaService,
    private pagoService: PagoService,
    private router: Router,
    private toast: ToastService,
  ) {}

  ngOnInit() { this.loadFactura(); }

  loadFactura() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.getById(id).subscribe({
      next: (data) => { this.factura.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/facturas']); },
    });
  }

  goBack() { window.history.back(); }

  onPaid() {
    this.toast.success('Pago registrado correctamente');
    this.loadFactura();
  }

  confirmAnular(pago: Pago) {
    this.pagoToAnular.set(pago);
    this.showConfirmAnular.set(true);
  }

  downloadComprobante(pago: Pago) {
    this.pagoService.downloadComprobante(pago._id);
  }

  anularPago() {
    const pago = this.pagoToAnular();
    if (!pago) return;
    this.showConfirmAnular.set(false);
    this.pagoService.anular(pago._id).subscribe({
      next: () => {
        this.toast.success('Pago anulado correctamente');
        this.loadFactura();
      },
      error: () => this.toast.error('Error al anular el pago'),
    });
  }
}
