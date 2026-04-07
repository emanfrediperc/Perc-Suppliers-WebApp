import { Component, OnInit, signal } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, UserAdmin } from '../../../services/user.service';

const ROLES = ['admin', 'tesoreria', 'contabilidad', 'consulta'];

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [DatePipe, UpperCasePipe, FormsModule],
  template: `
    <div class="page">
      <h1>Gestion de Usuarios</h1>
      <div class="table-wrapper">
        <table class="glass-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (u of users(); track u._id) {
              <tr>
                <td>{{ u.nombre }} {{ u.apellido }}</td>
                <td>{{ u.email }}</td>
                <td>
                  <select class="role-select" [ngModel]="u.role" (ngModelChange)="changeRole(u, $event)">
                    @for (r of roles; track r) {
                      <option [value]="r">{{ r | uppercase }}</option>
                    }
                  </select>
                </td>
                <td>
                  <span class="status-pill" [class.active]="u.activo" [class.inactive]="!u.activo">
                    {{ u.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>{{ u.createdAt | date:'dd/MM/yyyy' }}</td>
                <td class="actions-cell">
                  <button class="toggle-btn" (click)="toggleActive(u)">
                    {{ u.activo ? 'Desactivar' : 'Activar' }}
                  </button>
                  <button class="toggle-btn reset-btn" (click)="resetPassword(u)">
                    Reset Password
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (tempPassword()) {
      <div class="modal-overlay" (click)="tempPassword.set(null)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>Password Temporal</h3>
          <p>La nueva password temporal para <strong>{{ resetUser() }}</strong> es:</p>
          <div class="temp-password">{{ tempPassword() }}</div>
          <p class="warning">Copie esta password. No se mostrara de nuevo.</p>
          <button class="close-btn" (click)="tempPassword.set(null)">Cerrar</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { max-width: 1000px; }
    h1 { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1.5rem; }
    .table-wrapper {
      background: var(--card-bg);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      overflow: hidden;
    }
    .glass-table { width: 100%; border-collapse: collapse; }
    .glass-table th {
      text-align: left;
      padding: 0.875rem 1rem;
      background: var(--glass-bg);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .glass-table td {
      padding: 0.875rem 1rem;
      border-top: 1px solid var(--glass-border);
      font-size: 0.875rem;
      color: var(--text-primary);
    }
    .role-select {
      padding: 0.375rem 0.5rem;
      border: 1px solid var(--glass-border);
      border-radius: 6px;
      background: var(--glass-bg);
      color: var(--text-primary);
      font-size: 0.8125rem;
      cursor: pointer;
    }
    .status-pill {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
    }
    .status-pill.active { background: #d1fae5; color: #065f46; }
    .status-pill.inactive { background: #fee2e2; color: #991b1b; }
    .toggle-btn {
      padding: 0.375rem 0.75rem;
      border: 1px solid var(--glass-border);
      border-radius: 6px;
      background: var(--glass-bg);
      color: var(--text-primary);
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.2s;
    }
    .toggle-btn:hover { background: var(--glass-hover); }
    .actions-cell { display: flex; gap: 0.5rem; }
    .reset-btn { color: var(--accent-color, #6366f1); }
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); display: flex; align-items: center;
      justify-content: center; z-index: 1000;
    }
    .modal-content {
      background: var(--card-bg, #fff); border-radius: 12px;
      padding: 2rem; max-width: 420px; width: 90%;
      border: 1px solid var(--glass-border);
    }
    .modal-content h3 { margin: 0 0 1rem; font-size: 1.125rem; color: var(--text-primary); }
    .modal-content p { font-size: 0.875rem; color: var(--text-secondary); margin: 0.5rem 0; }
    .temp-password {
      background: var(--glass-bg); border: 1px solid var(--glass-border);
      border-radius: 8px; padding: 0.75rem 1rem; font-family: monospace;
      font-size: 1.125rem; text-align: center; margin: 1rem 0;
      color: var(--text-primary); user-select: all;
    }
    .warning { color: #dc2626; font-weight: 600; font-size: 0.8125rem; }
    .close-btn {
      width: 100%; padding: 0.625rem; border: none; border-radius: 8px;
      background: var(--accent-color, #6366f1); color: white;
      cursor: pointer; font-size: 0.875rem; font-weight: 600; margin-top: 1rem;
    }
  `],
})
export class UsuariosComponent implements OnInit {
  users = signal<UserAdmin[]>([]);
  roles = ROLES;
  tempPassword = signal<string | null>(null);
  resetUser = signal<string>('');

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getAll().subscribe(data => this.users.set(data));
  }

  changeRole(user: UserAdmin, role: string) {
    this.userService.update(user._id, { role }).subscribe(updated => {
      this.users.update(list => list.map(u => u._id === updated._id ? { ...u, role: updated.role } : u));
    });
  }

  toggleActive(user: UserAdmin) {
    this.userService.update(user._id, { activo: !user.activo }).subscribe(updated => {
      this.users.update(list => list.map(u => u._id === updated._id ? { ...u, activo: updated.activo } : u));
    });
  }

  resetPassword(user: UserAdmin) {
    if (!confirm(`Resetear password de ${user.email}?`)) return;
    this.resetUser.set(user.email);
    this.userService.resetPassword(user._id).subscribe(res => {
      this.tempPassword.set(res.temporaryPassword);
    });
  }
}
