import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { PagoProgramadoService } from '../../services/pago-programado.service';
import { ExportService } from '../../services/export.service';
import { PagoProgramado } from '../../models';
import { PageHeaderComponent } from '../../shared/page-header/page-header';
import { GlassTableComponent, TableColumn } from '../../shared/glass-table/glass-table';
import { GlassCardComponent } from '../../shared/glass-card/glass-card';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge';
import { PaginationComponent } from '../../shared/pagination/pagination';
import { SkeletonTableComponent } from '../../shared/skeleton-table/skeleton-table';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';
import { ToastService } from '../../shared/toast/toast.service';
import { ToastComponent } from '../../shared/toast/toast';

@Component({
  selector: 'app-pagos-programados-list',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, PageHeaderComponent, GlassTableComponent, GlassCardComponent, StatusBadgeComponent, PaginationComponent, SkeletonTableComponent, EmptyStateComponent, ConfirmDialogComponent, ToastComponent],
  template: `
    <app-toast />
    <app-page-header title="Pagos Programados" subtitle="Pagos agendados para ejecucion automatica">
      <button class="btn-secondary" (click)="exportar('xlsx')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Excel
      </button>
    </app-page-header>

    <!-- Proximos pagos -->
    @if (proximos().length) {
      <app-glass-card title="Proximos 7 dias">
        <div class="proximos-grid">
          @for (pp of proximos(); track pp._id) {
            <div class="proximo-item">
              <div class="proximo-fecha">{{ pp.fechaProgramada | date:'dd/MM/yyyy HH:mm' }}</div>
              <div class="proximo-info">
                <span class="proximo-proveedor">{{ pp.ordenPago?.empresaProveedora?.razonSocial || 'Orden' }}</span>
                <span class="proximo-monto">{{ pp.montoBase | currency:'ARS':'ARS ':'1.2-2' }}</span>
              </div>
              <div class="proximo-medio">{{ pp.medioPago }}</div>
            </div>
          }
        </div>
      </app-glass-card>
    }

    @if (loading()) {
      <app-skeleton-table [rows]="6" [cols]="6" />
    } @else if (!pagos().length) {
      <app-empty-state title="Sin pagos programados" message="Los pagos programados se crean desde el detalle de una orden de pago" />
    } @else {
      <app-glass-table [columns]="columns" [data]="pagos()">
        <ng-template #row let-pp>
          <td>{{ pp.fechaProgramada | date:'dd/MM/yyyy HH:mm' }}</td>
          <td>{{ pp.ordenPago?.empresaProveedora?.razonSocial || '-' }}</td>
          <td>{{ pp.montoBase | currency:'ARS':'ARS ':'1.2-2' }}</td>
          <td>{{ pp.medioPago }}</td>
          <td><app-status-badge [status]="pp.estado" /></td>
          <td class="actions-cell">
            @if (pp.estado === 'programado') {
              <button class="btn-cancel" (click)="confirmCancelar(pp)" title="Cancelar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            }
            @if (pp.estado === 'fallido' && pp.errorMensaje) {
              <span class="error-hint" [title]="pp.errorMensaje">?</span>
            }
          </td>
        </ng-template>
      </app-glass-table>
      <app-pagination
        [currentPage]="page()"
        [totalPages]="totalPages()"
        [totalItems]="total()"
        [pageSize]="limit()"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)"
      />
    }

    <app-confirm-dialog
      [open]="showConfirmCancel()"
      title="Cancelar Pago Programado"
      message="Esta seguro de cancelar este pago programado? No se ejecutara en la fecha prevista."
      confirmText="Cancelar Pago"
      confirmClass="danger"
      (confirm)="cancelar()"
      (cancel)="showConfirmCancel.set(false)"
    />
  `,
  styles: [`
    :host { display: block; }
    .proximos-grid { display: flex; flex-direction: column; gap: 0.5rem; }
    .proximo-item {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); background: rgba(99,102,241,0.04);
    }
    .proximo-fecha { font-size: 0.8125rem; font-weight: 600; color: var(--color-primary); min-width: 140px; }
    .proximo-info { flex: 1; display: flex; justify-content: space-between; }
    .proximo-proveedor { font-size: 0.8125rem; color: var(--color-gray-700); }
    .proximo-monto { font-size: 0.875rem; font-weight: 600; color: var(--color-gray-900); }
    .proximo-medio { font-size: 0.75rem; color: var(--color-gray-500); min-width: 100px; text-align: right; }
    .actions-cell { text-align: right; }
    .btn-cancel {
      background: none; border: none; color: var(--color-error); cursor: pointer;
      padding: 0.25rem; border-radius: var(--radius-sm); transition: background var(--transition-fast);
    }
    .btn-cancel:hover { background: rgba(239,68,68,0.1); }
    .error-hint {
      display: inline-flex; align-items: center; justify-content: center;
      width: 20px; height: 20px; border-radius: 50%; background: rgba(239,68,68,0.1);
      color: var(--color-error); font-size: 0.75rem; font-weight: 700; cursor: help;
    }
    app-glass-card { margin-bottom: 1.5rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagosProgramadosListComponent implements OnInit {
  loading = signal(true);
  pagos = signal<PagoProgramado[]>([]);
  proximos = signal<PagoProgramado[]>([]);
  page = signal(1);
  limit = signal(5);
  total = signal(0);
  totalPages = signal(1);
  showConfirmCancel = signal(false);
  ppToCancel = signal<PagoProgramado | null>(null);

  columns: TableColumn[] = [
    { key: 'fecha', label: 'Fecha Programada', width: '18%' },
    { key: 'proveedor', label: 'Proveedor', width: '25%' },
    { key: 'monto', label: 'Monto', width: '18%' },
    { key: 'medio', label: 'Medio', width: '12%' },
    { key: 'estado', label: 'Estado', width: '15%' },
    { key: 'acciones', label: '', width: '80px' },
  ];

  constructor(
    private service: PagoProgramadoService,
    private router: Router,
    private toast: ToastService,
    private exportService: ExportService,
  ) {}

  exportar(formato: 'xlsx' | 'csv') {
    this.exportService.download('pagos-programados/export', formato);
  }

  ngOnInit() {
    this.load();
    this.loadProximos();
  }

  load() {
    this.loading.set(true);
    this.service.getAll({ page: this.page(), limit: this.limit() }).subscribe({
      next: (res) => { this.pagos.set(res.data); this.totalPages.set(res.totalPages); this.total.set((res as any).total ?? res.data.length); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadProximos() {
    this.service.getProximos(7).subscribe({
      next: (data) => this.proximos.set(data),
    });
  }

  onPageChange(p: number) { this.page.set(p); this.load(); }
  onPageSizeChange(size: number) { this.limit.set(size); this.page.set(1); this.load(); }

  confirmCancelar(pp: PagoProgramado) {
    this.ppToCancel.set(pp);
    this.showConfirmCancel.set(true);
  }

  cancelar() {
    const pp = this.ppToCancel();
    if (!pp) return;
    this.showConfirmCancel.set(false);
    this.service.cancelar(pp._id).subscribe({
      next: () => { this.toast.success('Pago programado cancelado'); this.load(); this.loadProximos(); },
      error: () => this.toast.error('Error al cancelar'),
    });
  }
}
