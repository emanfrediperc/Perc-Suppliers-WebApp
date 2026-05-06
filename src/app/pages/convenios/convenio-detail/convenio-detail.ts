import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ConvenioService } from '../../../services/convenio.service';
import { EmpresaProveedoraService } from '../../../services/empresa-proveedora.service';
import { Convenio, EmpresaProveedora } from '../../../models';
import { PageHeaderComponent } from '../../../shared/page-header/page-header';
import { GlassCardComponent } from '../../../shared/glass-card/glass-card';
import { GlassTableComponent, TableColumn } from '../../../shared/glass-table/glass-table';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge';
import { ToastService } from '../../../shared/toast/toast.service';
import { ConvenioFormModalComponent } from '../convenio-form-modal/convenio-form-modal';
import { ToastComponent } from '../../../shared/toast/toast';

@Component({
  selector: 'app-convenio-detail',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, PageHeaderComponent, GlassCardComponent, GlassTableComponent, ConfirmDialogComponent, StatusBadgeComponent, ToastComponent, ConvenioFormModalComponent],
  template: `
    <app-toast />
    @if (loading()) {
      <div class="card-glass" style="padding:2rem"><div class="skeleton skeleton-text-lg" style="width:40%"></div></div>
    } @else if (convenio()) {
      <app-page-header [title]="convenio()!.nombre" subtitle="Detalle del productor">
        <button class="btn-secondary" (click)="goBack()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Volver
        </button>
        <button class="btn-secondary" (click)="showConfig.set(true)" title="Configurar % y empresas asociadas">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </app-page-header>

      <!-- Badges arriba: total combinado adeudado + filtro por empresa -->
      <div class="badges-row">
        <div class="card-glass big-badge">
          <span class="big-badge-label">Total adeudado a este productor</span>
          <span class="big-badge-value">{{ totalAdeudado() | currency:'ARS':'ARS ':'1.2-2' }}</span>
          <span class="big-badge-sub">{{ convenio()!.empresasProveedoras?.length || 0 }} empresas asociadas</span>
        </div>
        <div class="card-glass big-badge">
          <span class="big-badge-label">Filtrar histórico por empresa</span>
          <select class="filter-select" [(ngModel)]="filtroEmpresa" (change)="loadHistorico()">
            <option value="">Todas las empresas</option>
            @for (e of (convenio()!.empresasProveedoras || []); track e._id) {
              <option [value]="e._id">{{ e.razonSocial }}</option>
            }
          </select>
          @if (filtroEmpresa) {
            <span class="big-badge-sub">{{ saldoEmpresaFiltrada() | currency:'ARS':'ARS ':'1.2-2' }} pendiente · {{ facturasFiltradas().length }} facturas</span>
          } @else {
            <span class="big-badge-sub">{{ facturasFiltradas().length }} facturas en el histórico</span>
          }
        </div>
      </div>

      <div class="detail-grid">
        <app-glass-card title="Reglas del Productor">
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Honorarios</span><span class="info-value">{{ convenio()!.comisionPorcentaje }}%</span></div>
            <div class="info-item"><span class="info-label">Descuento</span><span class="info-value">{{ convenio()!.descuentoPorcentaje }}%</span></div>
            @if (convenio()!.reglas) {
              <div class="info-item"><span class="info-label">Honorarios Min.</span><span class="info-value">{{ convenio()!.reglas!.comisionMinima }}</span></div>
              <div class="info-item"><span class="info-label">Honorarios Max.</span><span class="info-value">{{ convenio()!.reglas!.comisionMaxima }}</span></div>
              <div class="info-item"><span class="info-label">Dias de pago</span><span class="info-value">{{ convenio()!.reglas!.diasPago }}</span></div>
              <div class="info-item"><span class="info-label">IVA sobre honorarios</span><span class="info-value">{{ convenio()!.reglas!.aplicaIVASobreComision ? 'Si' : 'No' }}</span></div>
            }
            <div class="info-item"><span class="info-label">Estado</span><span class="info-value">
              <span class="badge" [class]="convenio()!.activo ? 'bg-glass-green' : 'bg-glass-red'">{{ convenio()!.activo ? 'Activo' : 'Inactivo' }}</span>
            </span></div>
          </div>
          @if (convenio()!.descripcion) {
            <p class="description">{{ convenio()!.descripcion }}</p>
          }
        </app-glass-card>
      </div>

      <div class="section-header">
        <h3 class="section-title">Empresas Asociadas ({{ convenio()!.empresasProveedoras?.length || 0 }})</h3>
        <div class="add-empresa">
          <select [(ngModel)]="selectedEmpresa" class="select-input">
            <option value="">Seleccionar empresa...</option>
            @for (e of availableEmpresas(); track e._id) {
              <option [value]="e._id">{{ e.razonSocial }} ({{ e.cuit }})</option>
            }
          </select>
          <button class="btn-primary btn-sm" (click)="addEmpresa()" [disabled]="!selectedEmpresa || adding()">
            @if (adding()) { <span class="spinner"></span> }
            Agregar
          </button>
        </div>
      </div>

      @if (convenio()!.empresasProveedoras?.length) {
        <app-glass-table [columns]="empresaColumns" [data]="convenio()!.empresasProveedoras">
          <ng-template #row let-e>
            <td>{{ e.razonSocial }}</td>
            <td>{{ e.cuit }}</td>
            <td>{{ e.condicionIva || '-' }}</td>
            <td>
              <button class="btn-remove" (click)="confirmRemove(e)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </td>
          </ng-template>
        </app-glass-table>
      }

      <!-- Histórico de facturas -->
      <div class="section-header" style="margin-top:1.5rem">
        <h3 class="section-title">Histórico {{ filtroEmpresa ? 'de la empresa seleccionada' : 'completo' }} ({{ facturasFiltradas().length }})</h3>
        <button class="btn-secondary btn-sm" (click)="exportarHistorico()" [disabled]="!facturasFiltradas().length">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Excel
        </button>
      </div>
      @if (loadingHist()) {
        <div class="card-glass" style="padding:1.5rem"><div class="skeleton skeleton-text" style="width:60%"></div></div>
      } @else if (facturasFiltradas().length === 0) {
        <div class="card-glass" style="padding:1.5rem;text-align:center;color:var(--color-gray-500)">Sin facturas en el histórico</div>
      } @else {
        <app-glass-card>
          <table class="hist-table">
            <thead>
              <tr><th>Fecha</th><th>Número</th><th>Tipo</th><th>Proveedor</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Estado</th></tr>
            </thead>
            <tbody>
              @for (f of facturasFiltradas(); track f._id) {
                <tr>
                  <td>{{ f.fecha | date:'dd/MM/yyyy' }}</td>
                  <td>{{ f.numero }}</td>
                  <td>{{ f.tipo }}</td>
                  <td>{{ f.empresaProveedora?.razonSocial }}</td>
                  <td>{{ f.montoTotal | currency:'ARS':'ARS ':'1.2-2' }}</td>
                  <td>{{ f.montoPagado | currency:'ARS':'ARS ':'1.2-2' }}</td>
                  <td>{{ f.saldoPendiente | currency:'ARS':'ARS ':'1.2-2' }}</td>
                  <td><app-status-badge [status]="f.estado" /></td>
                </tr>
              }
            </tbody>
          </table>
        </app-glass-card>
      }
    }

    <app-convenio-form-modal [open]="showConfig()" [entity]="convenio()" (close)="showConfig.set(false)" (saved)="onConfigSaved()" />

    <app-confirm-dialog
      [open]="showConfirm()"
      title="Quitar empresa"
      [message]="'Desea quitar a ' + (empresaToRemove()?.razonSocial || '') + ' de este productor?'"
      confirmText="Quitar"
      confirmClass="danger"
      (confirm)="removeEmpresa()"
      (cancel)="showConfirm.set(false)"
    />
  `,
  styles: [`
    :host { display: block; }
    .detail-grid { margin-bottom: 1.5rem; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.125rem; }
    .info-label { font-size: 0.75rem; font-weight: 500; color: var(--color-gray-500); text-transform: uppercase; letter-spacing: 0.05em; }
    .info-value { font-size: 0.9375rem; font-weight: 500; color: var(--color-gray-900); }
    .description { font-size: 0.875rem; color: var(--color-gray-600); margin-top: 1rem; line-height: 1.5; }
    .badge { font-size: 0.75rem; font-weight: 500; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.75rem; }
    .section-title { font-size: 1rem; font-weight: 600; color: var(--color-gray-900); }
    .add-empresa { display: flex; gap: 0.5rem; align-items: center; }
    .select-input {
      padding: 0.5rem 0.75rem; border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-md); font-size: 0.875rem;
      background: var(--glass-bg); backdrop-filter: blur(10px);
      color: var(--color-gray-900); min-width: 240px;
    }
    .btn-sm { padding: 0.5rem 1rem !important; font-size: 0.875rem !important; }
    .btn-remove {
      background: none; border: none; color: var(--color-error); cursor: pointer;
      padding: 0.25rem; border-radius: var(--radius-sm);
      transition: background var(--transition-fast);
    }
    .btn-remove:hover { background: rgba(239, 68, 68, 0.1); }

    .badges-row { display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1rem; margin-bottom:1.25rem; }
    .big-badge { padding:1.125rem 1.25rem; display:flex; flex-direction:column; gap:0.375rem; }
    .big-badge-label { font-size:0.75rem; color:var(--color-gray-500); text-transform:uppercase; letter-spacing:0.05em; font-weight:600; }
    .big-badge-value { font-size:1.5rem; font-weight:700; color:var(--color-gray-900); font-variant-numeric:tabular-nums; }
    .big-badge-sub { font-size:0.75rem; color:var(--color-gray-600); }
    .filter-select { padding:0.5rem 0.75rem; border:1px solid var(--color-gray-200); border-radius:var(--radius-md); font-size:0.875rem; background:var(--glass-bg); color:var(--color-gray-900); }
    .filter-select:focus { outline:none; border-color:var(--color-primary); }

    .hist-table { width:100%; border-collapse:collapse; font-size:0.8125rem; }
    .hist-table thead th { text-align:left; padding:0.625rem 0.75rem; border-bottom:1px solid var(--color-gray-200); font-weight:600; color:var(--color-gray-600); font-size:0.6875rem; text-transform:uppercase; letter-spacing:0.05em; }
    .hist-table tbody td { padding:0.625rem 0.75rem; border-bottom:1px solid var(--color-gray-100); font-variant-numeric:tabular-nums; }
    .hist-table tbody tr:hover { background:rgba(99,102,241,0.04); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConvenioDetailComponent implements OnInit {
  loading = signal(true);
  convenio = signal<Convenio | null>(null);
  availableEmpresas = signal<EmpresaProveedora[]>([]);
  selectedEmpresa = '';
  adding = signal(false);
  showConfirm = signal(false);
  empresaToRemove = signal<EmpresaProveedora | null>(null);
  showConfig = signal(false);

  filtroEmpresa = '';
  loadingHist = signal(false);
  historico = signal<{
    productor: any;
    totalCombinadoAdeudado: number;
    porEmpresa: { _id: string; razonSocial: string; saldoPendiente: number; cantidad: number }[];
    facturas: any[];
  } | null>(null);

  totalAdeudado = computed(() => this.historico()?.totalCombinadoAdeudado ?? 0);
  facturasFiltradas = computed(() => this.historico()?.facturas ?? []);
  saldoEmpresaFiltrada = computed(() => {
    const f = this.filtroEmpresa;
    if (!f) return 0;
    const found = this.historico()?.porEmpresa?.find(p => p._id === f);
    return found?.saldoPendiente ?? 0;
  });

  empresaColumns: TableColumn[] = [
    { key: 'razonSocial', label: 'Razon Social', width: '35%' },
    { key: 'cuit', label: 'CUIT', width: '25%' },
    { key: 'condicionIva', label: 'Cond. IVA', width: '25%' },
    { key: 'acciones', label: '', width: '15%' },
  ];

  constructor(
    private route: ActivatedRoute,
    private service: ConvenioService,
    private empresaService: EmpresaProveedoraService,
    private router: Router,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadConvenio();
    this.loadEmpresas();
    this.loadHistorico();
  }

  loadConvenio() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.getById(id).subscribe({
      next: (data) => { this.convenio.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/convenios']); },
    });
  }

  loadHistorico() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadingHist.set(true);
    this.service.getHistorico(id, this.filtroEmpresa || undefined).subscribe({
      next: (data) => { this.historico.set(data); this.loadingHist.set(false); },
      error: () => { this.loadingHist.set(false); this.toast.error('Error cargando histórico'); },
    });
  }

  exportarHistorico() {
    const id = this.route.snapshot.paramMap.get('id')!;
    window.open(this.service.historicoExportUrl(id, this.filtroEmpresa || undefined), '_blank');
  }

  onConfigSaved() {
    this.showConfig.set(false);
    this.loadConvenio();
    this.loadHistorico();
  }

  loadEmpresas() {
    this.empresaService.getAll({ limit: 200, sinConvenio: true } as any).subscribe({
      next: (res) => this.availableEmpresas.set(res.data),
    });
  }

  addEmpresa() {
    if (!this.selectedEmpresa) return;
    this.adding.set(true);
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.addEmpresa(id, this.selectedEmpresa).subscribe({
      next: () => {
        this.adding.set(false);
        this.selectedEmpresa = '';
        this.toast.success('Empresa agregada al productor');
        this.loadConvenio();
      },
      error: () => { this.adding.set(false); this.toast.error('Error al agregar empresa'); },
    });
  }

  confirmRemove(empresa: EmpresaProveedora) {
    this.empresaToRemove.set(empresa);
    this.showConfirm.set(true);
  }

  removeEmpresa() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const empresaId = this.empresaToRemove()?._id;
    if (!empresaId) return;
    this.showConfirm.set(false);
    this.service.removeEmpresa(id, empresaId).subscribe({
      next: () => { this.toast.success('Empresa quitada del productor'); this.loadConvenio(); },
      error: () => this.toast.error('Error al quitar empresa'),
    });
  }

  goBack() { this.router.navigate(['/convenios']); }
}
