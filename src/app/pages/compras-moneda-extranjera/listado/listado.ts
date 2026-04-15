import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArsCurrencyPipe } from '../../../pipes/currency.pipe';
import { PageHeaderComponent } from '../../../shared/page-header/page-header';
import { GlassCardComponent } from '../../../shared/glass-card/glass-card';
import { GlassTableComponent, TableColumn } from '../../../shared/glass-table/glass-table';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge';
import { SkeletonTableComponent } from '../../../shared/skeleton-table/skeleton-table';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state';
import { PaginationComponent } from '../../../shared/pagination/pagination';
import { ToastComponent } from '../../../shared/toast/toast';
import { ToastService } from '../../../shared/toast/toast.service';
import { AuthService } from '../../../services/auth.service';
import { ComprasMonedaExtranjeraService } from '../../../services/compras-moneda-extranjera.service';
import { CompraFormModalComponent } from '../modals/compra-form-modal/compra-form-modal';
import { CompraAnularModalComponent } from '../modals/compra-anular-modal/compra-anular-modal';
import type {
  CompraMonedaExtranjera,
  CompraMonedaExtranjeraFilters,
  ModalidadCompra,
  EstadoCompraMonedaExtranjera,
} from '../../../models/compra-moneda-extranjera';

@Component({
  selector: 'app-compras-moneda-extranjera-listado',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    PageHeaderComponent,
    GlassCardComponent,
    GlassTableComponent,
    StatusBadgeComponent,
    SkeletonTableComponent,
    EmptyStateComponent,
    PaginationComponent,
    ToastComponent,
    CompraFormModalComponent,
    CompraAnularModalComponent,
    ArsCurrencyPipe,
  ],
  template: `
    <app-toast />

    <app-page-header title="Compras FX" subtitle="Registro de compras de moneda extranjera (USD)">
      @if (canWrite()) {
        <button class="btn-primary" (click)="openCreateModal()">+ Nueva Compra FX</button>
      }
    </app-page-header>

    <!-- Filtros -->
    <div class="filters-card card-glass">
      <div class="filters-row">
        <div class="filter-item">
          <label>Modalidad</label>
          <select [(ngModel)]="draftModalidad">
            <option value="all">Todas</option>
            <option value="CABLE">Cable</option>
            <option value="USD_LOCAL">USD Local</option>
          </select>
        </div>
        <div class="filter-item">
          <label>Estado</label>
          <select [(ngModel)]="draftEstado">
            <option value="all">Todos</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="ANULADA">Anulada</option>
          </select>
        </div>
        <div class="filter-item filter-item--wide">
          <label>Fecha desde</label>
          <input type="date" [(ngModel)]="draftFechaDesde" />
        </div>
        <div class="filter-item filter-item--wide">
          <label>Fecha hasta</label>
          <input type="date" [(ngModel)]="draftFechaHasta" />
        </div>
        <div class="filter-actions">
          <button class="btn-primary" (click)="applyFilters()">Buscar</button>
          <button class="btn-secondary" (click)="clearFilters()">Limpiar</button>
        </div>
      </div>
    </div>

    <!-- Tabla -->
    @if (loading()) {
      <app-skeleton-table [rows]="5" [cols]="9" />
    } @else if (compras().length === 0) {
      <app-empty-state
        title="Sin compras FX"
        message="No hay compras de moneda extranjera que coincidan con los filtros aplicados."
      />
    } @else {
      <app-glass-table [columns]="columns" [data]="compras()">
        <ng-template #row let-compra>
          <td>{{ compra.fecha | date: 'dd/MM/yyyy' }}</td>
          <td>
            <span class="badge-modalidad" [class]="'badge-' + compra.modalidad">
              {{ compra.modalidad === 'CABLE' ? 'Cable' : 'USD Local' }}
            </span>
          </td>
          <td class="cell-entity">{{ compra.empresaCliente.razonSocialCache }}</td>
          <td class="num">USD {{ fmtUSD(compra.montoUSD) }}</td>
          <td class="num">{{ fmtUSD(compra.tipoCambio) }}</td>
          <td class="num">{{ compra.montoARS | arsCurrency }}</td>
          <td class="cell-contraparte">{{ compra.contraparte }}</td>
          <td><app-status-badge [status]="compra.estado" /></td>
          <td class="cell-actions">
            <div class="row-actions">
              @if (canWrite() && compra.estado === 'CONFIRMADA') {
                <button class="btn-sm btn-warn" (click)="openAnularModal(compra)" title="Anular">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                  Anular
                </button>
              }
            </div>
          </td>
        </ng-template>
      </app-glass-table>

      <app-pagination
        [currentPage]="page()"
        [totalPages]="totalPages()"
        (pageChange)="onPageChange($event)"
      />
    }

    <!-- Modals -->
    <app-compra-form-modal
      [open]="showFormModal()"
      (close)="showFormModal.set(false)"
      (saved)="onModalSaved()"
    />

    <app-compra-anular-modal
      [open]="showAnularModal()"
      [compra]="selectedCompra()"
      (close)="showAnularModal.set(false)"
      (saved)="onModalSaved()"
    />
  `,
  styles: [`
    :host { display: block; }

    .btn-primary {
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-primary:hover { background: var(--color-primary-dark); }

    .btn-secondary {
      background: var(--color-gray-100);
      color: var(--color-gray-700);
      border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-sm);
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-secondary:hover { background: var(--color-gray-200); }

    .btn-sm {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: var(--color-gray-100);
      color: var(--color-gray-700);
      border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-sm);
      padding: 0.25rem 0.5rem;
      font-size: 0.8125rem;
      cursor: pointer;
      line-height: 1;
    }
    .btn-sm:hover { background: var(--color-gray-200); }
    .btn-sm.btn-warn {
      color: var(--color-warning);
      border-color: var(--color-warning);
    }
    .btn-sm.btn-warn:hover { background: rgba(245, 158, 11, 0.1); }

    .filters-card {
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
    }

    .filters-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 140px;
    }
    .filter-item--wide { min-width: 160px; }

    .filter-item label {
      font-size: 0.6875rem;
      color: var(--color-gray-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .filter-item select,
    .filter-item input {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      background: var(--color-white);
      color: var(--color-gray-900);
    }
    .filter-item select:focus,
    .filter-item input:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .filter-actions {
      display: flex;
      gap: 0.5rem;
      margin-left: auto;
    }

    /* Modalidad badges */
    .badge-modalidad {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-sm);
    }
    .badge-CABLE {
      background: rgba(59, 130, 246, 0.12);
      color: #2563eb;
    }
    .badge-USD_LOCAL {
      background: rgba(245, 158, 11, 0.12);
      color: #d97706;
    }

    :host ::ng-deep td.num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    :host ::ng-deep td.cell-entity { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    :host ::ng-deep td.cell-contraparte { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    :host ::ng-deep td.cell-actions { white-space: nowrap; }

    .row-actions {
      display: flex;
      gap: 0.25rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComprasMonedaExtranjeraListadoComponent implements OnInit {
  private service = inject(ComprasMonedaExtranjeraService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  // Data
  compras = signal<CompraMonedaExtranjera[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(20);
  loading = signal(true);

  // Draft filters (template-driven)
  draftModalidad: ModalidadCompra | 'all' = 'all';
  draftEstado: EstadoCompraMonedaExtranjera | 'all' = 'all';
  draftFechaDesde = '';
  draftFechaHasta = '';

  // Applied filters
  private appliedFilters = signal<CompraMonedaExtranjeraFilters>({});

  // Computed
  canWrite = computed(() =>
    ['admin', 'tesoreria'].includes(this.auth.user()?.role ?? ''),
  );

  totalPages = computed(() => Math.ceil(this.total() / this.limit()) || 1);

  // Modal state
  showFormModal = signal(false);
  showAnularModal = signal(false);
  selectedCompra = signal<CompraMonedaExtranjera | null>(null);

  columns: TableColumn[] = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'modalidad', label: 'Modalidad', width: '110px' },
    { key: 'empresaCliente', label: 'Empresa Cliente' },
    { key: 'montoUSD', label: 'Monto USD' },
    { key: 'tipoCambio', label: 'Tipo Cambio' },
    { key: 'montoARS', label: 'Monto ARS' },
    { key: 'contraparte', label: 'Contraparte' },
    { key: 'estado', label: 'Estado', width: '120px' },
    { key: 'actions', label: '', width: '100px' },
  ];

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.service
      .getAll({ ...this.appliedFilters(), page: this.page(), limit: this.limit() })
      .subscribe({
        next: (res) => {
          this.compras.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Error al cargar las compras FX');
          this.loading.set(false);
        },
      });
  }

  applyFilters() {
    const f: CompraMonedaExtranjeraFilters = {};
    if (this.draftModalidad !== 'all') f.modalidad = this.draftModalidad;
    if (this.draftEstado !== 'all') f.estado = this.draftEstado;
    if (this.draftFechaDesde) f.fechaDesde = this.draftFechaDesde;
    if (this.draftFechaHasta) f.fechaHasta = this.draftFechaHasta;
    this.appliedFilters.set(f);
    this.page.set(1);
    this.load();
  }

  clearFilters() {
    this.draftModalidad = 'all';
    this.draftEstado = 'all';
    this.draftFechaDesde = '';
    this.draftFechaHasta = '';
    this.appliedFilters.set({});
    this.page.set(1);
    this.load();
  }

  onPageChange(p: number) {
    this.page.set(p);
    this.load();
  }

  openCreateModal() {
    this.showFormModal.set(true);
  }

  openAnularModal(compra: CompraMonedaExtranjera) {
    this.selectedCompra.set(compra);
    this.showAnularModal.set(true);
  }

  onModalSaved() {
    this.load();
  }

  // USD formatter
  fmtUSD(value: number): string {
    return value.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
