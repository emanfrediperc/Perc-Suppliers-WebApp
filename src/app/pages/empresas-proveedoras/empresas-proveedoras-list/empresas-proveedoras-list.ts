import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { EmpresaProveedoraService } from '../../../services/empresa-proveedora.service';
import { ExportService } from '../../../services/export.service';
import { EmpresaProveedora } from '../../../models';
import { PageHeaderComponent } from '../../../shared/page-header/page-header';
import { FilterBarComponent } from '../../../shared/filter-bar/filter-bar';
import { GlassTableComponent, TableColumn } from '../../../shared/glass-table/glass-table';
import { PaginationComponent } from '../../../shared/pagination/pagination';
import { SkeletonTableComponent } from '../../../shared/skeleton-table/skeleton-table';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state';
import { ToastService } from '../../../shared/toast/toast.service';
import { ToastComponent } from '../../../shared/toast/toast';
import { EmpresaProveedoraFormModalComponent } from '../empresa-proveedora-form-modal/empresa-proveedora-form-modal';

@Component({
  selector: 'app-empresas-proveedoras-list',
  standalone: true,
  imports: [PageHeaderComponent, FilterBarComponent, GlassTableComponent, PaginationComponent, SkeletonTableComponent, EmptyStateComponent, ToastComponent, EmpresaProveedoraFormModalComponent],
  template: `
    <app-toast />
    <app-page-header title="Empresas Proveedoras" subtitle="Gestion de proveedores">
      <button class="btn-secondary" (click)="exportar('xlsx')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Excel
      </button>
      <button class="btn-primary" (click)="openCreate()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nueva Empresa
      </button>
    </app-page-header>

    <app-filter-bar placeholder="Buscar por razon social o CUIT..." (search)="onSearch($event)" />

    @if (loading()) {
      <app-skeleton-table [rows]="6" [cols]="6" />
    } @else if (!empresas().length) {
      <app-empty-state title="Sin empresas proveedoras" message="Crea una empresa proveedora para comenzar" />
    } @else {
      <app-glass-table [columns]="columns" [data]="empresas()" [clickable]="true" (rowClick)="goToDetail($event)">
        <ng-template #row let-e>
          <td class="name-cell">{{ e.razonSocial }}</td>
          <td>{{ e.cuit }}</td>
          <td>{{ e.condicionIva || '-' }}</td>
          <td>{{ e.email || '-' }}</td>
          <td><span class="badge" [class]="e.activa ? 'bg-glass-green' : 'bg-glass-red'">{{ e.activa ? 'Activa' : 'Inactiva' }}</span></td>
          <td class="actions-cell">
            <button class="btn-icon" (click)="openEdit($event, e)" title="Editar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
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

    <app-empresa-proveedora-form-modal [open]="showForm()" [entity]="editEntity()" (close)="closeForm()" (saved)="onSaved()" />
  `,
  styles: [`
    :host { display: block; }
    .name-cell { font-weight: 500; }
    .badge { font-size: 0.75rem; font-weight: 500; }
    .actions-cell { text-align: right; }
    .btn-icon {
      background: none; border: none; cursor: pointer; padding: 0.375rem;
      border-radius: var(--radius-sm); color: var(--color-gray-500);
      transition: all 0.2s;
    }
    .btn-icon:hover { background: var(--glass-bg); color: var(--color-primary); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresasProveedorasListComponent implements OnInit {
  loading = signal(true);
  empresas = signal<EmpresaProveedora[]>([]);
  page = signal(1);
  limit = signal(5);
  total = signal(0);
  totalPages = signal(1);
  showForm = signal(false);
  editEntity = signal<EmpresaProveedora | null>(null);
  search = '';

  columns: TableColumn[] = [
    { key: 'razonSocial', label: 'Razon Social', width: '25%' },
    { key: 'cuit', label: 'CUIT', width: '13%' },
    { key: 'condicionIva', label: 'Cond. IVA', width: '15%' },
    { key: 'email', label: 'Email', width: '18%' },
    { key: 'estado', label: 'Estado', width: '10%' },
    { key: 'acciones', label: '', width: '7%' },
  ];

  constructor(
    private service: EmpresaProveedoraService,
    private router: Router,
    private toast: ToastService,
    private exportService: ExportService,
  ) {}

  exportar(formato: 'xlsx' | 'csv') {
    const params: Record<string, any> = {};
    if (this.search) params['search'] = this.search;
    this.exportService.download('empresas-proveedoras/export', formato, params);
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.service.getAll({ page: this.page(), limit: this.limit(), search: this.search || undefined }).subscribe({
      next: (res) => { this.empresas.set(res.data); this.totalPages.set(res.totalPages); this.total.set((res as any).total ?? res.data.length); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSearch(value: string) { this.search = value; this.page.set(1); this.load(); }
  onPageChange(p: number) { this.page.set(p); this.load(); }
  onPageSizeChange(size: number) { this.limit.set(size); this.page.set(1); this.load(); }
  goToDetail(e: EmpresaProveedora) { this.router.navigate(['/empresas-proveedoras', e._id]); }

  openCreate() {
    this.editEntity.set(null);
    this.showForm.set(true);
  }

  openEdit(event: Event, e: EmpresaProveedora) {
    event.stopPropagation();
    this.editEntity.set(e);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editEntity.set(null);
  }

  onSaved() {
    const msg = this.editEntity() ? 'Empresa proveedora actualizada correctamente' : 'Empresa proveedora creada correctamente';
    this.closeForm();
    this.toast.success(msg);
    this.load();
  }
}
