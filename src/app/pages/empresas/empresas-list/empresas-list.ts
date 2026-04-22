import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EmpresaProveedoraService } from '../../../services/empresa-proveedora.service';
import { EmpresaClienteService } from '../../../services/empresa-cliente.service';
import { ExportService } from '../../../services/export.service';
import { EmpresaProveedora, EmpresaCliente } from '../../../models';
import { PageHeaderComponent } from '../../../shared/page-header/page-header';
import { FilterBarComponent } from '../../../shared/filter-bar/filter-bar';
import { GlassTableComponent, TableColumn } from '../../../shared/glass-table/glass-table';
import { PaginationComponent } from '../../../shared/pagination/pagination';
import { SkeletonTableComponent } from '../../../shared/skeleton-table/skeleton-table';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state';
import { ToastService } from '../../../shared/toast/toast.service';
import { ToastComponent } from '../../../shared/toast/toast';
import { EmpresaProveedoraFormModalComponent } from '../../empresas-proveedoras/empresa-proveedora-form-modal/empresa-proveedora-form-modal';
import { EmpresaClienteFormModalComponent } from '../../empresas-clientes/empresa-cliente-form-modal/empresa-cliente-form-modal';

type Tipo = 'proveedora' | 'cliente';
type FiltroTipo = 'todas' | Tipo;

interface EmpresaRow {
  _id: string;
  cuit: string;
  razonSocial: string;
  condicionIva?: string;
  email?: string;
  activa: boolean;
  tipo: Tipo;
  raw: EmpresaProveedora | EmpresaCliente;
}

// PAGE_SIZE replaced by limit signal below

