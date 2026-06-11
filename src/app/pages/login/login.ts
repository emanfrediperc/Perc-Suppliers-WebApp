import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { ToastComponent } from '../../shared/toast/toast';

type Paso = 'credenciales' | 'verificar' | 'enrolar' | 'recovery';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ToastComponent],
  template: `
    <app-toast />
    <div class="auth-page">
      <div class="auth-card card-glass modal-body-glass">
        <div class="auth-header">
          <div class="logo"><span class="logo-icon">B</span></div>
          <h1>Beethoven</h1>
          <p>{{ subtitulo() }}</p>
        </div>

        <!-- Paso 1: email + contraseña -->
        @if (paso() === 'credenciales') {
          <form (ngSubmit)="onSubmit()" class="auth-form">
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="email" name="email" placeholder="tu@email.com" required />
            </div>
            <div class="form-group">
              <label>Contrasena</label>
              <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required />
            </div>
            <button type="submit" class="btn-primary full-width" [disabled]="loading()">
              @if (loading()) { <span class="spinner"></span> }
              Iniciar Sesion
            </button>
          </form>
        }

        <!-- Paso 2a: enrolar TOTP (primer login) -->
        @if (paso() === 'enrolar') {
          <form (ngSubmit)="onConfirmarEnrolar()" class="auth-form">
            <p class="hint">
              Escaneá este código con tu app de autenticación (Google Authenticator,
              Authy, etc.) y luego ingresá el código de 6 dígitos.
            </p>
            @if (qrDataUrl()) {
              <div class="qr-wrap"><img [src]="qrDataUrl()" alt="QR TOTP" width="180" height="180" /></div>
            }
            <div class="form-group">
              <label>Código de 6 dígitos</label>
              <input type="text" inputmode="numeric" autocomplete="one-time-code"
                     [(ngModel)]="codigo" name="codigo" placeholder="123456" maxlength="6" required />
            </div>
            <button type="submit" class="btn-primary full-width" [disabled]="loading()">
              @if (loading()) { <span class="spinner"></span> }
              Activar y entrar
            </button>
            <button type="button" class="btn-link" (click)="volver()">Volver a ingresar</button>
          </form>
        }

        <!-- Paso 2b: verificar TOTP (ya enrolado) -->
        @if (paso() === 'verificar') {
          <form (ngSubmit)="onVerificar()" class="auth-form">
            <p class="hint">Ingresá el código de tu app de autenticación. También podés usar un código de recuperación.</p>
            <div class="form-group">
              <label>Código</label>
              <input type="text" inputmode="numeric" autocomplete="one-time-code"
                     [(ngModel)]="codigo" name="codigo" placeholder="123456" required />
            </div>
            <button type="submit" class="btn-primary full-width" [disabled]="loading()">
              @if (loading()) { <span class="spinner"></span> }
              Verificar
            </button>
            <button type="button" class="btn-link" (click)="volver()">Volver a ingresar</button>
          </form>
        }

        <!-- Paso 3: mostrar códigos de recuperación (una sola vez) -->
        @if (paso() === 'recovery') {
          <div class="auth-form">
            <p class="hint warning">
              ⚠️ Guardá estos códigos de recuperación en un lugar seguro.
              <strong>No se vuelven a mostrar.</strong> Sirven para entrar si perdés el dispositivo.
            </p>
            <ul class="recovery-list">
              @for (c of codigosRecuperacion(); track c) { <li>{{ c }}</li> }
            </ul>
            <button type="button" class="btn-primary full-width" (click)="onContinuar()">
              Ya los guardé, continuar
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 1rem;
    }
    .auth-card { max-width: 420px; width: 100%; padding: 2.5rem; }
    .auth-header { text-align: center; margin-bottom: 2rem; }
    .logo { display: inline-flex; margin-bottom: 1rem; }
    .logo-icon {
      width: 48px; height: 48px; border-radius: var(--radius-md);
      background: var(--gradient-sidebar); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 700;
    }
    .auth-header h1 { font-size: 1.5rem; font-weight: 700; color: var(--color-gray-900); }
    .auth-header p { font-size: 0.875rem; color: var(--color-gray-500); margin-top: 0.25rem; }
    .auth-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .form-group label { font-size: 0.875rem; font-weight: 500; color: var(--color-gray-700); }
    .form-group input {
      padding: 0.75rem 1rem; border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-md); font-size: 0.875rem;
      background: var(--glass-bg); backdrop-filter: blur(10px);
      transition: border-color var(--transition-fast);
    }
    .form-group input:focus { outline: none; border-color: var(--color-primary); }
    .btn-link {
      background: none; border: none; color: var(--color-primary);
      font-size: 0.8125rem; cursor: pointer; padding: 0.25rem; align-self: center;
    }
    .btn-link:hover { text-decoration: underline; }
    .hint { font-size: 0.8125rem; color: var(--color-gray-500); line-height: 1.4; }
    .hint.warning { color: var(--color-gray-700); }
    .qr-wrap {
      display: flex; justify-content: center; padding: 1rem;
      background: white; border-radius: var(--radius-md);
    }
    .recovery-list {
      list-style: none; display: grid; grid-template-columns: 1fr 1fr;
      gap: 0.5rem; padding: 1rem; border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--color-info) 8%, transparent);
      font-family: monospace; font-size: 0.875rem;
    }
`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  email = '';
  password = '';
  codigo = '';
  loading = signal(false);
  paso = signal<Paso>('credenciales');
  qrDataUrl = signal<string | null>(null);
  codigosRecuperacion = signal<string[]>([]);

  private challengeToken = '';

  constructor(private auth: AuthService, private router: Router, private toast: ToastService) {}

  subtitulo() {
    switch (this.paso()) {
      case 'enrolar': return 'Configurá tu segundo factor';
      case 'verificar': return 'Verificación en dos pasos';
      case 'recovery': return 'Códigos de recuperación';
      default: return 'Ingresa a tu cuenta';
    }
  }

  onSubmit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading.set(false);
        if ('access_token' in res) {
          this.irAlInicio(res.user.mustChangePassword);
          return;
        }
        // Challenge 2FA
        this.challengeToken = res.challengeToken;
        this.codigo = '';
        if (res.requiereEnrolarTotp) {
          this.qrDataUrl.set(res.enrolamiento?.qrDataUrl ?? null);
          this.paso.set('enrolar');
        } else {
          this.paso.set('verificar');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Error al iniciar sesion');
      },
    });
  }

  onVerificar() {
    if (!this.codigo) return;
    this.loading.set(true);
    this.auth.loginTotp(this.challengeToken, this.codigo.trim()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.irAlInicio(res.user.mustChangePassword);
      },
      error: (err) => this.manejarErrorDesafio(err, 'Código inválido'),
    });
  }

  onConfirmarEnrolar() {
    if (!this.codigo) return;
    this.loading.set(true);
    this.auth.loginTotpEnrolar(this.challengeToken, this.codigo.trim()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.codigosRecuperacion.set(res.codigosRecuperacion);
        this.paso.set('recovery');
      },
      error: (err) => this.manejarErrorDesafio(err, 'Código inválido'),
    });
  }

  onContinuar() {
    this.irAlInicio(this.auth.user()?.mustChangePassword);
  }

  /** Vuelve al paso de credenciales y limpia el estado del desafío. */
  volver() {
    this.paso.set('credenciales');
    this.challengeToken = '';
    this.codigo = '';
    this.qrDataUrl.set(null);
  }

  private manejarErrorDesafio(err: any, fallbackMsg: string) {
    this.loading.set(false);
    this.codigo = ''; // limpiar el código fallido para reintentar
    const msg: unknown = err?.error?.message;
    this.toast.error(typeof msg === 'string' ? msg : fallbackMsg);
    // Si el challenge expiró (TTL 5min), no hay forma de seguir: volver a credenciales.
    if (typeof msg === 'string' && msg.toLowerCase().includes('expir')) {
      this.volver();
    }
  }

  private irAlInicio(mustChangePassword?: boolean) {
    this.router.navigate([mustChangePassword ? '/change-password' : '/dashboard']);
  }
}
