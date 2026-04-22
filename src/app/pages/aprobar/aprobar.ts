import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { AprobacionService, ContextoToken } from '../../services/aprobacion.service';

@Component({
  selector: 'app-aprobar',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, RouterLink],
  template: `
    <div class="aprobar-page">
      <div class="aprobar-card card-glass modal-body-glass">

        @if (loading()) {
          <div class="loading-state">
            <span class="spinner"></span>
            <p>Cargando información de la aprobación...</p>
          </div>
        }

        @if (!loading() && error()) {
          <div class="error-state">
            <div class="error-icon">!</div>
            <h2>Token inválido o expirado</h2>
            <p>{{ error() }}</p>
            <a routerLink="/login" class="btn-login-link">Iniciá sesión para ver tus aprobaciones</a>
          </div>
        }

        @if (!loading() && resultado()) {
          <div class="success-state">
            <div class="success-icon">✓</div>
            <h2>Decisión registrada</h2>
            <p>{{ resultado() }}</p>
            <a routerLink="/login" class="btn-login-link">Iniciá sesión para ver tus aprobaciones</a>
          </div>
        }

        @if (!loading() && !error() && !resultado() && contexto()) {
          <div class="confirm-state">
            <h1>¿Confirmás la decisión?</h1>

            <div class="contexto-card">
              <div class="contexto-row">
                <span class="label">Tipo</span>
                <span class="value">{{ contexto()!.tipo }}</span>
              </div>
              <div class="contexto-row">
                <span class="label">Entidad</span>
                <span class="value">{{ contexto()!.entidad }}</span>
              </div>
              <div class="contexto-row">
                <span class="label">Descripción</span>
                <span class="value">{{ contexto()!.descripcion }}</span>
              </div>
              <div class="contexto-row">
                <span class="label">Monto</span>
                <span class="value monto">{{ contexto()!.monto | currency:'ARS':'$ ':'1.0-0' }}</span>
              </div>
              <div class="contexto-row">
                <span class="label">Solicitado por</span>
                <span class="value">{{ contexto()!.solicitante }}</span>
              </div>
              <div class="contexto-row">
                <span class="label">Fecha solicitud</span>
                <span class="value">{{ contexto()!.fechaSolicitud | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="contexto-row">
                <span class="label">Expira</span>
                <span class="value expira">{{ contexto()!.expiraEn | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>

            <div class="form-group">
              <label>Comentario (opcional)</label>
              <textarea
                [(ngModel)]="comentario"
                name="comentario"
                maxlength="500"
                rows="3"
                placeholder="Ingresá un comentario opcional..."
              ></textarea>
            </div>

            <div class="btn-group">
              <button
                class="btn-approve"
                [class.btn-highlighted]="decision() === 'aprobar'"
                [disabled]="submitting()"
                (click)="submit('aprobar')"
              >
                @if (submitting() && decision() === 'aprobar') { <span class="spinner-sm"></span> }
                Aprobar
              </button>
              <button
                class="btn-reject"
                [class.btn-highlighted]="decision() === 'rechazar'"
                [disabled]="submitting()"
                (click)="submit('rechazar')"
              >
                @if (submitting() && decision() === 'rechazar') { <span class="spinner-sm"></span> }
                Rechazar
              </button>
            </div>

            @if (submitError()) {
              <p class="submit-error">{{ submitError() }}</p>
            }
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .aprobar-page {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 1.5rem; background: var(--bg-primary, #f8fafc);
    }
    .aprobar-card {
      max-width: 520px; width: 100%; padding: 2.5rem;
      border-radius: 16px; background: var(--card-bg, white);
      border: 1px solid var(--glass-border, #e2e8f0);
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    h1 { font-size: 1.375rem; font-weight: 700; color: var(--text-primary, #1e293b); margin: 0 0 1.5rem; }

    /* Loading */
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 2rem 0; color: var(--text-muted, #64748b); }
    .spinner { width: 28px; height: 28px; border: 3px solid var(--glass-border, #e2e8f0); border-top-color: var(--primary, #6366f1); border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Error / Success */
    .error-state, .success-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1rem 0; text-align: center; }
    .error-icon { width: 56px; height: 56px; background: #fee2e2; color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; }
    .success-icon { width: 56px; height: 56px; background: #d1fae5; color: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; }
    .error-state h2, .success-state h2 { font-size: 1.125rem; font-weight: 700; color: var(--text-primary, #1e293b); margin: 0; }
    .error-state p, .success-state p { font-size: 0.875rem; color: var(--text-muted, #64748b); margin: 0; }
    .btn-login-link {
      margin-top: 0.5rem; padding: 0.625rem 1.25rem;
      background: var(--primary, #6366f1); color: white;
      border-radius: 8px; text-decoration: none; font-size: 0.875rem; font-weight: 600;
    }
    .btn-login-link:hover { opacity: 0.9; }

    /* Contexto card */
    .contexto-card {
      background: var(--glass-bg, #f8fafc); border: 1px solid var(--glass-border, #e2e8f0);
      border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem;
      display: flex; flex-direction: column; gap: 0.625rem;
    }
    .contexto-row { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.875rem; }
    .label { color: var(--text-muted, #64748b); flex-shrink: 0; }
    .value { color: var(--text-primary, #1e293b); font-weight: 500; text-align: right; }
    .monto { font-size: 1rem; font-weight: 700; color: var(--primary, #6366f1); }
    .expira { color: #d97706; }

    /* Form */
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1.25rem; }
    .form-group label { font-size: 0.875rem; font-weight: 500; color: var(--text-secondary, #475569); }
    .form-group textarea {
      padding: 0.625rem 0.875rem; border: 1px solid var(--glass-border, #e2e8f0);
      border-radius: 8px; background: var(--glass-bg, #f8fafc); color: var(--text-primary, #1e293b);
      font-size: 0.875rem; resize: vertical; font-family: inherit;
    }
    .form-group textarea:focus { outline: none; border-color: var(--primary, #6366f1); }

    /* Buttons */
    .btn-group { display: flex; gap: 0.75rem; }
    .btn-approve, .btn-reject {
      flex: 1; padding: 0.75rem 1rem; border: none; border-radius: 10px;
      font-size: 0.9375rem; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      opacity: 0.7; transition: opacity 0.15s, transform 0.1s;
    }
    .btn-approve { background: #10b981; color: white; }
    .btn-reject { background: #ef4444; color: white; }
    .btn-approve.btn-highlighted, .btn-reject.btn-highlighted { opacity: 1; transform: scale(1.02); }
    .btn-approve:hover:not(:disabled), .btn-reject:hover:not(:disabled) { opacity: 0.9; }
    .btn-approve:disabled, .btn-reject:disabled { cursor: not-allowed; }
    .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }

    .submit-error { color: #dc2626; font-size: 0.8125rem; text-align: center; margin-top: 0.75rem; }
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
}
