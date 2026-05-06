import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { PageHeaderComponent } from '../../shared/page-header/page-header';
import { GlassCardComponent } from '../../shared/glass-card/glass-card';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge';
import { ToastComponent } from '../../shared/toast/toast';
import { ToastService } from '../../shared/toast/toast.service';
import { SolicitudPagoService, SolicitudPago } from '../../services/solicitud-pago.service';

@Component({
  selector: 'app-solicitud-pago-detail',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, TitleCasePipe, RouterLink, PageHeaderComponent, GlassCardComponent, StatusBadgeComponent, ToastComponent],
  template: `
    <app-toast />
    @if (loading()) {
      <div class="card-glass" style="padding:2rem"><div class="skeleton skeleton-text-lg" style="width:40%"></div></div>
    } @else if (sol()) {
      <app-page-header [title]="title()" [subtitle]="subtitle()">
        <button class="btn-secondary" (click)="goBack()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Volver
        </button>
        <button class="btn-secondary" (click)="verificar()" [disabled]="verifying()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Verificar integridad
        </button>
      </app-page-header>

      @if (integridad()) {
        <div class="integridad-banner" [class.ok]="integridad()!.valid" [class.bad]="!integridad()!.valid">
          @if (integridad()!.valid) {
            <strong>Cadena íntegra</strong>
            <span>{{ integridad()!.total }} entradas · {{ integridad()!.conTsa }} con sello TSA</span>
          } @else {
            <strong>Cadena ROTA</strong>
            <span>Primera entrada inválida en posición {{ integridad()!.brokenAt }}</span>
          }
        </div>
      }

      <div class="grid">
        <app-glass-card title="Información">
          <div class="info-grid">
            <div><span class="lbl">Estado</span><span><app-status-badge [status]="sol()!.estado" /></span></div>
            <div><span class="lbl">Tipo</span><span>{{ sol()!.tipo === 'compromiso' ? 'Compromiso de Pago' : 'Solicitud Manual' }}</span></div>
            <div><span class="lbl">Monto</span><span class="strong">{{ sol()!.monto | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
            <div><span class="lbl">Medio de pago</span><span>{{ sol()!.medioPago | titlecase }}</span></div>
            @if (sol()!.bancoOrigen) {
              <div><span class="lbl">Banco origen</span><span>{{ sol()!.bancoOrigen }}</span></div>
            }
            @if (sol()!.fechaVencimiento) {
              <div><span class="lbl">Vencimiento</span><span>{{ sol()!.fechaVencimiento | date:'dd/MM/yyyy' }}</span></div>
            }
            @if (sol()!.reagendadoVeces > 0) {
              <div><span class="lbl">Reagendos</span><span>{{ sol()!.reagendadoVeces }}</span></div>
            }
            @if (sol()!.factura) {
              <div><span class="lbl">Factura</span><a [routerLink]="['/facturas', sol()!.factura._id]">{{ sol()!.factura.numero }}</a></div>
            }
            @if (sol()!.ordenPago) {
              <div><span class="lbl">Orden de pago</span><a [routerLink]="['/ordenes-pago', sol()!.ordenPago._id]">{{ sol()!.ordenPago.numero }}</a></div>
            }
            <div><span class="lbl">Proveedor</span><span>{{ sol()!.empresaProveedora?.razonSocial || '—' }}</span></div>
            @if (sol()!.nota) {
              <div class="full"><span class="lbl">Nota</span><span>{{ sol()!.nota }}</span></div>
            }
          </div>
        </app-glass-card>

        <app-glass-card title="Trazabilidad">
          <div class="audit-list">
            <div class="audit-item">
              <span class="audit-role">Creado por</span>
              <span class="audit-user">{{ userLabel(sol()!.createdBy) }}</span>
              <span class="audit-time">{{ sol()!.createdBy?.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            @if (sol()!.aprobadoPor) {
              <div class="audit-item">
                <span class="audit-role">Aprobado por</span>
                <span class="audit-user">{{ userLabel(sol()!.aprobadoPor) }}</span>
                <span class="audit-time">{{ sol()!.aprobadoPor!.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            }
            @if (sol()!.ejecutadoPor) {
              <div class="audit-item">
                <span class="audit-role">Ejecutado por</span>
                <span class="audit-user">{{ userLabel(sol()!.ejecutadoPor) }}</span>
                <span class="audit-time">{{ sol()!.ejecutadoPor!.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            }
            @if (sol()!.procesadoPor) {
              <div class="audit-item">
                <span class="audit-role">Procesado por</span>
                <span class="audit-user">{{ userLabel(sol()!.procesadoPor) }}</span>
                <span class="audit-time">{{ sol()!.procesadoPor!.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            }
            @if (sol()!.canceladoPor) {
              <div class="audit-item">
                <span class="audit-role">Cancelado por</span>
                <span class="audit-user">{{ userLabel(sol()!.canceladoPor) }}</span>
                <span class="audit-time">{{ sol()!.canceladoPor!.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            }
          </div>
        </app-glass-card>
      </div>

      @if (sol()!.comprobantes?.length) {
        <app-glass-card title="Comprobantes">
          <div class="comprobantes">
            @for (c of sol()!.comprobantes; track c.key) {
              <div class="comp-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div class="comp-info">
                  <span class="comp-tipo">{{ c.tipo === 'perc' ? 'Comprobante PERC' : 'Comprobante Retenciones' }}</span>
                  <span class="comp-name">{{ c.nombre }}</span>
                </div>
                <button class="btn-mini" (click)="descargarComprobante(c.tipo)">Descargar</button>
              </div>
            }
          </div>
        </app-glass-card>
      }

      <app-glass-card title="Historial de transiciones">
        <div class="historial">
          @for (h of sol()!.historial; track $index) {
            <div class="hist-item">
              <div class="hist-line">
                <span class="hist-accion">{{ accionLabel(h.accion) }}</span>
                @if (h.estadoAnterior) {
                  <span class="hist-arrow">{{ h.estadoAnterior }} → {{ h.estadoNuevo }}</span>
                }
                <span class="hist-time">{{ h.fecha | date:'dd/MM/yyyy HH:mm:ss' }}</span>
              </div>
              <div class="hist-meta">
                <span>por {{ userLabel({ user: h.usuario }) }}</span>
                @if (h.motivo) { <span>· {{ h.motivo }}</span> }
                @if (h.fechaAnterior && h.fechaNueva) {
                  <span>· {{ h.fechaAnterior | date:'dd/MM/yyyy' }} → {{ h.fechaNueva | date:'dd/MM/yyyy' }}</span>
                }
              </div>
              <div class="hist-hash">
                <span class="hash-tag">hash</span>
                <code>{{ h.hash?.slice(0, 16) }}…</code>
                @if (h.tsaToken) {
                  <span class="tsa-tag">TSA ✓</span>
                } @else if (h.tsaError) {
                  <span class="tsa-tag tsa-error" [title]="h.tsaError">TSA ✗</span>
                }
              </div>
            </div>
          }
        </div>
      </app-glass-card>
    } @else {
      <p style="padding:2rem;text-align:center;color:var(--color-gray-500)">Solicitud no encontrada</p>
    }
  `,
  styles: [`
    :host { display:block; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(360px, 1fr)); gap:1rem; margin-bottom:1rem; }
    .info-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:0.75rem; }
    .info-grid > div { display:flex; flex-direction:column; gap:0.125rem; }
    .info-grid .full { grid-column:1/-1; }
    .lbl { font-size:0.6875rem; color:var(--color-gray-500); text-transform:uppercase; letter-spacing:0.05em; }
    .strong { font-weight:600; }
    .audit-list { display:flex; flex-direction:column; gap:0.625rem; }
    .audit-item { display:grid; grid-template-columns:120px 1fr auto; gap:0.5rem; padding:0.5rem 0; border-bottom:1px solid var(--color-gray-100); font-size:0.8125rem; align-items:center; }
    .audit-item:last-child { border-bottom:none; }
    .audit-role { color:var(--color-gray-500); font-weight:500; }
    .audit-user { color:var(--color-gray-900); }
    .audit-time { color:var(--color-gray-500); font-size:0.75rem; font-variant-numeric:tabular-nums; }
    .comprobantes { display:flex; flex-direction:column; gap:0.5rem; }
    .comp-item { display:flex; align-items:center; gap:0.75rem; padding:0.625rem 0.75rem; border:1px solid var(--color-gray-200); border-radius:var(--radius-md); }
    .comp-info { flex:1; display:flex; flex-direction:column; gap:0.125rem; min-width:0; }
    .comp-tipo { font-size:0.8125rem; font-weight:600; color:var(--color-gray-900); }
    .comp-name { font-size:0.6875rem; color:var(--color-gray-500); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .btn-mini { padding:0.3rem 0.625rem; font-size:0.75rem; border-radius:var(--radius-sm); border:1px solid var(--color-primary); background:var(--color-primary); color:white; cursor:pointer; }
    .historial { display:flex; flex-direction:column; gap:0.5rem; }
    .hist-item { padding:0.625rem 0.75rem; border-left:3px solid var(--color-primary); background:rgba(99,102,241,0.04); border-radius:var(--radius-sm); }
    .hist-line { display:flex; align-items:center; gap:0.625rem; flex-wrap:wrap; }
    .hist-accion { font-size:0.875rem; font-weight:600; color:var(--color-gray-900); text-transform:uppercase; letter-spacing:0.03em; }
    .hist-arrow { font-size:0.75rem; color:var(--color-gray-600); font-family:monospace; }
    .hist-time { margin-left:auto; font-size:0.75rem; color:var(--color-gray-500); font-variant-numeric:tabular-nums; }
    .hist-meta { font-size:0.75rem; color:var(--color-gray-600); margin-top:0.125rem; }
    .hist-hash { display:flex; align-items:center; gap:0.5rem; margin-top:0.375rem; font-size:0.6875rem; }
    .hist-hash code { font-family:monospace; color:var(--color-gray-600); }
    .hash-tag { background:var(--color-gray-100); padding:0.0625rem 0.375rem; border-radius:0.25rem; color:var(--color-gray-600); font-weight:600; letter-spacing:0.05em; text-transform:uppercase; }
    .tsa-tag { background:color-mix(in srgb, var(--color-success) 14%, transparent); color:var(--color-success); padding:0.0625rem 0.375rem; border-radius:0.25rem; font-weight:600; }
    .tsa-tag.tsa-error { background:color-mix(in srgb, var(--color-error) 14%, transparent); color:var(--color-error); }
    .integridad-banner { display:flex; align-items:center; gap:0.75rem; padding:0.625rem 0.875rem; margin-bottom:1rem; border-radius:var(--radius-md); border:1px solid; font-size:0.875rem; }
    .integridad-banner.ok { background:color-mix(in srgb, var(--color-success) 8%, transparent); border-color:color-mix(in srgb, var(--color-success) 30%, transparent); color:var(--color-success); }
    .integridad-banner.bad { background:color-mix(in srgb, var(--color-error) 10%, transparent); border-color:color-mix(in srgb, var(--color-error) 40%, transparent); color:var(--color-error); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitudPagoDetailComponent implements OnInit {
  loading = signal(true);
  sol = signal<SolicitudPago | null>(null);
  verifying = signal(false);
  integridad = signal<{ valid: boolean; brokenAt: number | null; total: number; conTsa: number } | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: SolicitudPagoService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.get(id).subscribe({
      next: (s) => { this.sol.set(s); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('No se pudo cargar la solicitud'); },
    });
  }

  goBack() { this.router.navigate(['/solicitudes-pago']); }

  title() {
    const s = this.sol(); if (!s) return 'Solicitud';
    return `${s.tipo === 'compromiso' ? 'Compromiso' : 'Solicitud'} de Pago`;
  }
  subtitle() {
    const s = this.sol(); if (!s) return '';
    const ref = s.factura ? `Factura ${s.factura.numero}` : (s.ordenPago ? `Orden ${s.ordenPago.numero}` : '');
    return `${ref} · ${s.empresaProveedora?.razonSocial || ''}`;
  }

  userLabel(audit: any): string {
    if (!audit) return '—';
    const u = audit.user || audit;
    if (typeof u === 'string') return u;
    if (u?.nombre || u?.apellido) return `${u.nombre || ''} ${u.apellido || ''}`.trim();
    return u?.email || '—';
  }

  accionLabel(a: string): string {
    const map: Record<string, string> = {
      crear: 'Creada', aprobar: 'Aprobada', ejecutar: 'Ejecutada',
      procesar: 'Procesada', cancelar: 'Cancelada', reagendar: 'Reagendada',
    };
    return map[a] || a;
  }

  verificar() {
    const id = this.sol()?._id; if (!id) return;
    this.verifying.set(true);
    this.service.verificarIntegridad(id).subscribe({
      next: (r) => { this.integridad.set(r); this.verifying.set(false); },
      error: () => { this.verifying.set(false); this.toast.error('Error verificando integridad'); },
    });
  }

  descargarComprobante(tipo: 'perc' | 'retenciones') {
    const id = this.sol()?._id; if (!id) return;
    this.service.getComprobanteUrl(id, tipo).subscribe({
      next: (r) => window.open(r.url, '_blank'),
      error: () => this.toast.error('No se pudo obtener el comprobante'),
    });
  }
}
