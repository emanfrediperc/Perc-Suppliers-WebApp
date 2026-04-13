import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../services/reporte.service';
import { EmpresaProveedoraService } from '../../services/empresa-proveedora.service';
import { ExportService } from '../../services/export.service';
import { EmpresaProveedora } from '../../models';
import { PageHeaderComponent } from '../../shared/page-header/page-header';
import { GlassCardComponent } from '../../shared/glass-card/glass-card';
import { GlassTableComponent, TableColumn } from '../../shared/glass-table/glass-table';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge';
import { SkeletonTableComponent } from '../../shared/skeleton-table/skeleton-table';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state';

@Component({
  selector: 'app-estado-cuenta',
  standalone: true,
  imports: [
    CurrencyPipe, DatePipe, FormsModule,
    PageHeaderComponent, GlassCardComponent, GlassTableComponent,
    StatusBadgeComponent, SkeletonTableComponent, EmptyStateComponent,
  ],
  template: `
    <app-page-header title="Estado de Cuenta" subtitle="Estado de cuenta por proveedor" />

    <div class="selector-bar card-glass">
      <label>Proveedor:</label>
      <select [(ngModel)]="selectedProveedor" (ngModelChange)="onProveedorChange($event)">
        <option value="">Seleccionar proveedor...</option>
        @for (p of proveedores(); track p._id) {
          <option [value]="p._id">{{ p.razonSocial }} ({{ p.cuit }})</option>
        }
      </select>
      <button class="btn-export" [disabled]="!selectedProveedor" (click)="exportar()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Exportar Excel
      </button>
    </div>

    @if (loading()) {
      <app-skeleton-table [rows]="5" [cols]="4" />
    } @else if (data()) {
      <!-- Summary cards -->
      <div class="summary-grid">
        <app-glass-card title="Total Facturado">
          <p class="summary-value">{{ data()!.totales.facturado | currency:'ARS':'ARS ':'1.2-2' }}</p>
        </app-glass-card>
        <app-glass-card title="Total Pagado">
          <p class="summary-value text-green">{{ data()!.totales.pagado | currency:'ARS':'ARS ':'1.2-2' }}</p>
        </app-glass-card>
        <app-glass-card title="Saldo Pendiente">
          <p class="summary-value" [class.text-red]="data()!.totales.saldoPendiente > 0">{{ data()!.totales.saldoPendiente | currency:'ARS':'ARS ':'1.2-2' }}</p>
        </app-glass-card>
        <app-glass-card title="Total NC/ND">
          <p class="summary-value text-amber">{{ data()!.totales.totalNC | currency:'ARS':'ARS ':'1.2-2' }}</p>
        </app-glass-card>
      </div>

      <!-- Proveedor info -->
      @if (data()!.proveedor) {
        <app-glass-card title="Datos del Proveedor">
          <div class="proveedor-info">
            <div class="info-item"><span class="info-label">Razon Social</span><span class="info-value">{{ data()!.proveedor.razonSocial }}</span></div>
            <div class="info-item"><span class="info-label">CUIT</span><span class="info-value">{{ data()!.proveedor.cuit }}</span></div>
            @if (data()!.proveedor.condicionIva) {
              <div class="info-item"><span class="info-label">Condicion IVA</span><span class="info-value">{{ data()!.proveedor.condicionIva }}</span></div>
            }
            @if (data()!.proveedor.email) {
              <div class="info-item"><span class="info-label">Email</span><span class="info-value">{{ data()!.proveedor.email }}</span></div>
            }
            @if (data()!.proveedor.telefono) {
              <div class="info-item"><span class="info-label">Telefono</span><span class="info-value">{{ data()!.proveedor.telefono }}</span></div>
            }
            @if (data()!.proveedor.datosBancarios?.cbu) {
              <div class="info-item"><span class="info-label">CBU</span><span class="info-value">{{ data()!.proveedor.datosBancarios.cbu }}</span></div>
            }
          </div>
        </app-glass-card>
      }

      <!-- Facturas table -->
      <h3 class="section-title">Facturas ({{ data()!.facturas.length }})</h3>
      @if (data()!.facturas.length) {
        <app-glass-table [columns]="facturaColumns" [data]="data()!.facturas">
          <ng-template #row let-f>
            <td class="font-medium">{{ f.numero }}</td>
            <td>{{ f.tipo }}</td>
            <td>{{ f.empresaCliente?.razonSocial || '-' }}</td>
            <td>{{ f.fecha | date:'dd/MM/yyyy' }}</td>
            <td>{{ f.fechaVencimiento | date:'dd/MM/yyyy' }}</td>
            <td>{{ f.montoTotal | currency:'ARS':'ARS ':'1.2-2' }}</td>
            <td>{{ f.montoPagado | currency:'ARS':'ARS ':'1.2-2' }}</td>
            <td>{{ f.saldoPendiente | currency:'ARS':'ARS ':'1.2-2' }}</td>
            <td><app-status-badge [status]="f.estado" /></td>
          </ng-template>
        </app-glass-table>
      } @else {
        <app-empty-state title="Sin facturas" message="No hay facturas registradas para este proveedor" />
      }

      <!-- Pagos table -->
      <h3 class="section-title">Pagos ({{ data()!.pagos.length }})</h3>
      @if (data()!.pagos.length) {
        <app-glass-table [columns]="pagoColumns" [data]="data()!.pagos">
          <ng-template #row let-p>
            <td>{{ p.fechaPago | date:'dd/MM/yyyy' }}</td>
            <td class="font-medium">{{ p.factura?.numero || '-' }}</td>
            <td>{{ p.montoBase | currency:'ARS':'ARS ':'1.2-2' }}</td>
            <td>{{ p.montoNeto | currency:'ARS':'ARS ':'1.2-2' }}</td>
            <td>{{ p.medioPago }}</td>
            <td>{{ p.referenciaPago || '-' }}</td>
            <td><app-status-badge [status]="p.estado" /></td>
          </ng-template>
        </app-glass-table>
      } @else {
        <app-empty-state title="Sin pagos" message="No hay pagos registrados para este proveedor" />
      }

      <!-- NC/ND table -->
      @if (data()!.notasCredito.length) {
        <h3 class="section-title">Notas de Credito / Debito ({{ data()!.notasCredito.length }})</h3>
        <app-glass-table [columns]="ncColumns" [data]="data()!.notasCredito">
          <ng-template #row let-nc>
            <td class="font-medium">{{ nc.numero }}</td>
            <td>{{ nc.tipo }}</td>
            <td>{{ nc.fecha | date:'dd/MM/yyyy' }}</td>
            <td>{{ nc.montoTotal | currency:'ARS':'ARS ':'1.2-2' }}</td>
            <td>{{ nc.facturaRelacionada?.numero || '-' }}</td>
          </ng-template>
        </app-glass-table>
      }
    } @else if (!loading() && selectedProveedor) {
      <app-empty-state title="Sin datos" message="No se encontraron datos para este proveedor" />
    } @else if (!loading() && !selectedProveedor) {
      <app-empty-state title="Seleccione un proveedor" message="Elija un proveedor del listado para ver su estado de cuenta" />
    }
  `,
  styles: [`
    :host { display: block; }
    .selector-bar { display: flex; align-items: center; gap: 1rem; padding: 1rem; margin-bottom: 1.5rem; }
    .selector-bar label { font-weight: 500; font-size: 0.875rem; color: var(--color-gray-700); white-space: nowrap; }
    .selector-bar select { flex: 1; max-width: 400px; padding: 0.5rem 0.75rem; border: 1px solid var(--color-gray-200); border-radius: var(--radius-md); font-size: 0.875rem; background: var(--glass-bg); color: var(--color-gray-900); }
    .btn-export { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.875rem; border: 1px solid var(--color-gray-200); border-radius: var(--radius-md); background: var(--card-bg); color: var(--color-gray-700); font-size: 0.8125rem; font-weight: 500; cursor: pointer; margin-left: auto; }
    .btn-export:hover:not(:disabled) { background: var(--glass-bg); border-color: var(--color-primary); color: var(--color-primary); }
    .btn-export:disabled { opacity: 0.4; cursor: not-allowed; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .summary-value { font-size: 1.25rem; font-weight: 700; color: var(--color-gray-900); margin: 0; }
    .section-title { font-size: 1rem; font-weight: 600; color: var(--color-gray-900); margin: 1.5rem 0 0.75rem; }
    .proveedor-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.125rem; }
    .info-label { font-size: 0.75rem; font-weight: 500; color: var(--color-gray-500); text-transform: uppercase; letter-spacing: 0.05em; }
    .info-value { font-size: 0.9375rem; font-weight: 500; color: var(--color-gray-900); }
    .font-medium { font-weight: 500; }
    .text-green { color: #16a34a; }
    .text-red { color: #dc2626; }
    .text-amber { color: #d97706; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadoCuentaComponent implements OnInit {
  proveedores = signal<EmpresaProveedora[]>([]);
  selectedProveedor = '';
  loading = signal(false);
  data = signal<any>(null);

  facturaColumns: TableColumn[] = [
    { key: 'numero', label: 'Numero' },
    { key: 'tipo', label: 'Tipo', width: '6%' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'fechaVencimiento', label: 'Vencimiento' },
    { key: 'montoTotal', label: 'Monto Total' },
    { key: 'montoPagado', label: 'Pagado' },
    { key: 'saldoPendiente', label: 'Saldo' },
    { key: 'estado', label: 'Estado' },
  ];

  pagoColumns: TableColumn[] = [
    { key: 'fechaPago', label: 'Fecha' },
    { key: 'factura', label: 'Factura' },
    { key: 'montoBase', label: 'Monto Base' },
    { key: 'montoNeto', label: 'Monto Neto' },
    { key: 'medioPago', label: 'Medio' },
    { key: 'referenciaPago', label: 'Referencia' },
    { key: 'estado', label: 'Estado' },
  ];

  ncColumns: TableColumn[] = [
    { key: 'numero', label: 'Numero' },
    { key: 'tipo', label: 'Tipo', width: '8%' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'montoTotal', label: 'Monto' },
    { key: 'facturaRelacionada', label: 'Factura Original' },
  ];

  constructor(
    private reporteService: ReporteService,
    private empresaProveedoraService: EmpresaProveedoraService,
    private exportService: ExportService,
  ) {}

  exportar() {
    if (!this.selectedProveedor) return;
    this.exportService.download('reportes/estado-cuenta-proveedor/export', 'xlsx', {
      empresaProveedora: this.selectedProveedor,
    });
  }

  ngOnInit() {
    this.empresaProveedoraService.getAll({ limit: 200 }).subscribe({
      next: (res) => this.proveedores.set(res.data),
    });
  }

  onProveedorChange(proveedorId: string) {
    if (!proveedorId) {
      this.data.set(null);
      return;
    }
    this.loading.set(true);
    this.data.set(null);
    this.reporteService.getEstadoCuentaCompleto(proveedorId).subscribe({
      next: (res) => { this.data.set(res); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }
}
