import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdenPagoService } from '../../../services/orden-pago.service';
import { EmpresaProveedoraService } from '../../../services/empresa-proveedora.service';
import { EmpresaClienteService } from '../../../services/empresa-cliente.service';
import { OrdenPago, EmpresaProveedora, EmpresaCliente } from '../../../models';
import { PageHeaderComponent } from '../../../shared/page-header/page-header';
import { FilterBarComponent } from '../../../shared/filter-bar/filter-bar';
import { GlassTableComponent, TableColumn } from '../../../shared/glass-table/glass-table';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge';
import { PaginationComponent } from '../../../shared/pagination/pagination';
import { SkeletonTableComponent } from '../../../shared/skeleton-table/skeleton-table';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state';
import { ToastService } from '../../../shared/toast/toast.service';
import { ToastComponent } from '../../../shared/toast/toast';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog';
import { ExportService } from '../../../services/export.service';

@Component({
  selector: 'app-ordenes-pago-list',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, PageHeaderComponent, FilterBarComponent, GlassTableComponent, StatusBadgeComponent, PaginationComponent, SkeletonTableComponent, EmptyStateComponent, ToastComponent, ConfirmDialogComponent],
  template: `
    <app-toast />
    <app-page-header title="Ordenes de Pago" subtitle="Gestion de ordenes de pago de Finnegans">
      <button class="btn-secondary" (click)="exportar('xlsx')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Excel
      </button>
      <button class="btn-secondary" (click)="exportar('csv')">CSV</button>
      <button class="btn-primary" (click)="sync()" [disabled]="syncing()">
        @if (syncing()) { <span class="spinner"></span> }
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        Sync Finnegans
      </button>
    </app-page-header>

    <app-filter-bar placeholder="Buscar por numero..." (search)="onSearch($event)">
      <select class="filter-select" [(ngModel)]="proveedorFilter" (ngModelChange)="onFilterChange()">
        <option value="">Todos los proveedores</option>
        @for (e of proveedores(); track e._id) {
          <option [value]="e._id">{{ e.razonSocial }}</option>
        }
      </select>
      <select class="filter-select" [(ngModel)]="clienteFilter" (ngModelChange)="onFilterChange()">
        <option value="">Todos los clientes</option>
        @for (e of clientes(); track e._id) {
          <option [value]="e._id">{{ e.razonSocial }}</option>
        }
      </select>
      <select class="filter-select" [(ngModel)]="estadoFilter" (ngModelChange)="onFilterChange()">
        <option value="">Todos los estados</option>
        <option value="pendiente">Pendiente</option>
        <option value="parcial">Parcial</option>
        <option value="pagada">Pagada</option>
        <option value="anulada">Anulada</option>
        <option value="esperando_aprobacion">Esperando aprobación</option>
        <option value="rechazado">Rechazado</option>
      </select>
      <input type="date" class="filter-date" [(ngModel)]="fechaDesde" (ngModelChange)="onFilterChange()" placeholder="Desde" />
      <input type="date" class="filter-date" [(ngModel)]="fechaHasta" (ngModelChange)="onFilterChange()" placeholder="Hasta" />
      @if (hasFilters()) {
        <button class="btn-clear-filters" (click)="clearFilters()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Limpiar filtros
        </button>
      }
    </app-filter-bar>

    @if (loading()) {
      <app-skeleton-table [rows]="6" [cols]="6" />
    } @else if (!ordenes().length) {
      <app-empty-state title="Sin ordenes de pago" message="Sincroniza con Finnegans para importar ordenes" />
    } @else {
      <app-glass-table [columns]="columns" [data]="ordenes()" [clickable]="true" (rowClick)="goToDetail($event)">
        <ng-template #row let-orden>
          <td class="checkbox-cell" (click)="$event.stopPropagation()">
            <input type="checkbox" [checked]="isSelected(orden._id)" (change)="toggleSelect(orden)" />
          </td>
          <td>{{ orden.numero }}</td>
          <td>{{ orden.fecha | date:'dd/MM/yyyy' }}</td>
          <td>{{ orden.empresaProveedora?.razonSocial || '-' }}</td>
          <td>{{ getCliente(orden) }}</td>
          <td>{{ orden.montoTotal | currency:'ARS':'ARS ':'1.2-2' }}</td>
          <td>{{ orden.montoTotal - (orden.montoPagado || 0) | currency:'ARS':'ARS ':'1.2-2' }}</td>
          <td><app-status-badge [status]="orden.estado" /></td>
        </ng-template>
      </app-glass-table>
      <app-pagination [currentPage]="page()" [totalPages]="totalPages()" (pageChange)="onPageChange($event)" />
    }

    @if (selected().length) {
      <div class="batch-bar">
        <span>{{ selected().length }} orden(es) seleccionada(s) — Total: {{ selectedTotal() | currency:'ARS':'ARS ':'1.2-2' }}</span>
        <div class="batch-actions">
          <button class="btn-secondary" (click)="clearSelection()">Limpiar</button>
          <button class="btn-primary" (click)="showBatchConfirm.set(true)" [disabled]="batchProcessing()">
            @if (batchProcessing()) { <span class="spinner"></span> }
            Pagar Lote
          </button>
        </div>
      </div>
    }

    <app-confirm-dialog
      [open]="showBatchConfirm()"
      title="Pagar Lote"
      [message]="'Confirma el pago de ' + selected().length + ' ordenes por un total de ' + (selectedTotal() | currency:'ARS':'ARS ':'1.2-2') + '? Se usara transferencia como medio de pago.'"
      confirmText="Confirmar Pago"
      (confirm)="executeBatch()"
      (cancel)="showBatchConfirm.set(false)"
    />
  `,
  styles: [`
    :host { display: block; }
    .checkbox-cell { width: 40px; text-align: center; }
    .checkbox-cell input { cursor: pointer; width: 16px; height: 16px; accent-color: var(--color-primary); }
    .filter-select, .filter-date {
      padding: 0.625rem 0.875rem; border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-md); font-size: 1rem;
      background: var(--glass-bg); backdrop-filter: blur(10px);
      color: var(--color-gray-900); min-width: 180px;
    }
    .filter-date { min-width: 160px; }
    .btn-clear-filters {
      display: flex; align-items: center; gap: 0.375rem;
      padding: 0.5rem 0.75rem; border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-md); font-size: 0.8125rem; font-weight: 500;
      background: transparent; color: var(--color-gray-500); cursor: pointer;
      transition: all var(--transition-fast); white-space: nowrap;
    }
    .btn-clear-filters:hover { background: var(--color-gray-50); color: var(--color-gray-700); border-color: var(--color-gray-300); }
    .batch-bar {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.75rem 2rem; background: var(--color-gray-900); color: white;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.2); font-size: 0.875rem;
    }
    .batch-actions { display: flex; gap: 0.5rem; }
    .batch-bar .btn-secondary { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); }
    .batch-bar .btn-secondary:hover { background: rgba(255,255,255,0.2); }
    .batch-bar .btn-primary { padding: 0.5rem 1.25rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenesPagoListComponent implements OnInit {
  loading = signal(true);
  syncing = signal(false);
  ordenes = signal<OrdenPago[]>([]);
  page = signal(1);
  totalPages = signal(1);
  search = '';

  proveedores = signal<EmpresaProveedora[]>([]);
  clientes = signal<EmpresaCliente[]>([]);
  proveedorFilter = '';
  clienteFilter = '';
  estadoFilter = '';
  fechaDesde = '';
  fechaHasta = '';

  selected = signal<OrdenPago[]>([]);
  showBatchConfirm = signal(false);
  batchProcessing = signal(false);

  selectedTotal = computed(() => this.selected().reduce((sum, o) => sum + (o.montoTotal - (o.montoPagado || 0)), 0));
  hasFilters = signal(false);

  columns: TableColumn[] = [
    { key: 'select', label: '', width: '40px' },
    { key: 'numero', label: 'Numero', width: '11%' },
    { key: 'fecha', label: 'Fecha', width: '10%' },
    { key: 'proveedor', label: 'Proveedor', width: '18%' },
    { key: 'cliente', label: 'Cliente', width: '18%' },
    { key: 'monto', label: 'Monto Total', width: '13%' },
    { key: 'saldoPendiente', label: 'Saldo Pend.', width: '13%' },
    { key: 'estado', label: 'Estado', width: '10%' },
  ];

  constructor(
    private service: OrdenPagoService,
    private empresaProvService: EmpresaProveedoraService,
    private empresaCliService: EmpresaClienteService,
    private router: Router,
    private toast: ToastService,
    private exportService: ExportService,
  ) {}

  ngOnInit() {
    this.load();
    this.loadProveedores();
    this.loadClientes();
  }

  loadProveedores() {
    this.empresaProvService.getAll({ limit: 200 }).subscribe({
      next: (res) => this.proveedores.set(res.data),
    });
  }

  loadClientes() {
    this.empresaCliService.getAll({ limit: 200 }).subscribe({
      next: (res) => this.clientes.set(res.data),
    });
  }

  load() {
    this.loading.set(true);
    const params: any = { page: this.page(), limit: 20 };
    if (this.search) params.search = this.search;
    if (this.proveedorFilter) params.empresaProveedora = this.proveedorFilter;
    if (this.clienteFilter) params.empresaCliente = this.clienteFilter;
    if (this.estadoFilter) params.estado = this.estadoFilter;
    if (this.fechaDesde) params.fechaDesde = this.fechaDesde;
    if (this.fechaHasta) params.fechaHasta = this.fechaHasta;
    this.service.getAll(params).subscribe({
      next: (res) => { this.ordenes.set(res.data); this.totalPages.set(res.totalPages); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getCliente(orden: OrdenPago): string {
    if (orden.facturas?.length) {
      const factura = orden.facturas[0] as any;
      return factura?.empresaCliente?.razonSocial || '-';
    }
    return '-';
  }

  onSearch(value: string) {
    this.search = value;
    this.page.set(1);
    this.load();
  }

  onFilterChange() {
    this.hasFilters.set(!!(this.proveedorFilter || this.clienteFilter || this.estadoFilter || this.fechaDesde || this.fechaHasta));
    this.page.set(1);
    this.load();
  }

  clearFilters() {
    this.proveedorFilter = '';
    this.clienteFilter = '';
    this.estadoFilter = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.hasFilters.set(false);
    this.page.set(1);
    this.load();
  }
  onPageChange(p: number) { this.page.set(p); this.load(); }
  goToDetail(orden: OrdenPago) { this.router.navigate(['/ordenes-pago', orden._id]); }

  exportar(formato: string) {
    const params: Record<string, any> = {};
    if (this.proveedorFilter) params['empresaProveedora'] = this.proveedorFilter;
    if (this.clienteFilter) params['empresaCliente'] = this.clienteFilter;
    if (this.estadoFilter) params['estado'] = this.estadoFilter;
    if (this.fechaDesde) params['fechaDesde'] = this.fechaDesde;
    if (this.fechaHasta) params['fechaHasta'] = this.fechaHasta;
    this.exportService.download('ordenes-pago/export', formato, params);
  }

  sync() {
    this.syncing.set(true);
    this.service.syncFinnegans().subscribe({
      next: (res) => {
        this.syncing.set(false);
        this.toast.success(`Sincronizado: ${res.created} creadas, ${res.updated} actualizadas`);
        this.load();
      },
      error: () => { this.syncing.set(false); this.toast.error('Error al sincronizar'); },
    });
  }

  isSelected(id: string): boolean { return this.selected().some(o => o._id === id); }

  toggleSelect(orden: OrdenPago) {
    if (orden.estado === 'pagada' || orden.estado === 'anulada') return;
    const curr = this.selected();
    if (curr.some(o => o._id === orden._id)) {
      this.selected.set(curr.filter(o => o._id !== orden._id));
    } else {
      this.selected.set([...curr, orden]);
    }
  }

  clearSelection() { this.selected.set([]); }

  executeBatch() {
    this.showBatchConfirm.set(false);
    this.batchProcessing.set(true);
    const pagos = this.selected().map(o => ({
      ordenId: o._id,
      montoBase: o.montoTotal - (o.montoPagado || 0),
      medioPago: 'transferencia',
    }));
    this.service.pagarLote(pagos).subscribe({
      next: (res) => {
        this.batchProcessing.set(false);
        const exitosos = res.resultados.filter(r => r.exito).length;
        const fallidos = res.resultados.filter(r => !r.exito).length;
        if (fallidos === 0) {
          this.toast.success(`${exitosos} pagos procesados correctamente`);
        } else {
          this.toast.show(`${exitosos} exitosos, ${fallidos} fallidos`, 'info');
        }
        this.selected.set([]);
        this.load();
      },
      error: () => { this.batchProcessing.set(false); this.toast.error('Error al procesar el lote'); },
    });
  }
}
