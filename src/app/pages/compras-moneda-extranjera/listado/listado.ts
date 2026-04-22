import { finalize } from 'rxjs/operators';
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
import { EmpresaPickerComponent } from '../../../shared/empresa-picker/empresa-picker';
import { CompraFormModalComponent } from '../modals/compra-form-modal/compra-form-modal';
import { CompraAnularModalComponent } from '../modals/compra-anular-modal/compra-anular-modal';
import { CompraDetalleModalComponent } from '../modals/compra-detalle-modal/compra-detalle-modal';
import { CompraEjecutarModalComponent } from '../modals/compra-ejecutar-modal/compra-ejecutar-modal';
import { CompraEstimarModalComponent } from '../modals/compra-estimar-modal/compra-estimar-modal';
import {
  MONEDAS,
  MONEDA_LABEL,
  type CompraMonedaExtranjera,
  type CompraMonedaExtranjeraFilters,
  type Moneda,
  type EstadoCompraMonedaExtranjera,
} from '../../../models/compra-moneda-extranjera';
import type { EmpresaRef } from '../../../models/prestamo';

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
    CompraDetalleModalComponent,
    CompraEjecutarModalComponent,
    CompraEstimarModalComponent,
    EmpresaPickerComponent,
  ],
  template: `
    <app-toast />

    <app-page-header title="Compras de Divisas" subtitle="Registro de compras de moneda extranjera">
      @if (canWrite()) {
        <button class="btn-primary" (click)="openCreateModal()">+ Nueva Compra de Divisa</button>
      }
    </app-page-header>

    <!-- Filtros -->
    <div class="filters-card card-glass">
      <div class="filters-row">
        <div class="filter-item">
          <label>Moneda origen</label>
          <select [(ngModel)]="draftMonedaOrigen">
            <option value="all">Todas</option>
            @for (m of monedas; track m) {
              <option [value]="m">{{ monedaLabel[m] }}</option>
            }
          </select>
        </div>
        <div class="filter-item">
          <label>Moneda destino</label>
          <select [(ngModel)]="draftMonedaDestino">
            <option value="all">Todas</option>
            @for (m of monedas; track m) {
              <option [value]="m">{{ monedaLabel[m] }}</option>
            }
          </select>
        </div>
        <div class="filter-item">
          <label>Estado</label>
          <select [(ngModel)]="draftEstado">
            <option value="all">Todos</option>
            <option value="SOLICITADA">Solicitada</option>
            <option value="EJECUTADA">Ejecutada</option>
            <option value="ANULADA">Anulada</option>
            <option value="ESPERANDO_APROBACION">Esperando aprobación</option>
          </select>
        </div>
        <div class="filter-item filter-empresa">
          <app-empresa-picker
            label="Empresa"
            placeholder="Cliente o proveedora..."
            [(selected)]="draftEmpresa" />
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
        title="Sin compras de divisas"
        message="No hay compras de moneda extranjera que coincidan con los filtros aplicados."
      />
    } @else {
      <app-glass-table [columns]="columns" [data]="compras()">
        <ng-template #row let-compra>
          <td class="cell-dates">
            <div class="date-line">
              <span class="date-tag">Creada</span>
              <span>{{ compra.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
            </div>
            @if (compra.fechaEjecutada) {
              <div class="date-line ejecutada">
                <span class="date-tag tag-green">Ejec</span>
                <span>{{ compra.fechaEjecutada | date: 'dd/MM/yyyy HH:mm' }}</span>
              </div>
            } @else if (compra.fechaEstimadaEjecucion) {
              <div class="date-line estimada">
                <span class="date-tag tag-blue">Est</span>
                <span>{{ compra.fechaEstimadaEjecucion | date: 'dd/MM/yyyy HH:mm' }}</span>
              </div>
            }
          </td>
          <td class="cell-par">
            <span class="badge-moneda" [class]="'badge-' + compra.monedaOrigen">
              {{ labelOf(compra.monedaOrigen) }}
            </span>
            <span class="arrow">→</span>
            <span class="badge-moneda" [class]="'badge-' + compra.monedaDestino">
              {{ labelOf(compra.monedaDestino) }}
            </span>
          </td>
          <td class="cell-entity">
            {{ compra.empresa.razonSocialCache }}
            <span class="kind-tag">{{ compra.empresa.empresaKind === 'cliente' ? 'Cliente' : 'Proveedora' }}</span>
          </td>
          <td class="cell-monto">
            <div class="monto-line">
              <span class="monto-val">{{ fmtNum(compra.montoOrigen) }}</span>
              <span class="monto-moneda">{{ labelOf(compra.monedaOrigen) }}</span>
            </div>
            @if (compra.montoDestino != null) {
              <div class="monto-line monto-destino">
                <span class="monto-val">{{ fmtNum(compra.montoDestino) }}</span>
                <span class="monto-moneda">{{ labelOf(compra.monedaDestino) }}</span>
              </div>
            }
          </td>
          <td><app-status-badge [status]="compra.estado" /></td>
          <td class="cell-actions">
            <div class="row-actions">
              <button class="btn-sm" (click)="openDetalleModal(compra._id)" title="Ver detalle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Ver
              </button>
              @if (compra.estado === 'SOLICITADA') {
                @if (canExecute()) {
                  <button class="btn-sm btn-success" (click)="openEjecutarModal(compra)" title="Marcar como ejecutada">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Ejecutar
                  </button>
                  <button class="btn-sm" (click)="openEstimarModal(compra)" title="Fijar fecha estimada">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Estimar
                  </button>
                }
                @if (canAnular()) {
                  <button class="btn-sm btn-warn" (click)="openAnularModal(compra)" title="Anular">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                    Anular
                  </button>
                }
              }
            </div>
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

    <app-compra-ejecutar-modal
      [open]="showEjecutarModal()"
      [compra]="selectedCompra()"
      (close)="showEjecutarModal.set(false)"
      (saved)="onModalSaved()"
    />

    <app-compra-estimar-modal
      [open]="showEstimarModal()"
      [compra]="selectedCompra()"
      (close)="showEstimarModal.set(false)"
      (saved)="onModalSaved()"
    />

    <app-compra-detalle-modal
      [open]="showDetalleModal()"
      [compra]="detalleCompra()"
      [loading]="detalleLoading()"
      (close)="showDetalleModal.set(false)"
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
      overflow: visible;
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

    /* Par moneda origen → destino */
    .cell-par {
      white-space: nowrap;
    }
    .cell-par .arrow {
      margin: 0 0.35rem;
      color: var(--color-gray-500);
      font-weight: 600;
    }
    .badge-moneda {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.55rem;
      border-radius: var(--radius-sm);
    }
    .badge-ARS {
      background: rgba(34, 197, 94, 0.12);
      color: #15803d;
    }
    .badge-USD_CABLE {
      background: rgba(59, 130, 246, 0.12);
      color: #2563eb;
    }
    .badge-USD_LOCAL {
      background: rgba(245, 158, 11, 0.12);
      color: #d97706;
    }
    .badge-USD_MEP {
      background: rgba(168, 85, 247, 0.12);
      color: #9333ea;
    }
    .kind-tag {
      display: inline-block;
      margin-left: 0.4rem;
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.1rem 0.45rem;
      border-radius: 999px;
      background: var(--color-gray-100);
      color: var(--color-gray-600);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .filter-empresa {
      min-width: 260px;
      flex: 1 1 260px;
      max-width: 340px;
    }

    :host ::ng-deep td.num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    :host ::ng-deep td.cell-monto {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
      white-space: nowrap;
    }
    .monto-line {
      display: flex;
      justify-content: flex-end;
      align-items: baseline;
      gap: 0.35rem;
    }
    .monto-line + .monto-line {
      margin-top: 0.15rem;
    }
    .monto-destino {
      font-weight: 500;
      font-size: 0.8125rem;
      color: var(--color-gray-600);
    }
    .monto-moneda {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--color-gray-500);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    :host ::ng-deep td.cell-entity { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    :host ::ng-deep td.cell-actions { white-space: nowrap; }
    :host ::ng-deep td.cell-dates {
      padding-top: 0.625rem;
      padding-bottom: 0.625rem;
      line-height: 1.3;
    }

    .date-line {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--color-gray-700);
      font-variant-numeric: tabular-nums;
    }
    .date-line + .date-line {
      margin-top: 0.2rem;
    }
    .date-tag {
      display: inline-block;
      min-width: 30px;
      text-align: center;
      font-size: 0.625rem;
      font-weight: 700;
      padding: 0.05rem 0.35rem;
      border-radius: 3px;
      background: var(--color-gray-100);
      color: var(--color-gray-600);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .date-tag.tag-green {
      background: rgba(34, 197, 94, 0.14);
      color: #15803d;
    }
    .date-tag.tag-blue {
      background: rgba(59, 130, 246, 0.14);
      color: #2563eb;
    }

    .row-actions {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
    }
    .btn-success {
      background: rgba(34, 197, 94, 0.12);
      color: #15803d;
      border-color: rgba(34, 197, 94, 0.3);
    }
    .btn-success:hover {
      background: rgba(34, 197, 94, 0.2);
    }

    @media (max-width: 600px) {
      .filter-empresa { min-width: 0; flex: 1 1 100%; max-width: none; }
      .filter-item { min-width: 0; flex: 1 1 calc(50% - 0.5rem); }
      .filter-item--wide { flex: 1 1 100%; }
      .filter-actions { margin-left: 0; width: 100%; flex-wrap: wrap; }
      .filter-actions > * { flex: 1 1 auto; }
      .row-actions { flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
      .row-actions::-webkit-scrollbar { display: none; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComprasMonedaExtranjeraListadoComponent implements OnInit {
  private service = inject(ComprasMonedaExtranjeraService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly monedas = MONEDAS;
  readonly monedaLabel = MONEDA_LABEL;

  // Data
  compras = signal<CompraMonedaExtranjera[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(5);
  loading = signal(true);

  // Draft filters (template-driven)
  draftMonedaOrigen: Moneda | 'all' = 'all';
  draftMonedaDestino: Moneda | 'all' = 'all';
  draftEstado: EstadoCompraMonedaExtranjera | 'all' = 'all';
  draftEmpresa = signal<EmpresaRef | null>(null);
  draftFechaDesde = '';
  draftFechaHasta = '';

  // Applied filters
  private appliedFilters = signal<CompraMonedaExtranjeraFilters>({});

  // Computed
  canWrite = computed(() =>
    ['admin', 'tesoreria'].includes(this.auth.user()?.role ?? ''),
  );
  // Ejecutar y Estimar son acciones operativas puras del operador.
  canExecute = computed(() =>
    this.auth.user()?.role === 'operador',
  );
  // Anular puede disparar el operador o el admin (este último como override).
  canAnular = computed(() =>
    ['admin', 'operador'].includes(this.auth.user()?.role ?? ''),
  );

  totalPages = computed(() => Math.ceil(this.total() / this.limit()) || 1);

  // Modal state
  showFormModal = signal(false);
  showAnularModal = signal(false);
  showEjecutarModal = signal(false);
  showEstimarModal = signal(false);
  selectedCompra = signal<CompraMonedaExtranjera | null>(null);

  // Detalle modal
  showDetalleModal = signal(false);
  detalleCompra = signal<CompraMonedaExtranjera | null>(null);
  detalleLoading = signal(false);

  columns: TableColumn[] = [
    { key: 'fechas', label: 'Fechas', width: '200px' },
    { key: 'par', label: 'Origen → Destino', width: '180px' },
    { key: 'empresa', label: 'Empresa' },
    { key: 'monto', label: 'Monto', width: '150px' },
    { key: 'estado', label: 'Estado', width: '120px' },
    { key: 'actions', label: '', width: '280px' },
  ];

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.service
      .getAll({ ...this.appliedFilters(), page: this.page(), limit: this.limit() })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.compras.set(res.data);
          this.total.set(res.total);
        },
        error: () => {
          this.toast.error('No se pudieron cargar las compras de divisas. Verificá los filtros e intentá de nuevo.');
        },
      });
  }

  applyFilters() {
    const f: CompraMonedaExtranjeraFilters = {};
    if (this.draftMonedaOrigen !== 'all') f.monedaOrigen = this.draftMonedaOrigen;
    if (this.draftMonedaDestino !== 'all') f.monedaDestino = this.draftMonedaDestino;
    if (this.draftEstado !== 'all') f.estado = this.draftEstado;
    const empresa = this.draftEmpresa();
    if (empresa) f.empresaId = empresa.empresaId;
    if (this.draftFechaDesde) f.fechaDesde = this.draftFechaDesde;
    if (this.draftFechaHasta) f.fechaHasta = this.draftFechaHasta;
    this.appliedFilters.set(f);
    this.page.set(1);
    this.load();
  }

  clearFilters() {
    this.draftMonedaOrigen = 'all';
    this.draftMonedaDestino = 'all';
    this.draftEstado = 'all';
    this.draftEmpresa.set(null);
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

  onPageSizeChange(size: number) {
    this.limit.set(size);
    this.page.set(1);
    this.load();
  }

  openCreateModal() {
    this.showFormModal.set(true);
  }

  openAnularModal(compra: CompraMonedaExtranjera) {
    this.selectedCompra.set(compra);
    this.showAnularModal.set(true);
  }

  openEjecutarModal(compra: CompraMonedaExtranjera) {
    this.selectedCompra.set(compra);
    this.showEjecutarModal.set(true);
  }

  openEstimarModal(compra: CompraMonedaExtranjera) {
    this.selectedCompra.set(compra);
    this.showEstimarModal.set(true);
  }

  openDetalleModal(id: string) {
    this.detalleCompra.set(null);
    this.detalleLoading.set(true);
    this.showDetalleModal.set(true);
    this.service.getOne(id).subscribe({
      next: (compra) => {
        this.detalleCompra.set(compra);
        this.detalleLoading.set(false);
      },
      error: (err) => {
        this.detalleLoading.set(false);
        this.showDetalleModal.set(false);
        this.toast.error(err?.error?.message ?? 'Error al cargar el detalle');
      },
    });
  }

  onModalSaved() {
    this.load();
  }

  labelOf(m: Moneda): string {
    return MONEDA_LABEL[m];
  }

  fmtNum(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) return '—';
    return value.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
