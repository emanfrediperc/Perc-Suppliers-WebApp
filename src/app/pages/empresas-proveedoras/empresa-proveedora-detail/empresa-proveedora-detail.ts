import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpresaProveedoraService } from '../../../services/empresa-proveedora.service';
import { ConvenioService } from '../../../services/convenio.service';
import { FacturaService } from '../../../services/factura.service';
import { EmpresaProveedora, Convenio, Factura } from '../../../models';
import { PageHeaderComponent } from '../../../shared/page-header/page-header';
import { GlassCardComponent } from '../../../shared/glass-card/glass-card';
import { GlassTableComponent, TableColumn } from '../../../shared/glass-table/glass-table';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge';
import { ToastService } from '../../../shared/toast/toast.service';
import { ToastComponent } from '../../../shared/toast/toast';
import { EmpresaProveedoraFormModalComponent } from '../empresa-proveedora-form-modal/empresa-proveedora-form-modal';
import { GlassModalComponent } from '../../../shared/glass-modal/glass-modal';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-empresa-proveedora-detail',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, PageHeaderComponent, GlassCardComponent, GlassTableComponent, StatusBadgeComponent, ToastComponent, EmpresaProveedoraFormModalComponent, GlassModalComponent],
  template: `
    <app-toast />
    @if (loading()) {
      <div class="card-glass" style="padding:2rem"><div class="skeleton skeleton-text-lg" style="width:40%"></div></div>
    } @else if (empresa()) {
      <app-page-header [title]="empresa()!.razonSocial" [subtitle]="'CUIT: ' + empresa()!.cuit">
        <button class="btn-secondary" (click)="goBack()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Volver
        </button>
        <button class="btn-primary" (click)="showEdit.set(true)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Editar
        </button>
        @if (auth.user()?.role === 'admin') {
          @if (empresa()!.apocrifoOverride) {
            <button class="btn-secondary" (click)="quitarApocrifoOverride()" title="Volver a aplicar el chequeo apócrifo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              Quitar override apócrifo
            </button>
          } @else {
            <button class="btn-secondary" (click)="showOverride.set(true)" title="Saltear chequeo apócrifo (cuando AFIP marca por error)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Override apócrifo
            </button>
          }
        }
      </app-page-header>

      @if (empresa()!.apocrifoOverride) {
        <div class="override-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <div>
            <strong>Override apócrifo activo</strong>
            <p>Las facturas de este proveedor NO son bloqueadas por el chequeo apócrifo de AFIP. {{ empresa()!.apocrifoOverrideMotivo }} <em>· por {{ empresa()!.apocrifoOverridePor }} · {{ empresa()!.apocrifoOverrideFecha | date:'dd/MM/yyyy' }}</em></p>
          </div>
        </div>
      }

      <div class="detail-grid">
        <app-glass-card title="Informacion General">
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Razon Social</span><span class="info-value">{{ empresa()!.razonSocial }}</span></div>
            <div class="info-item"><span class="info-label">CUIT</span><span class="info-value">{{ empresa()!.cuit }}</span></div>
            @if (empresa()!.nombreFantasia) {
              <div class="info-item"><span class="info-label">Nombre Fantasia</span><span class="info-value">{{ empresa()!.nombreFantasia }}</span></div>
            }
            <div class="info-item"><span class="info-label">Condicion IVA</span><span class="info-value">{{ empresa()!.condicionIva || '-' }}</span></div>
            <div class="info-item"><span class="info-label">Email</span><span class="info-value">{{ empresa()!.email || '-' }}</span></div>
            <div class="info-item"><span class="info-label">Telefono</span><span class="info-value">{{ empresa()!.telefono || '-' }}</span></div>
            <div class="info-item"><span class="info-label">Direccion</span><span class="info-value">{{ empresa()!.direccion || '-' }}</span></div>
            <div class="info-item"><span class="info-label">Contacto</span><span class="info-value">{{ empresa()!.contacto || '-' }}</span></div>
            <div class="info-item"><span class="info-label">Estado</span><span class="info-value">
              <span class="badge" [class]="empresa()!.activa ? 'bg-glass-green' : 'bg-glass-red'">{{ empresa()!.activa ? 'Activa' : 'Inactiva' }}</span>
            </span></div>
          </div>
        </app-glass-card>

        @if (empresa()!.datosBancarios) {
          <app-glass-card title="Datos Bancarios">
            <div class="info-grid">
              <div class="info-item"><span class="info-label">Banco</span><span class="info-value">{{ empresa()!.datosBancarios!.banco || '-' }}</span></div>
              <div class="info-item"><span class="info-label">CBU</span><span class="info-value">{{ empresa()!.datosBancarios!.cbu || '-' }}</span></div>
              <div class="info-item"><span class="info-label">Alias</span><span class="info-value">{{ empresa()!.datosBancarios!.alias || '-' }}</span></div>
            </div>
          </app-glass-card>
        }
      </div>

      <h3 class="section-title">Productores Asociados ({{ convenios().length }})</h3>
      @if (convenios().length) {
        <app-glass-table [columns]="convenioColumns" [data]="convenios()" [clickable]="true" (rowClick)="goToConvenio($event)">
          <ng-template #row let-c>
            <td class="name-cell">{{ c.nombre }}</td>
            <td>{{ c.comisionPorcentaje }}%</td>
            <td>{{ c.descuentoPorcentaje }}%</td>
            <td><span class="badge" [class]="c.activo ? 'bg-glass-green' : 'bg-glass-red'">{{ c.activo ? 'Activo' : 'Inactivo' }}</span></td>
          </ng-template>
        </app-glass-table>
      } @else {
        <div class="card-glass empty-card">Sin productores asociados</div>
      }

      <h3 class="section-title" style="margin-top:1.5rem">Facturas ({{ facturas().length }})</h3>
      @if (facturas().length) {
        <app-glass-table [columns]="facturaColumns" [data]="facturas()" [clickable]="true" (rowClick)="goToFactura($event)">
          <ng-template #row let-f>
            <td class="name-cell">{{ f.numero }}</td>
            <td>{{ f.tipo }}</td>
            <td>{{ f.montoTotal | currency:'ARS':'ARS ':'1.2-2' }}</td>
            <td>{{ f.saldoPendiente | currency:'ARS':'ARS ':'1.2-2' }}</td>
            <td><app-status-badge [status]="f.estado" /></td>
          </ng-template>
        </app-glass-table>
      } @else {
        <div class="card-glass empty-card">Sin facturas</div>
      }
    }

    <app-empresa-proveedora-form-modal [open]="showEdit()" [entity]="empresa()" (close)="showEdit.set(false)" (saved)="onEdited()" />

    <app-glass-modal [open]="showOverride()" title="Activar override apócrifo" maxWidth="440px" (close)="showOverride.set(false)">
      <p>Esto desactiva el bloqueo de facturas por CUIT apócrifo solo para este proveedor.</p>
      <p style="font-size:0.8125rem;color:var(--color-gray-600)">Usar cuando tengas evidencia de que AFIP marcó el CUIT por error.</p>
      <label class="lbl">Motivo <span class="required">*</span></label>
      <textarea rows="2" [(ngModel)]="motivoOverride" placeholder="Ej: AFIP confirmó por mail que el CUIT fue removido de la lista APOC el 03/04/2026"></textarea>
      <div class="actions-modal">
        <button class="btn-secondary" (click)="showOverride.set(false)">Cancelar</button>
        <button class="btn-primary" (click)="aplicarOverride()" [disabled]="busyOverride() || !motivoOverride.trim()">Activar override</button>
      </div>
    </app-glass-modal>
  `,
  styles: [`
    :host { display: block; }
    .detail-grid { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.125rem; }
    .info-label { font-size: 0.75rem; font-weight: 500; color: var(--color-gray-500); text-transform: uppercase; letter-spacing: 0.05em; }
    .info-value { font-size: 0.9375rem; font-weight: 500; color: var(--color-gray-900); }
    .badge { font-size: 0.75rem; font-weight: 500; }
    .section-title { font-size: 1rem; font-weight: 600; color: var(--color-gray-900); margin-bottom: 0.75rem; }
    .name-cell { font-weight: 500; }
    .empty-card { padding: 1.5rem; text-align: center; color: var(--color-gray-400); }
    .override-banner { display:flex; gap:0.75rem; align-items:flex-start; padding:0.75rem 1rem; margin-bottom:1rem; background:color-mix(in srgb, var(--color-warning) 12%, transparent); border-left:3px solid var(--color-warning); border-radius:var(--radius-md); color:var(--color-warning); }
    .override-banner strong { font-size:0.875rem; }
    .override-banner p { font-size:0.75rem; margin-top:0.25rem; color:var(--color-gray-700); }
    .override-banner em { color:var(--color-gray-500); font-style:normal; }
    .lbl { display:block; font-size:0.75rem; font-weight:500; color:var(--color-gray-600); margin:0.5rem 0 0.25rem; }
    .required { color:var(--color-error); }
    textarea { width:100%; padding:0.625rem 0.75rem; border:1px solid var(--color-gray-200); border-radius:var(--radius-md); font-size:0.875rem; background:var(--glass-bg); font-family:inherit; box-sizing:border-box; }
    .actions-modal { display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaProveedoraDetailComponent implements OnInit {
  loading = signal(true);
  empresa = signal<EmpresaProveedora | null>(null);
  convenios = signal<Convenio[]>([]);
  facturas = signal<Factura[]>([]);
  showEdit = signal(false);
  showOverride = signal(false);
  busyOverride = signal(false);
  motivoOverride = '';

  convenioColumns: TableColumn[] = [
    { key: 'nombre', label: 'Nombre', width: '35%' },
    { key: 'comision', label: 'Honorarios', width: '20%' },
    { key: 'descuento', label: 'Descuento', width: '20%' },
    { key: 'estado', label: 'Estado', width: '15%' },
  ];

  facturaColumns: TableColumn[] = [
    { key: 'numero', label: 'Numero', width: '25%' },
    { key: 'tipo', label: 'Tipo', width: '10%' },
    { key: 'montoTotal', label: 'Monto Total', width: '20%' },
    { key: 'saldo', label: 'Saldo Pend.', width: '20%' },
    { key: 'estado', label: 'Estado', width: '15%' },
  ];

  constructor(
    private route: ActivatedRoute,
    private service: EmpresaProveedoraService,
    private convenioService: ConvenioService,
    private facturaService: FacturaService,
    private router: Router,
    private toast: ToastService,
    public auth: AuthService,
  ) {}

  aplicarOverride() {
    const id = this.empresa()?._id; if (!id || !this.motivoOverride.trim()) return;
    this.busyOverride.set(true);
    this.service.setApocrifoOverride(id, true, this.motivoOverride).subscribe({
      next: (e: any) => {
        this.busyOverride.set(false);
        this.showOverride.set(false);
        this.motivoOverride = '';
        this.empresa.set(e);
        this.toast.success('Override apócrifo activado');
      },
      error: (err) => { this.busyOverride.set(false); this.toast.error(err.error?.message || 'Error al activar override'); },
    });
  }

  quitarApocrifoOverride() {
    const id = this.empresa()?._id; if (!id) return;
    this.service.setApocrifoOverride(id, false).subscribe({
      next: (e: any) => { this.empresa.set(e); this.toast.success('Override apócrifo desactivado'); },
      error: (err) => this.toast.error(err.error?.message || 'Error al quitar override'),
    });
  }

  ngOnInit() { this.loadAll(); }

  loadAll() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.getById(id).subscribe({
      next: (data) => {
        this.empresa.set(data);
        this.loading.set(false);
        this.loadConvenios(data);
        this.loadFacturas(id);
      },
      error: () => { this.loading.set(false); this.router.navigate(['/empresas-proveedoras']); },
    });
  }

  loadConvenios(empresa: EmpresaProveedora) {
    if (empresa.convenios?.length) {
      this.convenios.set(empresa.convenios);
    } else {
      this.convenioService.getAll({ limit: 100 }).subscribe({
        next: (res) => {
          const related = res.data.filter(c => c.empresasProveedoras?.some((ep: any) => (ep._id || ep) === empresa._id));
          this.convenios.set(related);
        },
      });
    }
  }

  loadFacturas(empresaId: string) {
    this.facturaService.getAll({ empresaProveedora: empresaId, limit: 50 }).subscribe({
      next: (res) => this.facturas.set(res.data),
    });
  }

  goBack() { this.router.navigate(['/empresas-proveedoras']); }
  goToConvenio(c: Convenio) { this.router.navigate(['/convenios', c._id]); }
  goToFactura(f: Factura) { this.router.navigate(['/facturas', f._id]); }

  onEdited() {
    this.showEdit.set(false);
    this.toast.success('Empresa proveedora actualizada');
    this.loading.set(true);
    this.loadAll();
  }
}
