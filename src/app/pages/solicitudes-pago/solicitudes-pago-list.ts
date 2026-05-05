import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/page-header/page-header';
import { GlassCardComponent } from '../../shared/glass-card/glass-card';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge';
import { ToastComponent } from '../../shared/toast/toast';
import { ToastService } from '../../shared/toast/toast.service';
import { GlassModalComponent } from '../../shared/glass-modal/glass-modal';
import { NumberFormatDirective } from '../../shared/number-format/number-format.directive';
import { AuthService } from '../../services/auth.service';
import { SolicitudPagoService, SolicitudPago, EstadoSolicitud } from '../../services/solicitud-pago.service';

const ESTADO_LABELS: Record<EstadoSolicitud, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  pago_en_proceso_perc: 'Pago en proceso PERC',
  procesado: 'Procesado',
  cancelado: 'Cancelado',
};

@Component({
  selector: 'app-solicitudes-pago-list',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, RouterLink, PageHeaderComponent, GlassCardComponent, StatusBadgeComponent, ToastComponent, GlassModalComponent, NumberFormatDirective],
  template: `
    <app-toast />
    <app-page-header title="Solicitudes de Pago" [subtitle]="bandejaTitle()" />

    <div class="tabs">
      @for (e of estados; track e.value) {
        <button class="tab" [class.active]="filtroEstado() === e.value" (click)="setEstado(e.value)">
          {{ e.label }} <span class="tab-count">{{ countByEstado(e.value) }}</span>
        </button>
      }
      <button class="tab" [class.active]="filtroEstado() === ''" (click)="setEstado('')">
        Todos <span class="tab-count">{{ items().length }}</span>
      </button>
    </div>

    <app-glass-card>
      @if (loading()) {
        <div style="padding:1rem"><div class="skeleton skeleton-text-lg" style="width:40%"></div></div>
      } @else if (visibles().length === 0) {
        <p style="padding:1.5rem; text-align:center; color:var(--color-gray-500)">Sin solicitudes para mostrar</p>
      } @else {
        <table class="table-glass">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Factura</th>
              <th>Proveedor</th>
              <th>Monto</th>
              <th>Vencimiento</th>
              <th>Medio</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (s of visibles(); track s._id) {
              <tr>
                <td>
                  @if (s.tipo === 'compromiso') {
                    <span class="chip chip-info">Compromiso</span>
                  } @else {
                    <span class="chip">Manual</span>
                  }
                </td>
                <td><a [routerLink]="['/facturas', s.factura?._id]">{{ s.factura?.numero || '—' }}</a></td>
                <td>{{ s.empresaProveedora?.razonSocial || '—' }}</td>
                <td>{{ s.monto | currency:'ARS':'ARS ':'1.2-2' }}</td>
                <td>{{ s.fechaVencimiento ? (s.fechaVencimiento | date:'dd/MM/yyyy') : '—' }}</td>
                <td>{{ s.medioPago }}</td>
                <td><app-status-badge [status]="s.estado" /></td>
                <td>
                  <div class="actions">
                    @if (canAprobar(s)) {
                      <button class="btn-mini btn-success" (click)="abrirAprobar(s)">Aprobar</button>
                    }
                    @if (canEjecutar(s)) {
                      <button class="btn-mini btn-primary" (click)="abrirEjecutar(s)">Ejecutar</button>
                    }
                    @if (canProcesar(s)) {
                      <button class="btn-mini btn-primary" (click)="abrirProcesar(s)">Procesar</button>
                    }
                    @if (canCancelar(s)) {
                      <button class="btn-mini btn-danger" (click)="abrirCancelar(s)">Cancelar</button>
                    }
                    @if (canReagendar(s)) {
                      <button class="btn-mini" (click)="abrirReagendar(s)">Reagendar</button>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </app-glass-card>

    <!-- Modales de acción -->
    <app-glass-modal [open]="showAprobar()" title="Aprobar solicitud" maxWidth="440px" (close)="showAprobar.set(false)">
      <p>Confirmás aprobar la solicitud de <strong>{{ activa()?.monto | currency:'ARS':'ARS ':'1.2-2' }}</strong>?</p>
      <label class="lbl">Comentario (opcional)</label>
      <textarea rows="2" [(ngModel)]="motivoTxt"></textarea>
      <div class="actions-modal">
        <button class="btn-secondary" (click)="showAprobar.set(false)">Cancelar</button>
        <button class="btn-primary" (click)="aprobar()" [disabled]="busy()">Aprobar</button>
      </div>
    </app-glass-modal>

    <app-glass-modal [open]="showEjecutar()" title="Ejecutar pago" maxWidth="440px" (close)="showEjecutar.set(false)">
      <p>Esto pasa la solicitud a "Pago en proceso PERC". El operador será quien suba los comprobantes finales.</p>
      <label class="lbl">Comentario (opcional)</label>
      <textarea rows="2" [(ngModel)]="motivoTxt"></textarea>
      <div class="actions-modal">
        <button class="btn-secondary" (click)="showEjecutar.set(false)">Cancelar</button>
        <button class="btn-primary" (click)="ejecutar()" [disabled]="busy()">Ejecutar</button>
      </div>
    </app-glass-modal>

    <app-glass-modal [open]="showCancelar()" title="Cancelar compromiso" maxWidth="440px" (close)="showCancelar.set(false)">
      <p>El compromiso quedará en estado <strong>cancelado</strong>. Esto se registra en el historial.</p>
      <label class="lbl">Motivo <span class="required">*</span></label>
      <textarea rows="2" [(ngModel)]="motivoTxt" placeholder="Ej: sin fondos disponibles"></textarea>
      <div class="actions-modal">
        <button class="btn-secondary" (click)="showCancelar.set(false)">Cerrar</button>
        <button class="btn-danger" (click)="cancelar()" [disabled]="busy() || !motivoTxt.trim()">Cancelar compromiso</button>
      </div>
    </app-glass-modal>

    <app-glass-modal [open]="showReagendar()" title="Reagendar compromiso" maxWidth="440px" (close)="showReagendar.set(false)">
      <p>Mover la fecha de vencimiento a una nueva fecha futura. Reagendado <strong>{{ activa()?.reagendadoVeces || 0 }}</strong> veces hasta ahora.</p>
      <label class="lbl">Nueva fecha <span class="required">*</span></label>
      <input type="date" [(ngModel)]="nuevaFecha" [min]="hoyISO" />
      <label class="lbl">Motivo (opcional)</label>
      <textarea rows="2" [(ngModel)]="motivoTxt"></textarea>
      <div class="actions-modal">
        <button class="btn-secondary" (click)="showReagendar.set(false)">Cancelar</button>
        <button class="btn-primary" (click)="reagendar()" [disabled]="busy() || !nuevaFecha">Reagendar</button>
      </div>
    </app-glass-modal>

    <app-glass-modal [open]="showProcesar()" title="Procesar pago" maxWidth="640px" (close)="showProcesar.set(false)">
      <p style="font-size:0.875rem;color:var(--color-gray-600)">Subí los dos comprobantes y completá las retenciones según consten en ellos.</p>

      <div class="form-grid-2">
        <div class="form-group">
          <label class="lbl">Comprobante PERC <span class="required">*</span></label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="onPercFile($event)" />
          @if (filePerc()) { <span class="hint">{{ filePerc()!.name }}</span> }
        </div>
        <div class="form-group">
          <label class="lbl">Comprobante Retenciones <span class="required">*</span></label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="onRetFile($event)" />
          @if (fileRet()) { <span class="hint">{{ fileRet()!.name }}</span> }
        </div>
      </div>

      <div class="form-grid-3" style="margin-top:0.75rem">
        <div class="form-group"><label class="lbl">Ret. IIBB</label><input appNumberFormat [decimals]="2" [(ngModel)]="ret.iibb" min="0"/></div>
        <div class="form-group"><label class="lbl">Ret. Ganancias</label><input appNumberFormat [decimals]="2" [(ngModel)]="ret.gan" min="0"/></div>
        <div class="form-group"><label class="lbl">Ret. IVA</label><input appNumberFormat [decimals]="2" [(ngModel)]="ret.iva" min="0"/></div>
        <div class="form-group"><label class="lbl">Ret. SUSS</label><input appNumberFormat [decimals]="2" [(ngModel)]="ret.suss" min="0"/></div>
        <div class="form-group"><label class="lbl">Otras retenciones</label><input appNumberFormat [decimals]="2" [(ngModel)]="ret.otras" min="0"/></div>
        <div class="form-group"><label class="lbl">Referencia</label><input type="text" [(ngModel)]="ret.ref" placeholder="Nro de transferencia"/></div>
      </div>

      <div class="form-group" style="margin-top:0.75rem">
        <label class="lbl">Observaciones</label>
        <textarea rows="2" [(ngModel)]="ret.obs"></textarea>
      </div>

      <div class="actions-modal">
        <button class="btn-secondary" (click)="showProcesar.set(false)">Cancelar</button>
        <button class="btn-primary" (click)="procesar()" [disabled]="busy() || !filePerc() || !fileRet()">
          @if (busy()) { <span class="spinner"></span> }
          Procesar y registrar pago
        </button>
      </div>
    </app-glass-modal>
  `,
  styles: [`
    :host { display:block; }
    .tabs { display:flex; gap:0.25rem; margin-bottom:1rem; flex-wrap:wrap; }
    .tab { background:transparent; border:1px solid var(--color-gray-200); padding:0.5rem 0.875rem;
      border-radius:var(--radius-md); cursor:pointer; font-size:0.8125rem; color:var(--color-gray-600); display:flex; gap:0.375rem; align-items:center; }
    .tab.active { background:var(--color-primary); color:white; border-color:var(--color-primary); }
    .tab-count { background:rgba(255,255,255,0.2); color:inherit; font-size:0.6875rem; padding:0.125rem 0.375rem; border-radius:999px; min-width:1.25rem; text-align:center; }
    .tab:not(.active) .tab-count { background:var(--color-gray-100); }
    .table-glass { width:100%; border-collapse:collapse; font-size:0.875rem; }
    .table-glass thead th { text-align:left; padding:0.75rem; border-bottom:1px solid var(--color-gray-200); font-weight:600; color:var(--color-gray-600); font-size:0.75rem; text-transform:uppercase; }
    .table-glass tbody td { padding:0.75rem; border-bottom:1px solid var(--color-gray-100); }
    .table-glass tbody tr:hover { background:rgba(99,102,241,0.04); }
    .chip { font-size:0.6875rem; font-weight:600; padding:0.125rem 0.5rem; border-radius:999px; background:var(--color-gray-100); color:var(--color-gray-700); }
    .chip-info { background:color-mix(in srgb, var(--color-info) 14%, transparent); color:var(--color-info); }
    .actions { display:flex; gap:0.25rem; flex-wrap:wrap; }
    .btn-mini { padding:0.3rem 0.625rem; font-size:0.75rem; border-radius:var(--radius-sm); border:1px solid var(--color-gray-300); background:transparent; color:var(--color-gray-700); cursor:pointer; }
    .btn-mini:hover { background:var(--color-gray-100); }
    .btn-mini.btn-primary { background:var(--color-primary); color:white; border-color:var(--color-primary); }
    .btn-mini.btn-success { background:var(--color-success); color:white; border-color:var(--color-success); }
    .btn-mini.btn-danger { background:var(--color-error); color:white; border-color:var(--color-error); }
    .lbl { display:block; font-size:0.75rem; font-weight:500; color:var(--color-gray-600); margin:0.5rem 0 0.25rem; }
    .required { color:var(--color-error); }
    textarea, input[type="date"], input[type="text"], input[type="file"] {
      width:100%; padding:0.625rem 0.75rem; border:1px solid var(--color-gray-200);
      border-radius:var(--radius-md); font-size:0.875rem; background:var(--glass-bg);
      color:var(--color-gray-900); font-family:inherit; box-sizing:border-box;
    }
    .actions-modal { display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem; }
    .form-grid-2 { display:grid; grid-template-columns:repeat(2, 1fr); gap:0.75rem; }
    .form-grid-3 { display:grid; grid-template-columns:repeat(3, 1fr); gap:0.5rem; }
    .form-group { display:flex; flex-direction:column; gap:0.25rem; }
    .hint { font-size:0.6875rem; color:var(--color-gray-500); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitudesPagoListComponent implements OnInit {
  loading = signal(true);
  items = signal<SolicitudPago[]>([]);
  filtroEstado = signal<EstadoSolicitud | ''>('');

  estados: { value: EstadoSolicitud; label: string }[] = (Object.keys(ESTADO_LABELS) as EstadoSolicitud[])
    .map(e => ({ value: e, label: ESTADO_LABELS[e] }));

  visibles = computed(() => {
    const f = this.filtroEstado();
    return f ? this.items().filter(s => s.estado === f) : this.items();
  });

  bandejaTitle = computed(() => {
    const r = this.auth.user()?.role;
    if (r === 'contabilidad') return 'Bandeja de Contabilidad — solicitudes pendientes de aprobación';
    if (r === 'tesoreria') return 'Bandeja de Tesorería — aprobadas listas para ejecutar / compromisos vencidos';
    if (r === 'operador') return 'Bandeja de Operación — pagos en proceso PERC para procesar';
    return 'Listado completo de solicitudes';
  });

  // Modal state
  activa = signal<SolicitudPago | null>(null);
  showAprobar = signal(false);
  showEjecutar = signal(false);
  showCancelar = signal(false);
  showReagendar = signal(false);
  showProcesar = signal(false);
  busy = signal(false);

  motivoTxt = '';
  nuevaFecha = '';
  filePerc = signal<File | null>(null);
  fileRet = signal<File | null>(null);
  ret = { iibb: 0, gan: 0, iva: 0, suss: 0, otras: 0, ref: '', obs: '' };

  hoyISO = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  constructor(
    private service: SolicitudPagoService,
    private auth: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.aplicarFiltroPorRol();
    this.load();
  }

  aplicarFiltroPorRol() {
    const r = this.auth.user()?.role;
    if (r === 'contabilidad') this.filtroEstado.set('pendiente');
    else if (r === 'tesoreria') this.filtroEstado.set('en_proceso');
    else if (r === 'operador') this.filtroEstado.set('pago_en_proceso_perc');
  }

  load() {
    this.loading.set(true);
    this.service.list({ limit: 200 }).subscribe({
      next: res => { this.items.set(res.data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Error cargando solicitudes'); },
    });
  }

  setEstado(e: EstadoSolicitud | '') { this.filtroEstado.set(e); }
  countByEstado(e: EstadoSolicitud) { return this.items().filter(s => s.estado === e).length; }

  // Permisos
  private hasRole(...roles: string[]): boolean {
    return roles.includes(this.auth.user()?.role || '');
  }
  canAprobar = (s: SolicitudPago) => s.estado === 'pendiente' && this.hasRole('admin', 'contabilidad');
  canEjecutar = (s: SolicitudPago) => s.estado === 'en_proceso' && this.hasRole('admin', 'tesoreria');
  canProcesar = (s: SolicitudPago) => s.estado === 'pago_en_proceso_perc' && this.hasRole('admin', 'operador');
  canCancelar = (s: SolicitudPago) =>
    s.tipo === 'compromiso' && s.estado !== 'procesado' && s.estado !== 'cancelado'
    && !!s.fechaVencimiento && new Date(s.fechaVencimiento).getTime() <= Date.now()
    && this.hasRole('admin', 'tesoreria');
  canReagendar = (s: SolicitudPago) => this.canCancelar(s);

  abrirAprobar(s: SolicitudPago) { this.activa.set(s); this.motivoTxt = ''; this.showAprobar.set(true); }
  abrirEjecutar(s: SolicitudPago) { this.activa.set(s); this.motivoTxt = ''; this.showEjecutar.set(true); }
  abrirCancelar(s: SolicitudPago) { this.activa.set(s); this.motivoTxt = ''; this.showCancelar.set(true); }
  abrirReagendar(s: SolicitudPago) { this.activa.set(s); this.nuevaFecha = ''; this.motivoTxt = ''; this.showReagendar.set(true); }
  abrirProcesar(s: SolicitudPago) {
    this.activa.set(s);
    this.filePerc.set(null); this.fileRet.set(null);
    this.ret = { iibb: 0, gan: 0, iva: 0, suss: 0, otras: 0, ref: '', obs: '' };
    this.showProcesar.set(true);
  }

  onPercFile(e: Event) { this.filePerc.set((e.target as HTMLInputElement).files?.[0] ?? null); }
  onRetFile(e: Event) { this.fileRet.set((e.target as HTMLInputElement).files?.[0] ?? null); }

  aprobar() {
    const s = this.activa(); if (!s) return;
    this.busy.set(true);
    this.service.aprobar(s._id, this.motivoTxt || undefined).subscribe({
      next: () => { this.busy.set(false); this.showAprobar.set(false); this.toast.success('Solicitud aprobada'); this.load(); },
      error: err => { this.busy.set(false); this.toast.error(err.error?.message || 'Error al aprobar'); },
    });
  }

  ejecutar() {
    const s = this.activa(); if (!s) return;
    this.busy.set(true);
    this.service.ejecutar(s._id, this.motivoTxt || undefined).subscribe({
      next: () => { this.busy.set(false); this.showEjecutar.set(false); this.toast.success('Solicitud ejecutada'); this.load(); },
      error: err => { this.busy.set(false); this.toast.error(err.error?.message || 'Error al ejecutar'); },
    });
  }

  cancelar() {
    const s = this.activa(); if (!s || !this.motivoTxt.trim()) return;
    this.busy.set(true);
    this.service.cancelar(s._id, this.motivoTxt).subscribe({
      next: () => { this.busy.set(false); this.showCancelar.set(false); this.toast.success('Compromiso cancelado'); this.load(); },
      error: err => { this.busy.set(false); this.toast.error(err.error?.message || 'Error al cancelar'); },
    });
  }

  reagendar() {
    const s = this.activa(); if (!s || !this.nuevaFecha) return;
    this.busy.set(true);
    this.service.reagendar(s._id, this.nuevaFecha, this.motivoTxt || undefined).subscribe({
      next: () => { this.busy.set(false); this.showReagendar.set(false); this.toast.success('Compromiso reagendado'); this.load(); },
      error: err => { this.busy.set(false); this.toast.error(err.error?.message || 'Error al reagendar'); },
    });
  }

  procesar() {
    const s = this.activa(); if (!s) return;
    const perc = this.filePerc(); const ret = this.fileRet();
    if (!perc || !ret) return;
    this.busy.set(true);
    this.service.procesar(s._id, {
      perc, retenciones: ret,
      retencionIIBB: this.ret.iibb, retencionGanancias: this.ret.gan, retencionIVA: this.ret.iva,
      retencionSUSS: this.ret.suss, otrasRetenciones: this.ret.otras,
      referenciaPago: this.ret.ref || undefined, observaciones: this.ret.obs || undefined,
    }).subscribe({
      next: () => { this.busy.set(false); this.showProcesar.set(false); this.toast.success('Pago procesado y registrado'); this.load(); },
      error: err => { this.busy.set(false); this.toast.error(err.error?.message || 'Error al procesar'); },
    });
  }
}
