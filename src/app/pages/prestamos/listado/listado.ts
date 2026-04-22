import { Component, OnInit, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/page-header/page-header';
import { GlassCardComponent } from '../../../shared/glass-card/glass-card';
import { GlassTableComponent, TableColumn } from '../../../shared/glass-table/glass-table';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge';
import { SkeletonTableComponent } from '../../../shared/skeleton-table/skeleton-table';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog';
import { ToastComponent } from '../../../shared/toast/toast';
import { ToastService } from '../../../shared/toast/toast.service';
import { AuthService } from '../../../services/auth.service';
import { PrestamosService } from '../../../services/prestamos.service';
import { ExportService } from '../../../services/export.service';
import { PrestamoFormModalComponent } from '../modals/prestamo-form-modal/prestamo-form-modal';
import { PrestamoEditModalComponent } from '../modals/prestamo-edit-modal/prestamo-edit-modal';
import { PrestamoRenewModalComponent } from '../modals/prestamo-renew-modal/prestamo-renew-modal';
import { PrestamoHistoryModalComponent } from '../modals/prestamo-history-modal/prestamo-history-modal';
import { EmpresaPickerComponent } from '../../../shared/empresa-picker/empresa-picker';
import type {
  PrestamoWithComputed,
  CurrencyCard,
  CurrencyPosition,
  PrestamoFilters,
  PrestamoStatus,
  Currency,
  Vehicle,
  BalanceCut,
  EmpresaRef,
} from '../../../models/prestamo';

@Component({
  selector: 'app-prestamos-listado',
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
    ConfirmDialogComponent,
    ToastComponent,
    PrestamoFormModalComponent,
    PrestamoEditModalComponent,
    PrestamoRenewModalComponent,
    PrestamoHistoryModalComponent,
    EmpresaPickerComponent,
  ],
  template: `
    <app-toast />

    <app-page-header title="Préstamos" subtitle="Gestión de pase de cuenta intercompañía">
      <button class="btn-secondary" (click)="exportar('xlsx')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Exportar Excel
      </button>
      @if (canWrite()) {
        <button class="btn-primary" (click)="openCreateModal()">+ Registrar Préstamo</button>
      }
    </app-page-header>

    <!-- Filters -->
    <div class="filters-card card-glass">
      <div class="filters-row">
        <div class="filter-item">
          <label>Estado</label>
          <select [(ngModel)]="draftStatus">
            <option value="all">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="CLEARED">Cancelados</option>
            <option value="RENEWED">Renovados</option>
            <option value="ESPERANDO_APROBACION">Esperando aprobación</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>
        </div>
        <div class="filter-item">
          <label>Moneda</label>
          <select [(ngModel)]="draftCurrency">
            <option value="all">Todas</option>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
            <option value="USDC">USDC</option>
          </select>
        </div>
        <div class="filter-item">
          <label>Vehículo</label>
          <select [(ngModel)]="draftVehicle">
            <option value="all">Todos</option>
            <option value="PAGARE">Pagaré</option>
            <option value="TITULOS_ON">Títulos ON</option>
            <option value="CVU_TITULOS">CVU→Títulos</option>
            <option value="CRYPTO_UY">Crypto UY</option>
          </select>
        </div>
        <div class="filter-item">
          <label>Corte</label>
          <select [(ngModel)]="draftBalanceCut">
            <option value="all">Todos</option>
            <option value="12-31">12-31</option>
            <option value="06-30">06-30</option>
          </select>
        </div>
        <div class="filter-item filter-empresa">
          <app-empresa-picker
            label="Empresa"
            placeholder="Acreedor o deudor..."
            [(selected)]="draftEmpresa" />
        </div>
        <div class="filter-actions">
          <button class="btn-primary" (click)="applyFilters()">Buscar</button>
          <button class="btn-secondary" (click)="resetFilters()">Limpiar</button>
        </div>
      </div>
    </div>

    <!-- Summary cards -->
    @if (!loading() && summaryCards().length > 0) {
      <div class="summary-grid">
        @for (card of summaryCards(); track card.currency) {
          <app-glass-card [title]="card.currency + ' · ' + card.count + ' activos'">
            <div class="summary-row">
              <span class="k">Capital</span>
              <span class="v">{{ fmtC(card.totalCapital, card.currency) }}</span>
            </div>
            <div class="summary-row">
              <span class="k">Interés acumulado</span>
              <span class="v">{{ fmtC(card.totalInterest, card.currency) }}</span>
            </div>
            <div class="summary-row total">
              <span class="k">Total a cobrar</span>
              <span class="v">{{ fmtC(card.totalAmount, card.currency) }}</span>
            </div>
          </app-glass-card>
        }
      </div>
    }

    <!-- Loans table -->
    <h2 class="section-title">Listado</h2>
    @if (loading()) {
      <app-skeleton-table [rows]="5" [cols]="10" />
    } @else if (loans().length === 0) {
      <app-empty-state
        title="Sin préstamos"
        message="No hay préstamos que coincidan con los filtros aplicados."
      />
    } @else {
      <app-glass-table [columns]="columns" [data]="loans()">
        <ng-template #row let-loan>
          <td class="cell-entity">{{ loan.lender.razonSocialCache }}</td>
          <td class="cell-entity">{{ loan.borrower.razonSocialCache }}</td>
          <td>{{ loan.currency }}</td>
          <td class="num">{{ fmtC(loan.capital, loan.currency) }}</td>
          <td class="num">{{ loan.rate }}%</td>
          <td>{{ loan.dueDate | date: 'dd/MM/yyyy' }}</td>
          <td class="num" [class.danger]="loan.computed.daysToMaturity < 0" [class.warn]="loan.computed.daysToMaturity >= 0 && loan.computed.daysToMaturity < 30">
            {{ loan.status === 'ACTIVE' ? loan.computed.daysToMaturity + 'd' : '—' }}
          </td>
          <td class="num">{{ fmtC(loan.computed.interest, loan.currency) }}</td>
          <td class="num">
            <strong>{{ fmtC(loan.computed.total, loan.currency) }}</strong>
          </td>
          <td><app-status-badge [status]="loan.status" /></td>
          <td class="cell-actions">
            <div class="row-actions">
              @if (loan.status === 'ACTIVE') {
                @if (canWrite()) {
                  <button class="btn-sm" (click)="openEditModal(loan)" title="Editar">✎</button>
                }
                @if (canChangeStatus()) {
                  <button class="btn-sm" (click)="openRenewModal(loan)" title="Renovar">↻</button>
                  <button class="btn-sm btn-warn" (click)="requestClear(loan)" title="Cancelar">⊘</button>
                }
              }
              <button class="btn-sm" (click)="openHistoryModal(loan)" title="Historial">⌚</button>
              @if (canDelete() && loan.status === 'ACTIVE') {
                <button class="btn-sm btn-danger" (click)="requestDelete(loan)" title="Eliminar">✕</button>
              }
            </div>
          </td>
        </ng-template>
      </app-glass-table>
    }

    <!-- Net position -->
    @if (!loading() && netPositions().length > 0) {
      <h2 class="section-title">Posición Neta</h2>
      <div class="netpos-grid">
        @for (pos of netPositions(); track pos.currency) {
          <app-glass-card [title]="'Posición neta · ' + pos.currency">
            <table class="netpos-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th class="num">Prestó</th>
                  <th class="num">Tomó</th>
                  <th class="num">Neto</th>
                </tr>
              </thead>
              <tbody>
                @for (ent of pos.entities; track ent.empresaId) {
                  <tr>
                    <td>{{ ent.name }}</td>
                    <td class="num">{{ fmtC(ent.lent, pos.currency) }}</td>
                    <td class="num">{{ fmtC(ent.borrowed, pos.currency) }}</td>
                    <td
                      class="num"
                      [class.positive]="ent.net > 0"
                      [class.negative]="ent.net < 0"
                    >
                      {{ fmtC(ent.net, pos.currency) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </app-glass-card>
        }
      </div>
    }

    <!-- Clear confirm -->
    <app-confirm-dialog
      [open]="showClearConfirm()"
      title="Cancelar préstamo"
      message="Esta acción marcará el préstamo como cancelado y calculará intereses al día de hoy. No se puede deshacer."
      confirmText="Cancelar préstamo"
      confirmClass="danger"
      (confirm)="confirmClear()"
      (cancel)="cancelClearConfirm()"
    />

    <!-- Delete confirm -->
    <app-confirm-dialog
      [open]="showDeleteConfirm()"
      title="Eliminar préstamo"
      message="Esta acción eliminará permanentemente el préstamo. No se puede deshacer."
      confirmText="Eliminar"
      confirmClass="danger"
      (confirm)="confirmDelete()"
      (cancel)="cancelDeleteConfirm()"
    />

    <!-- CRUD Modals -->
    <app-prestamo-form-modal
      [open]="showFormModal()"
      (close)="showFormModal.set(false)"
      (saved)="onModalSaved()"
    />

    <app-prestamo-edit-modal
      [open]="showEditModal()"
      [loan]="selectedLoan()"
      (close)="showEditModal.set(false)"
      (saved)="onModalSaved()"
    />

    <app-prestamo-renew-modal
      [open]="showRenewModal()"
      [loan]="selectedLoan()"
      (close)="showRenewModal.set(false)"
      (saved)="onModalSaved()"
    />

    <app-prestamo-history-modal
      [open]="showHistoryModal()"
      [loan]="selectedLoan()"
      (close)="showHistoryModal.set(false)"
    />
  `,
  styles: [
    `
      :host {
        display: block;
      }

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
      .btn-primary:hover {
        background: var(--color-primary-dark);
      }

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
      .btn-secondary:hover {
        background: var(--color-gray-200);
      }

      .btn-sm {
        background: var(--color-gray-100);
        color: var(--color-gray-700);
        border: 1px solid var(--color-gray-200);
        border-radius: var(--radius-sm);
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
        cursor: pointer;
        line-height: 1;
      }
      .btn-sm:hover {
        background: var(--color-gray-200);
        border-color: var(--color-gray-300);
      }
      .btn-sm.btn-warn {
        color: var(--color-warning);
        border-color: var(--color-warning);
      }
      .btn-sm.btn-warn:hover {
        background: rgba(245, 158, 11, 0.1);
      }
      .btn-sm.btn-danger {
        color: var(--color-error);
        border-color: var(--color-error);
      }
      .btn-sm.btn-danger:hover {
        background: rgba(239, 68, 68, 0.1);
      }

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

      .filter-item label {
        font-size: 0.6875rem;
        color: var(--color-gray-500);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
      }

      .filter-item select {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--color-gray-200);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        background: var(--color-white);
        color: var(--color-gray-900);
        min-width: 140px;
      }
      .filter-item select:focus {
        outline: none;
        border-color: var(--color-primary);
      }

      .filter-empresa {
        min-width: 280px;
        flex: 1 1 280px;
        max-width: 360px;
      }

      .filter-actions {
        display: flex;
        gap: 0.5rem;
        margin-left: auto;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 0.375rem 0;
        font-size: 0.875rem;
        border-bottom: 1px solid var(--color-gray-100);
      }
      .summary-row:last-child {
        border-bottom: none;
      }
      .summary-row.total {
        margin-top: 0.5rem;
        padding-top: 0.625rem;
        border-top: 2px solid var(--color-gray-200);
        font-weight: 700;
      }
      .summary-row .k {
        color: var(--color-gray-500);
      }
      .summary-row .v {
        color: var(--color-gray-900);
        font-variant-numeric: tabular-nums;
        font-weight: 600;
      }

      .section-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-gray-900);
        margin: 1.5rem 0 0.75rem;
      }

      :host ::ng-deep td.num {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      :host ::ng-deep td.num.positive {
        color: var(--color-success);
        font-weight: 600;
      }
      :host ::ng-deep td.num.negative {
        color: var(--color-error);
        font-weight: 600;
      }
      :host ::ng-deep td.num.warn {
        color: var(--color-warning);
      }
      :host ::ng-deep td.num.danger {
        color: var(--color-error);
        font-weight: 600;
      }
      :host ::ng-deep td.cell-actions {
        white-space: nowrap;
      }

      .row-actions {
        display: flex;
        gap: 0.25rem;
      }

      .netpos-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .netpos-table {
        width: 100%;
        border-collapse: collapse;
      }
      .netpos-table th {
        text-align: left;
        font-size: 0.6875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-gray-500);
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid var(--color-gray-200);
        font-weight: 600;
      }
      .netpos-table th.num,
      .netpos-table td.num {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .netpos-table td {
        padding: 0.5rem 0.75rem;
        font-size: 0.8125rem;
        color: var(--color-gray-700);
        border-bottom: 1px solid var(--color-gray-100);
      }
      .netpos-table tr:last-child td {
        border-bottom: none;
      }
      .netpos-table td.positive {
        color: var(--color-success);
        font-weight: 600;
      }
      .netpos-table td.negative {
        color: var(--color-error);
        font-weight: 600;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrestamosListadoComponent implements OnInit {
  private service = inject(PrestamosService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private exportService = inject(ExportService);

  exportar(formato: 'xlsx' | 'csv') {
    const params: Record<string, any> = {};
    const f = this.appliedFilters();
    if (f.status) params['status'] = f.status;
    if (f.currency) params['currency'] = f.currency;
    if (f.vehicle) params['vehicle'] = f.vehicle;
    if (f.balanceCut) params['balanceCut'] = f.balanceCut;
    if (f.empresaId) params['empresaId'] = f.empresaId;
    this.exportService.download('prestamos/export', formato, params);
  }

  // Data
  loans = signal<PrestamoWithComputed[]>([]);
  summaryCards = signal<CurrencyCard[]>([]);
  netPositions = signal<CurrencyPosition[]>([]);
  loading = signal(true);

  // Draft filter state (template-driven)
  draftStatus: PrestamoStatus | 'all' = 'all';
  draftCurrency: Currency | 'all' = 'all';
  draftVehicle: Vehicle | 'all' = 'all';
  draftBalanceCut: BalanceCut | 'all' = 'all';
  draftEmpresa = signal<EmpresaRef | null>(null);

  // Applied filters (what's actually been fetched)
  private appliedFilters = signal<PrestamoFilters>({});

  // Role gating
  canWrite = computed(() =>
    ['admin', 'tesoreria'].includes(this.auth.user()?.role ?? ''),
  );
  canChangeStatus = computed(() =>
    ['admin', 'tesoreria', 'operador'].includes(this.auth.user()?.role ?? ''),
  );
  canDelete = computed(() =>
    ['admin', 'tesoreria'].includes(this.auth.user()?.role ?? ''),
  );

  // Modal state (form/edit/renew/history)
  showFormModal = signal(false);
  showEditModal = signal(false);
  showRenewModal = signal(false);
  showHistoryModal = signal(false);
  selectedLoan = signal<PrestamoWithComputed | null>(null);

  // Clear flow
  showClearConfirm = signal(false);
  private loanToClear: PrestamoWithComputed | null = null;

  // Delete flow
  showDeleteConfirm = signal(false);
  private loanToDelete: PrestamoWithComputed | null = null;

  columns: TableColumn[] = [
    { key: 'lender', label: 'Acreedor' },
    { key: 'borrower', label: 'Deudor' },
    { key: 'currency', label: 'Mon.', width: '60px' },
    { key: 'capital', label: 'Capital' },
    { key: 'rate', label: 'Tasa', width: '70px' },
    { key: 'dueDate', label: 'Venc.' },
    { key: 'daysToMaturity', label: 'Resta', width: '70px' },
    { key: 'interest', label: 'Interés' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Estado', width: '110px' },
    { key: 'actions', label: '', width: '180px' },
  ];

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    const filters = this.appliedFilters();
    forkJoin({
      loans: this.service.getAll(filters),
      summary: this.service.getDashboardSummary(filters.currency),
      netPos: this.service.getNetPosition(filters.currency),
    }).subscribe({
      next: ({ loans, summary, netPos }) => {
        this.loans.set(loans);
        this.summaryCards.set(summary.cards);
        this.netPositions.set(netPos.positions);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error al cargar préstamos');
        this.loading.set(false);
      },
    });
  }

  applyFilters() {
    const f: PrestamoFilters = {};
    if (this.draftStatus !== 'all') f.status = this.draftStatus;
    if (this.draftCurrency !== 'all') f.currency = this.draftCurrency;
    if (this.draftVehicle !== 'all') f.vehicle = this.draftVehicle;
    if (this.draftBalanceCut !== 'all') f.balanceCut = this.draftBalanceCut;
    const empresa = this.draftEmpresa();
    if (empresa) f.empresaId = empresa.empresaId;
    this.appliedFilters.set(f);
    this.load();
  }

  resetFilters() {
    this.draftStatus = 'all';
    this.draftCurrency = 'all';
    this.draftVehicle = 'all';
    this.draftBalanceCut = 'all';
    this.draftEmpresa.set(null);
    this.appliedFilters.set({});
    this.load();
  }

  // Modal openers
  openCreateModal() {
    this.showFormModal.set(true);
  }
  openEditModal(loan: PrestamoWithComputed) {
    this.selectedLoan.set(loan);
    this.showEditModal.set(true);
  }
  openRenewModal(loan: PrestamoWithComputed) {
    this.selectedLoan.set(loan);
    this.showRenewModal.set(true);
  }
  openHistoryModal(loan: PrestamoWithComputed) {
    this.selectedLoan.set(loan);
    this.showHistoryModal.set(true);
  }

  onModalSaved() {
    this.load();
  }

  // Clear flow (uses confirm-dialog directly)
  requestClear(loan: PrestamoWithComputed) {
    this.loanToClear = loan;
    this.showClearConfirm.set(true);
  }
  confirmClear() {
    if (!this.loanToClear) return;
    const id = this.loanToClear._id;
    this.service.clear(id).subscribe({
      next: () => {
        this.toast.success('Préstamo cancelado');
        this.showClearConfirm.set(false);
        this.loanToClear = null;
        this.load();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error al cancelar préstamo');
        this.showClearConfirm.set(false);
      },
    });
  }
  cancelClearConfirm() {
    this.showClearConfirm.set(false);
    this.loanToClear = null;
  }

  // Delete flow
  requestDelete(loan: PrestamoWithComputed) {
    this.loanToDelete = loan;
    this.showDeleteConfirm.set(true);
  }
  confirmDelete() {
    if (!this.loanToDelete) return;
    const id = this.loanToDelete._id;
    this.service.remove(id).subscribe({
      next: () => {
        this.toast.success('Préstamo eliminado');
        this.showDeleteConfirm.set(false);
        this.loanToDelete = null;
        this.load();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error al eliminar préstamo');
        this.showDeleteConfirm.set(false);
      },
    });
  }
  cancelDeleteConfirm() {
    this.showDeleteConfirm.set(false);
    this.loanToDelete = null;
  }

  // Inline currency formatter (es-AR with ARS/USD/USDC)
  fmtC(value: number | null | undefined, currency: string): string {
    if (value == null) return '—';
    const parts = Math.abs(value).toFixed(0).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const formatted = (value < 0 ? '-' : '') + parts.join(',');
    switch (currency) {
      case 'ARS':
        return `$${formatted}`;
      case 'USDC':
        return `${formatted} USDC`;
      default:
        return `USD ${formatted}`;
    }
  }
}
