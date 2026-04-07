import { Component, input, output } from '@angular/core';
import { GlassModalComponent } from '../glass-modal/glass-modal';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [GlassModalComponent],
  template: `
    <app-glass-modal [open]="open()" [title]="title()" [maxWidth]="'420px'" (close)="cancel.emit()">
      <p class="confirm-message">{{ message() }}</p>
      <div class="confirm-actions">
        <button class="btn-secondary" (click)="cancel.emit()">Cancelar</button>
        <button class="btn-primary" [class]="confirmClass()" (click)="confirm.emit()">{{ confirmText() }}</button>
      </div>
    </app-glass-modal>
  `,
  styles: [`
    .confirm-message { font-size: 0.875rem; color: var(--color-gray-600); line-height: 1.5; }
    .confirm-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; }
    .confirm-actions .btn-primary, .confirm-actions .btn-secondary { padding: 0.625rem 1.25rem; font-size: 0.875rem; }
    .danger { --c: var(--color-error); }
  `],
})
export class ConfirmDialogComponent {
  open = input(false);
  title = input('Confirmar');
  message = input('');
  confirmText = input('Confirmar');
  confirmClass = input('');
  confirm = output<void>();
  cancel = output<void>();
}
