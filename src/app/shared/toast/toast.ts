import { Component } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type" (click)="toastService.remove(toast.id)">
          {{ toast.message }}
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container { position: fixed; top: 1rem; right: 1rem; z-index: 9999; display: flex; flex-direction: column; gap: 0.5rem; }
    .toast { padding: 0.75rem 1.25rem; border-radius: var(--radius-md); backdrop-filter: blur(20px); cursor: pointer; font-size: 0.875rem; font-weight: 500; animation: slideIn 0.3s ease; max-width: 400px; }
    .toast-success { background: rgba(34, 197, 94, 0.15); color: var(--color-success); border: 1px solid rgba(34, 197, 94, 0.3); }
    .toast-error { background: rgba(239, 68, 68, 0.15); color: var(--color-error); border: 1px solid rgba(239, 68, 68, 0.3); }
    .toast-info { background: rgba(59, 130, 246, 0.15); color: var(--color-info); border: 1px solid rgba(59, 130, 246, 0.3); }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  `],
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
