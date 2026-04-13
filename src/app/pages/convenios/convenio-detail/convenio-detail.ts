import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConvenioService } from '../../../services/convenio.service';
import { EmpresaProveedoraService } from '../../../services/empresa-proveedora.service';
import { Convenio, EmpresaProveedora } from '../../../models';
import { PageHeaderComponent } from '../../../shared/page-header/page-header';
import { GlassCardComponent } from '../../../shared/glass-card/glass-card';
import { GlassTableComponent, TableColumn } from '../../../shared/glass-table/glass-table';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../shared/toast/toast.service';
import { ToastComponent } from '../../../shared/toast/toast';

@Component({
  selector: 'app-convenio-detail',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, GlassCardComponent, GlassTableComponent, ConfirmDialogComponent, ToastComponent],
  template: `
    <app-toast />
    @if (loading()) {
      <div class="card-glass" style="padding:2rem"><div class="skeleton skeleton-text-lg" style="width:40%"></div></div>
    } @else if (convenio()) {
      <app-page-header [title]="convenio()!.nombre" subtitle="Detalle del convenio">
        <button class="btn-secondary" (click)="goBack()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Volver
        </button>
      </app-page-header>

      <div class="detail-grid">
        <app-glass-card title="Reglas del Convenio">
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Comision</span><span class="info-value">{{ convenio()!.comisionPorcentaje }}%</span></div>
            <div class="info-item"><span class="info-label">Descuento</span><span class="info-value">{{ convenio()!.descuentoPorcentaje }}%</span></div>
            @if (convenio()!.reglas) {
              <div class="info-item"><span class="info-label">Comision Min.</span><span class="info-value">{{ convenio()!.reglas!.comisionMinima }}</span></div>
              <div class="info-item"><span class="info-label">Comision Max.</span><span class="info-value">{{ convenio()!.reglas!.comisionMaxima }}</span></div>
              <div class="info-item"><span class="info-label">Dias de pago</span><span class="info-value">{{ convenio()!.reglas!.diasPago }}</span></div>
              <div class="info-item"><span class="info-label">IVA sobre comision</span><span class="info-value">{{ convenio()!.reglas!.aplicaIVASobreComision ? 'Si' : 'No' }}</span></div>
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
    }

    <app-confirm-dialog
      [open]="showConfirm()"
      title="Quitar empresa"
      [message]="'Desea quitar a ' + (empresaToRemove()?.razonSocial || '') + ' de este convenio?'"
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
  }

  loadConvenio() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.getById(id).subscribe({
      next: (data) => { this.convenio.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/convenios']); },
    });
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
        this.toast.success('Empresa agregada al convenio');
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
      next: () => { this.toast.success('Empresa quitada del convenio'); this.loadConvenio(); },
      error: () => this.toast.error('Error al quitar empresa'),
    });
  }

  goBack() { this.router.navigate(['/convenios']); }
}
