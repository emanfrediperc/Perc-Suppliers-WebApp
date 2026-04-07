import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { OrdenPagoService } from '../../../services/orden-pago.service';
import { PagoService } from '../../../services/pago.service';
import { OrdenPago } from '../../../models';
import { PageHeaderComponent } from '../../../shared/page-header/page-header';
import { GlassCardComponent } from '../../../shared/glass-card/glass-card';
import { GlassTableComponent, TableColumn } from '../../../shared/glass-table/glass-table';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge';
import { ComentariosSectionComponent } from '../../../shared/comentarios-section/comentarios-section';

@Component({
  selector: 'app-orden-pago-detail',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, TitleCasePipe, PageHeaderComponent, GlassCardComponent, GlassTableComponent, StatusBadgeComponent, ComentariosSectionComponent],
  template: `
    @if (loading()) {
      <div class="card-glass" style="padding:2rem"><div class="skeleton skeleton-text-lg" style="width:40%"></div></div>
    } @else if (orden()) {
      <app-page-header [title]="'Orden ' + orden()!.numero" [subtitle]="'Proveedor: ' + (orden()!.empresaProveedora?.razonSocial || '-')">
        <button class="btn-secondary" (click)="goBack()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Volver
        </button>
      </app-page-header>

      <!-- Info general + Resumen financiero -->
      <div class="top-grid">
        <app-glass-card title="Informacion General">
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Numero</span><span class="info-value">{{ orden()!.numero }}</span></div>
            <div class="info-item"><span class="info-label">Fecha</span><span class="info-value">{{ orden()!.fecha | date:'dd/MM/yyyy' }}</span></div>
            <div class="info-item"><span class="info-label">Moneda</span><span class="info-value">{{ orden()!.moneda }}</span></div>
            <div class="info-item"><span class="info-label">Estado</span><span class="info-value"><app-status-badge [status]="orden()!.estado" /></span></div>
            @if (orden()!.finnegansId) {
              <div class="info-item"><span class="info-label">Finnegans ID</span><span class="info-value">{{ orden()!.finnegansId }}</span></div>
            }
          </div>
        </app-glass-card>

        <app-glass-card title="Resumen Financiero">
          <div class="finance-grid">
            <div class="finance-item">
              <span class="finance-label">Monto Total</span>
              <span class="finance-value">{{ orden()!.montoTotal | currency:'ARS':'ARS ':'1.2-2' }}</span>
            </div>
            <div class="finance-item">
              <span class="finance-label">Pagado</span>
              <span class="finance-value text-green">{{ orden()!.montoPagado | currency:'ARS':'ARS ':'1.2-2' }}</span>
            </div>
            <div class="finance-item">
              <span class="finance-label">Saldo Pendiente</span>
              <span class="finance-value" [class.text-red]="orden()!.saldoPendiente > 0">{{ orden()!.saldoPendiente | currency:'ARS':'ARS ':'1.2-2' }}</span>
            </div>
          </div>
          @if (orden()!.pagos?.length) {
            <div class="finance-summary">
              <div class="finance-row"><span>Total Comisiones</span><span class="text-indigo">{{ totals().totalComision | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
              <div class="finance-row"><span>Total Retenciones</span><span class="text-amber">{{ totals().totalRetenciones | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
              <div class="finance-row"><span>Total Descuentos</span><span>{{ totals().totalDescuento | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
              <div class="finance-row total"><span>Neto Transferido</span><span class="text-blue">{{ totals().totalNeto | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
            </div>
          }
        </app-glass-card>
      </div>

      <!-- Facturas -->
      <h3 class="section-title">Facturas ({{ orden()!.facturas?.length || 0 }})</h3>
      @if (orden()!.facturas?.length) {
        <app-glass-table [columns]="facturaColumns" [data]="orden()!.facturas" [clickable]="true" (rowClick)="goToFactura($event)">
          <ng-template #row let-f>
            <td class="font-medium">{{ f.numero }}</td>
            <td>{{ f.tipo }}</td>
            <td>{{ f.fecha | date:'dd/MM/yyyy' }}</td>
            <td>{{ f.empresaCliente?.razonSocial || '-' }}</td>
            <td>{{ f.montoTotal | currency:'ARS':'ARS ':'1.2-2' }}</td>
            <td>{{ f.montoPagado | currency:'ARS':'ARS ':'1.2-2' }}</td>
            <td>{{ f.saldoPendiente | currency:'ARS':'ARS ':'1.2-2' }}</td>
            <td><app-status-badge [status]="f.estado" /></td>
          </ng-template>
        </app-glass-table>
      } @else {
        <div class="card-glass empty-message">Sin facturas asociadas</div>
      }

      <!-- Pagos -->
      <h3 class="section-title" style="margin-top: 2rem">Pagos ({{ orden()!.pagos?.length || 0 }})</h3>
      @if (orden()!.pagos?.length) {
        @for (p of orden()!.pagos; track p._id) {
          <div class="card-glass pago-card">
            <div class="pago-header">
              <div class="pago-header-left">
                <span class="pago-ref">{{ p.referenciaPago || 'Pago' }}</span>
                <app-status-badge [status]="p.estado" />
              </div>
              <div class="pago-header-right">
                <button class="btn-comprobante" (click)="downloadComprobante(p._id)" title="Descargar comprobante PDF">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  PDF
                </button>
                <span class="pago-date">{{ p.fechaPago | date:'dd/MM/yyyy' }}</span>
              </div>
            </div>

            <div class="pago-amounts">
              <div class="pago-amount-item">
                <span class="pago-amount-label">Monto Base</span>
                <span class="pago-amount-value">{{ p.montoBase | currency:'ARS':'ARS ':'1.2-2' }}</span>
              </div>
              <div class="pago-amount-item">
                <span class="pago-amount-label">Medio de Pago</span>
                <span class="pago-amount-value">{{ p.medioPago | titlecase }}</span>
              </div>
              @if (p.convenioAplicado) {
                <div class="pago-amount-item">
                  <span class="pago-amount-label">Convenio</span>
                  <span class="pago-amount-value">{{ p.convenioAplicado.nombre }}</span>
                </div>
              }
              <div class="pago-amount-item highlight">
                <span class="pago-amount-label">Neto Transferido</span>
                <span class="pago-amount-value font-medium text-blue">{{ p.montoNeto | currency:'ARS':'ARS ':'1.2-2' }}</span>
              </div>
            </div>

            <!-- Desglose retenciones y comisiones -->
            <div class="pago-desglose">
              <span class="desglose-title">Desglose</span>
              <div class="desglose-grid">
                @if (p.comision) {
                  <div class="desglose-item"><span>Comision ({{ p.porcentajeComision }}%)</span><span class="text-indigo">-{{ p.comision | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
                }
                @if (p.descuento) {
                  <div class="desglose-item"><span>Descuento ({{ p.porcentajeDescuento }}%)</span><span>-{{ p.descuento | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
                }
                @if (p.retencionIIBB) {
                  <div class="desglose-item"><span>Ret. IIBB</span><span class="text-amber">-{{ p.retencionIIBB | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
                }
                @if (p.retencionGanancias) {
                  <div class="desglose-item"><span>Ret. Ganancias</span><span class="text-amber">-{{ p.retencionGanancias | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
                }
                @if (p.retencionIVA) {
                  <div class="desglose-item"><span>Ret. IVA</span><span class="text-amber">-{{ p.retencionIVA | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
                }
                @if (p.retencionSUSS) {
                  <div class="desglose-item"><span>Ret. SUSS</span><span class="text-amber">-{{ p.retencionSUSS | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
                }
                @if (p.otrasRetenciones) {
                  <div class="desglose-item"><span>Otras Retenciones</span><span class="text-amber">-{{ p.otrasRetenciones | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
                }
              </div>
            </div>

            @if (p.observaciones) {
              <div class="pago-obs">{{ p.observaciones }}</div>
            }
          </div>
        }
      } @else {
        <div class="card-glass empty-message">Sin pagos registrados</div>
      }

      <!-- Notas internas -->
      <app-comentarios-section entidad="orden-pago" [entidadId]="orden()?._id || ''" />
    }
  `,
  styles: [`
    :host { display: block; }
    .top-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
    @media (max-width: 768px) { .top-grid { grid-template-columns: 1fr; } }

    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .info-label { font-size: 0.75rem; font-weight: 500; color: var(--color-gray-500); text-transform: uppercase; letter-spacing: 0.05em; }
    .info-value { font-size: 0.9375rem; font-weight: 500; color: var(--color-gray-900); }

    .finance-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; }
    .finance-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .finance-label { font-size: 0.75rem; font-weight: 500; color: var(--color-gray-500); text-transform: uppercase; letter-spacing: 0.05em; }
    .finance-value { font-size: 1.125rem; font-weight: 700; color: var(--color-gray-900); }

    .finance-summary { border-top: 1px solid var(--color-gray-200); padding-top: 0.75rem; display: flex; flex-direction: column; gap: 0.375rem; }
    .finance-row { display: flex; justify-content: space-between; font-size: 0.8125rem; color: var(--color-gray-600); }
    .finance-row.total { border-top: 1px solid var(--color-gray-200); padding-top: 0.5rem; margin-top: 0.25rem; font-weight: 600; color: var(--color-gray-900); }

    .section-title { font-size: 1rem; font-weight: 600; color: var(--color-gray-900); margin-bottom: 0.75rem; }
    .empty-message { padding: 1.5rem; text-align: center; color: var(--color-gray-400); }
    .font-medium { font-weight: 500; }

    .text-green { color: #16a34a; }
    .text-red { color: #dc2626; }
    .text-indigo { color: var(--color-indigo-600); }
    .text-amber { color: #d97706; }
    .text-blue { color: #2563eb; }

    /* Pago card */
    .pago-card { padding: 1.25rem; margin-bottom: 0.75rem; }
    .pago-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-gray-200); }
    .pago-header-left { display: flex; align-items: center; gap: 0.75rem; }
    .pago-ref { font-weight: 600; font-size: 0.9375rem; color: var(--color-gray-900); }
    .pago-date { font-size: 0.8125rem; color: var(--color-gray-500); }

    .pago-amounts { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .pago-amount-item { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.5rem 0.75rem; background: rgba(99, 102, 241, 0.03); border-radius: 8px; }
    .pago-amount-item.highlight { background: rgba(99, 102, 241, 0.06); border: 1px solid rgba(99, 102, 241, 0.1); }
    .pago-amount-label { font-size: 0.7rem; font-weight: 500; color: var(--color-gray-500); text-transform: uppercase; letter-spacing: 0.05em; }
    .pago-amount-value { font-size: 0.9375rem; font-weight: 500; color: var(--color-gray-900); }

    .pago-desglose { background: var(--glass-bg); border-radius: 8px; padding: 0.75rem; }
    .desglose-title { font-size: 0.7rem; font-weight: 600; color: var(--color-gray-500); text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 0.5rem; }
    .desglose-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.375rem; }
    .desglose-item { display: flex; justify-content: space-between; align-items: center; padding: 0.25rem 0.5rem; font-size: 0.8125rem; color: var(--color-gray-600); }

    .pago-obs { margin-top: 0.75rem; font-size: 0.8125rem; color: var(--color-gray-500); font-style: italic; padding-top: 0.5rem; border-top: 1px dashed var(--color-gray-200); }
    .pago-header-right { display: flex; align-items: center; gap: 0.75rem; }
    .btn-comprobante {
      display: inline-flex; align-items: center; gap: 0.25rem;
      background: none; border: 1px solid var(--color-gray-200); color: var(--color-primary);
      cursor: pointer; padding: 0.25rem 0.5rem; border-radius: var(--radius-sm);
      font-size: 0.75rem; font-weight: 500; transition: all var(--transition-fast);
    }
    .btn-comprobante:hover { background: rgba(99,102,241,0.08); border-color: var(--color-primary); }
  `],
})
export class OrdenPagoDetailComponent implements OnInit {
  loading = signal(true);
  orden = signal<OrdenPago | null>(null);

