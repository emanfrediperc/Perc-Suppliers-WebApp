import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IdleService } from '../../services/idle.service';

@Component({
  selector: 'app-session-timer',
  standalone: true,
  template: `
    @if (idle.showWarning()) {
      <button class="session-pill" [class.critical]="idle.remainingSeconds() <= 60" (click)="idle.renew()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        {{ idle.displayTime() }}
      </button>
    }
  `,
  styles: [`
    .session-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 20px;
      border: 1px solid #f59e0b;
      background: rgba(245, 158, 11, 0.1);
      color: #b45309;
      font-size: 0.75rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      transition: all 0.2s;
      animation: fadeIn 0.3s ease;
    }
    .session-pill:hover {
      background: rgba(245, 158, 11, 0.2);
      border-color: #d97706;
    }
    .session-pill.critical {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
      animation: pulse 1s ease-in-out infinite;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionTimerComponent {
  constructor(public idle: IdleService) {}
}
