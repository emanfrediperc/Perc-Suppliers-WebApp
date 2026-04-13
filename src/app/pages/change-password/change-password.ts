import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { ToastComponent } from '../../shared/toast/toast';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [FormsModule, ToastComponent],
  template: `
    <app-toast />
    <div class="auth-page">
      <div class="auth-card card-glass modal-body-glass">
        <div class="auth-header">
          <div class="logo"><span class="logo-icon">P</span></div>
          <h1>Cambiar contraseña</h1>
          <p>Necesitás cambiar tu contraseña antes de continuar</p>
        </div>
        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label>Contraseña actual</label>
            <input type="password" [(ngModel)]="oldPassword" name="oldPassword" placeholder="••••••••" required />
          </div>
          <div class="form-group">
            <label>Nueva contraseña</label>
            <input type="password" [(ngModel)]="newPassword" name="newPassword" placeholder="••••••••" required minlength="8" />
          </div>
          <div class="form-group">
            <label>Confirmar contraseña</label>
            <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="••••••••" required />
          </div>
          @if (error()) {
            <p class="error-msg">{{ error() }}</p>
          }
          <button type="submit" class="btn-primary full-width" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> }
            Cambiar contraseña
          </button>
        </form>
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
    .error-msg { font-size: 0.875rem; color: var(--color-danger, #ef4444); text-align: center; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordComponent {
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router, private toast: ToastService) {}

  onSubmit() {
    this.error.set('');
    if (this.newPassword.length < 8) {
      this.error.set('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }
    this.loading.set(true);
    this.auth.changePassword(this.oldPassword, this.newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Contraseña actualizada correctamente');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al cambiar la contraseña');
      },
    });
  }
}