  facturaColumns: TableColumn[] = [
    { key: 'numero', label: 'Numero' },
    { key: 'tipo', label: 'Tipo', width: '6%' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'montoTotal', label: 'Monto Total' },
    { key: 'montoPagado', label: 'Pagado' },
    { key: 'saldoPendiente', label: 'Saldo Pend.' },
    { key: 'estado', label: 'Estado' },
  ];

  totals = computed(() => {
    const pagos = this.orden()?.pagos || [];
    return {
      totalComision: pagos.reduce((sum, p) => sum + (p.comision || 0), 0),
      totalDescuento: pagos.reduce((sum, p) => sum + (p.descuento || 0), 0),
      totalRetenciones: pagos.reduce((sum, p) => sum + (p.retencionIIBB || 0) + (p.retencionGanancias || 0) + (p.retencionIVA || 0) + (p.retencionSUSS || 0) + (p.otrasRetenciones || 0), 0),
      totalNeto: pagos.reduce((sum, p) => sum + (p.montoNeto || 0), 0),
    };
  });

  constructor(private route: ActivatedRoute, private service: OrdenPagoService, private pagoService: PagoService, private router: Router) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.getById(id).subscribe({
      next: (data) => { this.orden.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/ordenes-pago']); },
    });
  }

  goBack() { this.router.navigate(['/ordenes-pago']); }
  goToFactura(f: any) { this.router.navigate(['/facturas', f._id]); }
  downloadComprobante(pagoId: string) { this.pagoService.downloadComprobante(pagoId); }
}
