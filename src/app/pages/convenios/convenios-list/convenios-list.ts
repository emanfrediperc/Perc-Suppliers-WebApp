import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { ConvenioService } from '../../../services/convenio.service';
import { ExportService } from '../../../services/export.service';
import { Convenio } from '../../../models';
import { PageHeaderComponent } from '../../../shared/page-header/page-header';
import { FilterBarComponent } from '../../../shared/filter-bar/filter-bar';
import { GlassTableComponent, TableColumn } from '../../../shared/glass-table/glass-table';
import { PaginationComponent } from '../../../shared/pagination/pagination';
import { SkeletonTableComponent } from '../../../shared/skeleton-table/skeleton-table';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state';
import { ToastService } from '../../../shared/toast/toast.service';
import { ToastComponent } from '../../../shared/toast/toast';
import { ConvenioFormModalComponent } from '../convenio-form-modal/convenio-form-modal';

@Component({
  selector: 'app-convenios-list',
  standalone: true,
  imports: [PageHeaderComponent, FilterBarComponent, GlassTableComponent, PaginationComponent, SkeletonTableComponent, EmptyStateComponent, ToastComponent, ConvenioFormModalComponent],
  template: `
    <app-toast />
    <app-page-header title="Productores" subtitle="Administracion de productores">
      <button class="btn-secondary" (click)="exportar('xlsx')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Excel
      </button>
      <button class="btn-primary" (click)="openCreate()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nuevo Productor
      </button>
    </app-page-header>

    <app-filter-bar placeholder="Buscar productor..." (search)="onSearch($event)" />

    @if (loading()) {
      <app-skeleton-table [rows]="5" [cols]="6" />
    } @else if (!convenios().length) {
      <app-empty-state title="Sin productores" message="Crea un productor para comenzar" />
    } @else {
      <app-glass-table [columns]="columns" [data]="convenios()" [clickable]="true" (rowClick)="goToDetail($event)">
        <ng-template #row let-c>
          <td class="name-cell">{{ c.nombre }}</td>
          <td>{{ c.comisionPorcentaje }}%</td>
          <td>{{ c.descuentoPorcentaje }}%</td>
          <td>{{ c.empresasProveedoras?.length || 0 }}</td>
          <td><span class="badge" [class]="c.activo ? 'bg-glass-green' : 'bg-glass-red'">{{ c.activo ? 'Activo' : 'Inactivo' }}</span></td>
          <td class="actions-cell">
            <button class="btn-icon" (click)="openEdit($event, c)" title="Editar">
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

    <app-convenio-form-modal [open]="showForm()" [entity]="editEntity()" (close)="closeForm()" (saved)="onSaved()" />
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
export class ConveniosListComponent implements OnInit {
  loading = signal(true);
  convenios = signal<Convenio[]>([]);
  page = signal(1);
  limit = signal(5);
  total = signal(0);
  totalPages = signal(1);
  showForm = signal(false);
  editEntity = signal<Convenio | null>(null);
  search = '';

  columns: TableColumn[] = [
    { key: 'nombre', label: 'Nombre', width: '25%' },
    { key: 'comision', label: 'Honorarios', width: '12%' },
    { key: 'descuento', label: 'Descuento', width: '12%' },
    { key: 'empresas', label: 'Empresas', width: '12%' },
    { key: 'estado', label: 'Estado', width: '12%' },
    { key: 'acciones', label: '', width: '7%' },
  ];

  constructor(
    private service: ConvenioService,
    private router: Router,
    private toast: ToastService,
    private exportService: ExportService,
  ) {}

  exportar(formato: 'xlsx' | 'csv') {
    const params: Record<string, any> = {};
    if (this.search) params['search'] = this.search;
    this.exportService.download('convenios/export', formato, params);
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.service.getAll({ page: this.page(), limit: this.limit(), search: this.search || undefined }).subscribe({
      next: (res) => { this.convenios.set(res.data); this.totalPages.set(res.totalPages); this.total.set((res as any).total ?? res.data.length); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSearch(value: string) { this.search = value; this.page.set(1); this.load(); }
  onPageChange(p: number) { this.page.set(p); this.load(); }
  onPageSizeChange(size: number) { this.limit.set(size); this.page.set(1); this.load(); }
  goToDetail(c: Convenio) { this.router.navigate(['/convenios', c._id]); }

  openCreate() {
    this.editEntity.set(null);
    this.showForm.set(true);
  }

  openEdit(event: Event, c: Convenio) {
    event.stopPropagation();
    this.editEntity.set(c);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editEntity.set(null);
  }

  onSaved() {
    const msg = this.editEntity() ? 'Productor actualizado correctamente' : 'Productor creado correctamente';
    this.closeForm();
    this.toast.success(msg);
    this.load();
  }
}