@Component({
  selector: 'app-empresas-list',
  standalone: true,
  imports: [
    PageHeaderComponent,
    FilterBarComponent,
    GlassTableComponent,
    PaginationComponent,
    SkeletonTableComponent,
    EmptyStateComponent,
    ToastComponent,
    EmpresaProveedoraFormModalComponent,
    EmpresaClienteFormModalComponent,
  ],
  template: `
    <app-toast />
    <app-page-header title="Empresas" subtitle="Proveedoras y clientes en una sola vista">
      <button class="btn-secondary" (click)="exportar('proveedora')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Excel Proveedoras
      </button>
      <button class="btn-secondary" (click)="exportar('cliente')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Excel Clientes
      </button>
      <button class="btn-primary" (click)="openCreate('proveedora')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nueva Proveedora
      </button>
      <button class="btn-primary" (click)="openCreate('cliente')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nueva Cliente
      </button>
    </app-page-header>

    <div class="tabs">
      <button class="tab" [class.active]="filtro() === 'todas'" (click)="setFiltro('todas')">
        Todas <span class="tab-count">{{ totalTodas() }}</span>
      </button>
      <button class="tab" [class.active]="filtro() === 'proveedora'" (click)="setFiltro('proveedora')">
        Proveedoras <span class="tab-count">{{ totalProveedoras() }}</span>
      </button>
      <button class="tab" [class.active]="filtro() === 'cliente'" (click)="setFiltro('cliente')">
        Clientes <span class="tab-count">{{ totalClientes() }}</span>
      </button>
    </div>

    <app-filter-bar placeholder="Buscar por razon social o CUIT..." (search)="onSearch($event)" />

    @if (loading()) {
      <app-skeleton-table [rows]="6" [cols]="7" />
    } @else if (!paginated().length) {
      <app-empty-state title="Sin empresas" message="No hay empresas que coincidan con los filtros" />
    } @else {
      <app-glass-table [columns]="columns" [data]="paginated()" [clickable]="true" (rowClick)="goToDetail($event)">
        <ng-template #row let-e>
          <td class="name-cell">{{ e.razonSocial }}</td>
          <td>{{ e.cuit }}</td>
          <td>
            <span class="tipo-badge" [class.tipo-proveedora]="e.tipo === 'proveedora'" [class.tipo-cliente]="e.tipo === 'cliente'">
              {{ e.tipo === 'proveedora' ? 'Proveedora' : 'Cliente' }}
            </span>
          </td>
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

    <app-empresa-proveedora-form-modal
      [open]="showProveedoraForm()"
      [entity]="editProveedora()"
      (close)="closeForms()"
      (saved)="onSaved('proveedora')" />

    <app-empresa-cliente-form-modal
      [open]="showClienteForm()"
      [entity]="editCliente()"
      (close)="closeForms()"
      (saved)="onSaved('cliente')" />
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

    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--color-border);
    }
    .tab {
      background: none;
      border: none;
      padding: 0.75rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-gray-500);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: color 0.2s, border-color 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .tab:hover { color: var(--color-text); }
    .tab.active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
      font-weight: 600;
    }
    .tab-count {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      background: var(--glass-bg);
      color: inherit;
    }

    .tipo-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.125rem 0.625rem;
      border-radius: 999px;
      letter-spacing: 0.02em;
    }
    .tipo-proveedora {
      background: color-mix(in srgb, var(--color-info) 16%, transparent);
      color: var(--color-info);
    }
    .tipo-cliente {
      background: color-mix(in srgb, var(--color-accent, var(--color-primary)) 16%, transparent);
      color: var(--color-accent, var(--color-primary));
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresasListComponent implements OnInit {
  loading = signal(true);
  proveedoras = signal<EmpresaProveedora[]>([]);
  clientes = signal<EmpresaCliente[]>([]);

  filtro = signal<FiltroTipo>('todas');
  search = signal('');
  page = signal(1);
  limit = signal(5);

  showProveedoraForm = signal(false);
  showClienteForm = signal(false);
  editProveedora = signal<EmpresaProveedora | null>(null);
  editCliente = signal<EmpresaCliente | null>(null);

  columns: TableColumn[] = [
    { key: 'razonSocial', label: 'Razon Social', width: '22%' },
    { key: 'cuit', label: 'CUIT', width: '13%' },
    { key: 'tipo', label: 'Tipo', width: '11%' },
    { key: 'condicionIva', label: 'Cond. IVA', width: '14%' },
    { key: 'email', label: 'Email', width: '20%' },
    { key: 'estado', label: 'Estado', width: '10%' },
    { key: 'acciones', label: '', width: '7%' },
  ];

  totalProveedoras = computed(() => this.proveedoras().length);
  totalClientes = computed(() => this.clientes().length);
  totalTodas = computed(() => this.totalProveedoras() + this.totalClientes());

  private allRows = computed<EmpresaRow[]>(() => {
    const rows: EmpresaRow[] = [];
    for (const p of this.proveedoras()) {
      rows.push({
        _id: p._id, cuit: p.cuit, razonSocial: p.razonSocial,
        condicionIva: p.condicionIva, email: p.email, activa: p.activa,
        tipo: 'proveedora', raw: p,
      });
    }
    for (const c of this.clientes()) {
      rows.push({
        _id: c._id, cuit: c.cuit, razonSocial: c.razonSocial,
        condicionIva: c.condicionIva, email: c.email, activa: c.activa,
        tipo: 'cliente', raw: c,
      });
    }
    return rows.sort((a, b) => a.razonSocial.localeCompare(b.razonSocial, 'es'));
  });

  private filtered = computed<EmpresaRow[]>(() => {
    const tipo = this.filtro();
    const q = this.search().trim().toLowerCase();
    return this.allRows().filter(r => {
      if (tipo !== 'todas' && r.tipo !== tipo) return false;
      if (!q) return true;
      return r.razonSocial.toLowerCase().includes(q) || r.cuit.toLowerCase().includes(q);
    });
  });

  total = computed(() => this.filtered().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.limit())));
  paginated = computed(() => {
    const start = (this.page() - 1) * this.limit();
    return this.filtered().slice(start, start + this.limit());
  });

  constructor(
    private proveedorasService: EmpresaProveedoraService,
    private clientesService: EmpresaClienteService,
    private router: Router,
    private toast: ToastService,
    private exportService: ExportService,
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    forkJoin({
      proveedoras: this.proveedorasService.getAll({ page: 1, limit: 1000 }),
      clientes: this.clientesService.getAll({ page: 1, limit: 1000 }),
    }).subscribe({
      next: ({ proveedoras, clientes }) => {
        this.proveedoras.set(proveedoras.data);
        this.clientes.set(clientes.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setFiltro(t: FiltroTipo) {
    this.filtro.set(t);
    this.page.set(1);
  }

  onSearch(value: string) {
    this.search.set(value);
    this.page.set(1);
  }

  onPageChange(p: number) { this.page.set(p); }
  onPageSizeChange(size: number) { this.limit.set(size); this.page.set(1); }

  goToDetail(row: EmpresaRow) {
    const route = row.tipo === 'proveedora' ? '/empresas-proveedoras' : '/empresas-clientes';
    this.router.navigate([route, row._id]);
  }

  openCreate(tipo: Tipo) {
    if (tipo === 'proveedora') {
      this.editProveedora.set(null);
      this.showProveedoraForm.set(true);
    } else {
      this.editCliente.set(null);
      this.showClienteForm.set(true);
    }
  }

  openEdit(event: Event, row: EmpresaRow) {
    event.stopPropagation();
    if (row.tipo === 'proveedora') {
      this.editProveedora.set(row.raw as EmpresaProveedora);
      this.showProveedoraForm.set(true);
    } else {
      this.editCliente.set(row.raw as EmpresaCliente);
      this.showClienteForm.set(true);
    }
  }

  closeForms() {
    this.showProveedoraForm.set(false);
    this.showClienteForm.set(false);
    this.editProveedora.set(null);
    this.editCliente.set(null);
  }

  onSaved(tipo: Tipo) {
    const editing = tipo === 'proveedora' ? !!this.editProveedora() : !!this.editCliente();
    const label = tipo === 'proveedora' ? 'Empresa proveedora' : 'Empresa cliente';
    const msg = editing ? `${label} actualizada correctamente` : `${label} creada correctamente`;
    this.closeForms();
    this.toast.success(msg);
    this.load();
  }

  exportar(tipo: Tipo) {
    const endpoint = tipo === 'proveedora' ? 'empresas-proveedoras/export' : 'empresas-clientes/export';
    this.exportService.download(endpoint, 'xlsx', {});
  }
}
