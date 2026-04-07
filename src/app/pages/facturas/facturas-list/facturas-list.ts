import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FacturaService } from '../../../services/factura.service';
import { EmpresaProveedoraService } from '../../../services/empresa-proveedora.service';
import { EmpresaClienteService } from '../../../services/empresa-cliente.service';
import { Factura, EmpresaProveedora, EmpresaCliente } from '../../../models';
import { PageHeaderComponent } from '../../../shared/page-header/page-header';
import { FilterBarComponent } from '../../../shared/filter-bar/filter-bar';
import { GlassTableComponent, TableColumn } from '../../../shared/glass-table/glass-table';
import { PaginationComponent } from '../../../shared/pagination/pagination';
import { SkeletonTableComponent } from '../../../shared/skeleton-table/skeleton-table';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge';
import { ToastComponent } from '../../../shared/toast/toast';
import { ToastService } from '../../../shared/toast/toast.service';
import { UploadFacturaModalComponent } from '../upload-factura-modal/upload-factura-modal';
import { ExportService } from '../../../services/export.service';

@Component({
  selector: 'app-facturas-list',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, PageHeaderComponent, FilterBarComponent, GlassTableComponent, PaginationComponent, SkeletonTableComponent, EmptyStateComponent, StatusBadgeComponent, ToastComponent, UploadFacturaModalComponent],
  template: `
    <app-toast />
    <app-page-header title="Facturas" subtitle="Listado de facturas">
      <button class="btn-secondary" (click)="exportar('xlsx')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Excel
      </button>
      <button class="btn-secondary" (click)="exportar('csv')">CSV</button>
      <button class="btn-primary" (click)="showUpload.set(true)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Nueva Factura
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
      <app-skeleton-table [rows]="8" [cols]="8" />
    } @else if (!facturas().length) {
      <app-empty-state title="Sin facturas" message="No se encontraron facturas con los filtros seleccionados" />
    } @else {
      <app-glass-table [columns]="columns" [data]="facturas()" [clickable]="true" (rowClick)="goToDetail($event)">
        <ng-template #row let-f>
          <td class="name-cell">{{ f.numero }}</td>
          <td>{{ f.tipo }}</td>
          <td>{{ f.empresaProveedora?.razonSocial || '-' }}</td>
          <td>{{ f.empresaCliente?.razonSocial || '-' }}</td>
          <td>{{ f.montoTotal | currency:'ARS':'ARS ':'1.2-2' }}</td>
          <td>{{ f.montoPagado | currency:'ARS':'ARS ':'1.2-2' }}</td>
          <td>{{ f.saldoPendiente | currency:'ARS':'ARS ':'1.2-2' }}</td>
          <td [class]="getVencimientoClass(f)">{{ f.fechaVencimiento ? (f.fechaVencimiento | date:'dd/MM/yyyy') : '-' }}</td>
          <td><app-status-badge [status]="f.estado" /></td>
        </ng-template>
      </app-glass-table>
      <app-pagination [currentPage]="page()" [totalPages]="totalPages()" (pageChange)="onPageChange($event)" />
    }

    <app-upload-factura-modal [open]="showUpload()" (close)="showUpload.set(false)" (saved)="onFacturaCreated()" />
  `,
  styles: [`
    :host { display: block; }
    .name-cell { font-weight: 500; }
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
    .vencida { color: var(--color-error); font-weight: 600; }
    .por-vencer { color: var(--color-warning, #f59e0b); font-weight: 500; }
  `],
})
export class FacturasListComponent implements OnInit {
  showUpload = signal(false);
  loading = signal(true);
  facturas = signal<Factura[]>([]);
  page = signal(1);
  totalPages = signal(1);
  search = '';
  estadoFilter = '';
  proveedorFilter = '';
  clienteFilter = '';
  fechaDesde = '';
  fechaHasta = '';

  proveedores = signal<EmpresaProveedora[]>([]);
  clientes = signal<EmpresaCliente[]>([]);
  hasFilters = signal(false);

  columns: TableColumn[] = [
    { key: 'numero', label: 'Numero', width: '11%' },
    { key: 'tipo', label: 'Tipo', width: '6%' },
    { key: 'proveedor', label: 'Proveedor', width: '14%' },
    { key: 'cliente', label: 'Cliente', width: '14%' },
    { key: 'montoTotal', label: 'Monto Total', width: '11%' },
    { key: 'montoPagado', label: 'Pagado', width: '11%' },
    { key: 'saldoPendiente', label: 'Saldo Pend.', width: '11%' },
    { key: 'fechaVencimiento', label: 'Vencimiento', width: '10%' },
    { key: 'estado', label: 'Estado', width: '9%' },
  ];

  constructor(
    private service: FacturaService,
    private router: Router,
    private toast: ToastService,
    private exportService: ExportService,
    private empresaProvService: EmpresaProveedoraService,
    private empresaCliService: EmpresaClienteService,
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
    if (this.estadoFilter) params.estado = this.estadoFilter;
    if (this.proveedorFilter) params.empresaProveedora = this.proveedorFilter;
    if (this.clienteFilter) params.empresaCliente = this.clienteFilter;
    if (this.fechaDesde) params.fechaDesde = this.fechaDesde;
    if (this.fechaHasta) params.fechaHasta = this.fechaHasta;
    this.service.getAll(params).subscribe({
      next: (res) => { this.facturas.set(res.data); this.totalPages.set(res.totalPages); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSearch(value: string) { this.search = value; this.page.set(1); this.load(); }

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
  goToDetail(f: Factura) { this.router.navigate(['/facturas', f._id]); }

  exportar(formato: string) {
    const params: Record<string, any> = {};
    if (this.estadoFilter) params['estado'] = this.estadoFilter;
    if (this.proveedorFilter) params['empresaProveedora'] = this.proveedorFilter;
    if (this.clienteFilter) params['empresaCliente'] = this.clienteFilter;
    if (this.fechaDesde) params['fechaDesde'] = this.fechaDesde;
    if (this.fechaHasta) params['fechaHasta'] = this.fechaHasta;
    this.exportService.download('facturas/export', formato, params);
  }

  getVencimientoClass(factura: Factura): string {
    if (!factura.fechaVencimiento || factura.estado === 'pagada') return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const venc = new Date(factura.fechaVencimiento);
    venc.setHours(0, 0, 0, 0);
    if (venc < today) return 'vencida';
    const diffMs = venc.getTime() - today.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays <= 7) return 'por-vencer';
    return '';
  }

  onFacturaCreated() {
    this.showUpload.set(false);
    this.toast.success('Factura creada exitosamente');
    this.load();
  }
}
