import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { ToastComponent } from '../../shared/toast/toast';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, ToastComponent],
  template: `
    <app-toast />
    <div class="auth-page">
      <div class="auth-card card-glass modal-body-glass">
        <div class="auth-header">
          <div class="logo"><span class="logo-icon">P</span></div>
          <h1>Crear cuenta</h1>
          <p>Registrate en Perc Suppliers</p>
        </div>
        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-row">
            <div class="form-group">
              <label>Nombre</label>
              <input type="text" [(ngModel)]="nombre" name="nombre" placeholder="Tu nombre" required />
            </div>
            <div class="form-group">
              <label>Apellido</label>
              <input type="text" [(ngModel)]="apellido" name="apellido" placeholder="Tu apellido" />
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" placeholder="tu@email.com" required />
          </div>
          <div class="form-group">
            <label>Contrasena</label>
            <input type="password" [(ngModel)]="password" name="password" placeholder="Minimo 6 caracteres" required />
          </div>
          <button type="submit" class="btn-primary full-width" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> }
            Crear cuenta
          </button>
        </form>
        <p class="auth-footer">Ya tienes cuenta? <a routerLink="/login">Inicia sesion</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 1rem;
    }
    .auth-card { max-width: 480px; width: 100%; padding: 2.5rem; }
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
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .form-group label { font-size: 0.875rem; font-weight: 500; color: var(--color-gray-700); }
    .form-group input {
      padding: 0.75rem 1rem; border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-md); font-size: 0.875rem;
      background: var(--glass-bg); backdrop-filter: blur(10px);
      transition: border-color var(--transition-fast);
    }
    .form-group input:focus { outline: none; border-color: var(--color-primary); }
    .auth-footer {
      text-align: center; margin-top: 1.5rem; font-size: 0.875rem; color: var(--color-gray-500);
    }
    .auth-footer a { color: var(--color-primary); text-decoration: none; font-weight: 500; }
  `],
})
export class RegisterComponent {
  nombre = '';
  apellido = '';
  email = '';
  password = '';
  loading = signal(false);

  constructor(private auth: AuthService, private router: Router, private toast: ToastService) {}

  onSubmit() {
    if (!this.nombre || !this.email || !this.password) return;
    this.loading.set(true);
    this.auth.register({ nombre: this.nombre, apellido: this.apellido, email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Error al registrarse');
      },
    });
  }
}
