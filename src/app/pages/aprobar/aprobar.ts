import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { AprobacionService, ContextoToken } from '../../services/aprobacion.service';

const TIPO_LABEL: Record<string, string> = {
  creacion: 'Creación',
  pago: 'Pago',
  anulacion: 'Anulación',
};

const ENTIDAD_LABEL: Record<string, string> = {
  'ordenes-pago': 'Orden de Pago',
  pagos: 'Pago',
  prestamos: 'Préstamo',
  'compras-fx': 'Compra FX',
};

@Component({
  selector: 'app-aprobar',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, RouterLink],
  template: `
    <div class="aprobar-page">
      <div class="aprobar-card">

        @if (loading()) {
          <div class="state-box">
            <span class="spinner"></span>
            <p>Cargando información de la aprobación...</p>
          </div>
        }

        @if (!loading() && error()) {
          <div class="state-box">
            <div class="state-icon state-icon-error">!</div>
            <h2>Token inválido o expirado</h2>
            <p class="state-sub">{{ error() }}</p>
            <a routerLink="/login" class="btn-login-link">Iniciá sesión</a>
          </div>
        }

        @if (!loading() && resultado()) {
          <div class="state-box">
            <div class="state-icon state-icon-success">✓</div>
            <h2>Decisión registrada</h2>
            <p class="state-sub">{{ resultado() }}</p>
            <a routerLink="/login" class="btn-login-link">Iniciá sesión</a>
          </div>
        }

        @if (!loading() && !error() && !resultado() && contexto(); as ctx) {
          <div class="confirm-state">
            <div class="brand-eyebrow">Perc Suppliers</div>
            <h1>Aprobación pendiente</h1>
            <p class="lead">Revisá el detalle y confirmá tu decisión.</p>

            <div class="monto-hero">
              <span class="monto-label">Monto</span>
              <span class="monto-value">{{ ctx.monto | currency:'ARS':'$ ':'1.0-0' }}</span>
            </div>

            <dl class="detalle">
              <div class="detalle-row">
                <dt>Tipo</dt>
                <dd>{{ tipoLabel(ctx.tipo) }}</dd>
              </div>
              <div class="detalle-row">
                <dt>Entidad</dt>
                <dd>{{ entidadLabel(ctx.entidad) }}</dd>
              </div>
              <div class="detalle-row">
                <dt>Descripción</dt>
                <dd>{{ ctx.descripcion }}</dd>
              </div>
              <div class="detalle-row">
                <dt>Solicitante</dt>
                <dd>{{ ctx.solicitante }}</dd>
              </div>
              <div class="detalle-row">
                <dt>Fecha</dt>
                <dd>{{ ctx.fechaSolicitud | date:'dd/MM/yyyy HH:mm' }}</dd>
              </div>
              <div class="detalle-row detalle-expira">
                <dt>Expira</dt>
                <dd>{{ ctx.expiraEn | date:'dd/MM/yyyy HH:mm' }}</dd>
              </div>
            </dl>

            <div class="form-group">
              <label>Comentario (opcional)</label>
              <textarea
                [(ngModel)]="comentario"
                name="comentario"
                maxlength="500"
                rows="3"
                placeholder="Agregá un comentario a tu decisión..."
              ></textarea>
            </div>

            <div class="btn-group">
              <button
                class="btn-action btn-approve"
                [class.btn-highlighted]="decision() === 'aprobar'"
                [disabled]="submitting()"
                (click)="submit('aprobar')"
              >
                @if (submitting() && decision() === 'aprobar') { <span class="spinner-sm"></span> }
                <span>Aprobar</span>
              </button>
              <button
                class="btn-action btn-reject"
                [class.btn-highlighted]="decision() === 'rechazar'"
                [disabled]="submitting()"
                (click)="submit('rechazar')"
              >
                @if (submitting() && decision() === 'rechazar') { <span class="spinner-sm"></span> }
                <span>Rechazar</span>
              </button>
            </div>

            @if (submitError()) {
              <p class="submit-error">{{ submitError() }}</p>
            }

            <p class="footer-note">
              Tu decisión queda auditada. Si no esperabas este correo, podés cerrar la página sin accionar.
            </p>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .aprobar-page {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 32px 16px;
      background:
        radial-gradient(circle at top left, rgba(124, 58, 237, 0.2), transparent 45%),
        radial-gradient(circle at bottom right, rgba(79, 70, 229, 0.25), transparent 50%),
        linear-gradient(135deg, #1f1b3a 0%, #2b2556 60%, #3b3273 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937;
    }

    .aprobar-card {
      max-width: 540px; width: 100%;
      background: #ffffff;
      border-radius: 20px;
      padding: 36px 36px 28px;
      box-shadow:
        0 20px 60px rgba(10, 8, 40, 0.45),
        0 2px 6px rgba(10, 8, 40, 0.12);
    }

    .state-box { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 12px 0; }
    .state-box h2 { margin: 4px 0 0; font-size: 18px; font-weight: 700; color: #111827; }
    .state-sub { margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5; }
    .state-icon {
      width: 56px; height: 56px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 700;
    }
    .state-icon-error { background: #fee2e2; color: #dc2626; }
    .state-icon-success { background: #dcfce7; color: #15803d; }

    .spinner {
      width: 28px; height: 28px; border-radius: 50%;
      border: 3px solid #e5e7eb; border-top-color: #6366f1;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .btn-login-link {
      margin-top: 6px; padding: 10px 20px;
      background: #6366f1; color: #fff;
      border-radius: 10px; text-decoration: none;
      font-size: 14px; font-weight: 600;
      transition: filter 0.15s;
    }
    .btn-login-link:hover { filter: brightness(1.1); }

    .brand-eyebrow {
      color: #6366f1; font-size: 11px; font-weight: 700;
      letter-spacing: 1.2px; text-transform: uppercase;
      margin-bottom: 6px;
    }
    h1 {
      font-size: 24px; font-weight: 700; color: #111827;
      margin: 0 0 6px; line-height: 1.2;
    }
    .lead { margin: 0 0 22px; font-size: 14px; color: #6b7280; }

    .monto-hero {
      background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%);
      border: 1px solid #e0e7ff;
      border-radius: 14px;
      padding: 18px 20px;
      text-align: center;
      margin-bottom: 20px;
    }
    .monto-label {
      display: block;
      color: #6366f1; font-size: 11px; font-weight: 700;
      letter-spacing: 1px; text-transform: uppercase;
      margin-bottom: 4px;
    }
    .monto-value {
      display: block;
      color: #111827;
      font-size: 34px; font-weight: 700; line-height: 1.1;
      font-variant-numeric: tabular-nums;
    }

    .detalle {
      margin: 0 0 22px;
      padding: 0;
      font-size: 14px;
    }
    .detalle-row {
      display: flex; justify-content: space-between; align-items: baseline;
      gap: 16px;
      padding: 10px 0;
      border-top: 1px solid #f3f4f6;
    }
    .detalle-row:first-child { border-top: none; padding-top: 0; }
    .detalle-row dt {
      margin: 0; color: #6b7280;
      flex-shrink: 0;
      font-weight: 500;
    }
    .detalle-row dd {
      margin: 0; color: #111827;
      text-align: right;
      font-weight: 500;
      word-break: break-word;
    }
    .detalle-expira dd { color: #d97706; font-weight: 600; }

    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
    .form-group label { font-size: 12px; font-weight: 600; color: #374151; }
    .form-group textarea {
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #ffffff;
      color: #111827;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .form-group textarea::placeholder { color: #9ca3af; }
    .form-group textarea:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
    }

    .btn-group { display: flex; gap: 12px; }
    .btn-action {
      flex: 1; padding: 14px 18px;
      border: none; border-radius: 12px;
      font-size: 15px; font-weight: 700;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: transform 0.1s, box-shadow 0.15s, opacity 0.15s;
    }
    .btn-approve {
      background: #16a34a; color: #fff;
      box-shadow: 0 2px 6px rgba(22, 163, 74, 0.35);
    }
    .btn-approve:hover:not(:disabled) { background: #15803d; box-shadow: 0 4px 10px rgba(22, 163, 74, 0.45); }
    .btn-reject {
      background: #ffffff; color: #dc2626;
      border: 1px solid #fecaca;
    }
    .btn-reject:hover:not(:disabled) { background: #fef2f2; }
    .btn-highlighted { transform: scale(1.02); }
    .btn-action:disabled { opacity: 0.6; cursor: not-allowed; }

    .spinner-sm {
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.5); border-top-color: #fff;
      animation: spin 0.8s linear infinite;
    }
    .btn-reject .spinner-sm { border-color: rgba(220, 38, 38, 0.3); border-top-color: #dc2626; }

    .submit-error {
      color: #dc2626; font-size: 13px; text-align: center;
      margin: 12px 0 0;
    }

    .footer-note {
      margin: 22px 0 0;
      padding-top: 16px;
      border-top: 1px solid #f3f4f6;
      font-size: 11px; color: #9ca3af;
      text-align: center; line-height: 1.5;
    }

    @media (max-width: 520px) {
      .aprobar-card { padding: 28px 20px 20px; }
      h1 { font-size: 20px; }
      .monto-value { font-size: 28px; }
      .btn-group { flex-direction: column; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AprobarComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  contexto = signal<ContextoToken | null>(null);
  decision = signal<'aprobar' | 'rechazar' | null>(null);
  comentario = '';
  submitting = signal(false);
  resultado = signal<string | null>(null);
  submitError = signal<string | null>(null);

  private token = '';

  constructor(
    private route: ActivatedRoute,
    private aprobacionService: AprobacionService,
    private meta: Meta,
  ) {}

  ngOnInit() {
    this.meta.addTag({ name: 'referrer', content: 'no-referrer' });

    const params = this.route.snapshot.queryParamMap;
    this.token = params.get('t') ?? '';
    const decisionParam = params.get('decision');
    if (decisionParam === 'aprobar' || decisionParam === 'rechazar') {
      this.decision.set(decisionParam);
    }

    if (!this.token) {
      this.loading.set(false);
      this.error.set('No se encontró un token de aprobación en el enlace.');
      return;
    }

    this.aprobacionService.getContextoToken(this.token).subscribe({
      next: (ctx) => {
        this.contexto.set(ctx);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Token inválido o expirado. Solicitá un nuevo enlace al equipo de tesorería.');
      },
    });
  }

  submit(dec: 'aprobar' | 'rechazar') {
    if (this.submitting()) return;
    this.decision.set(dec);
    this.submitting.set(true);
    this.submitError.set(null);

    this.aprobacionService.decidirViaToken(this.token, dec, this.comentario || undefined).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.resultado.set(res.mensaje || `Decisión registrada: ${dec === 'aprobar' ? 'aprobado' : 'rechazado'}.`);
      },
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(err.error?.message || 'Ocurrió un error al registrar la decisión. Intentá nuevamente.');
      },
    });
  }

  tipoLabel(tipo: string): string {
    return TIPO_LABEL[tipo] ?? tipo;
  }

  entidadLabel(entidad: string): string {
    return ENTIDAD_LABEL[entidad] ?? entidad;
  }
}
