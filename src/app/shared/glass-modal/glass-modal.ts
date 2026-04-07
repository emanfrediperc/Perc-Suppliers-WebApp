import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-glass-modal',
  standalone: true,
  template: `
    @if (open()) {
      <div class="modal-overlay" (click)="onOverlayClick($event)">
        <div class="modal-container card-glass modal-body-glass" [style.max-width]="maxWidth()">
          <div class="modal-header">
            <h2>{{ title() }}</h2>
            <button class="close-btn" (click)="close.emit()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          @if (subtitle()) { <p class="modal-subtitle">{{ subtitle() }}</p> }
          <div class="modal-body">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      padding: 1rem;
      animation: fadeIn 0.2s ease;
    }
    .modal-container {
      width: 100%; padding: 1.5rem;
      max-height: 90vh; overflow-y: auto;
      animation: slideUp 0.3s ease;
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 0.5rem;
    }
    .modal-header h2 {
      font-size: 1.25rem; font-weight: 700; color: var(--color-gray-900);
    }
    .close-btn {
      background: none; border: none; color: var(--color-gray-400);
      cursor: pointer; padding: 0.25rem; border-radius: var(--radius-sm);
      transition: color var(--transition-fast);
    }
    .close-btn:hover { color: var(--color-gray-700); }
    .modal-subtitle {
      font-size: 0.875rem; color: var(--color-gray-500); margin-bottom: 1rem;
    }
    .modal-body { margin-top: 1rem; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `],
})
export class GlassModalComponent {
  open = input(false);
  title = input('');
  subtitle = input('');
  maxWidth = input('560px');
  close = output<void>();

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }
}
