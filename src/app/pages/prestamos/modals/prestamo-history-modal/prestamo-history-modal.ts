import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { GlassModalComponent } from '../../../../shared/glass-modal/glass-modal';
import type { PrestamoWithComputed, PrestamoHistoryEntry } from '../../../../models/prestamo';

@Component({
  selector: 'app-prestamo-history-modal',
  standalone: true,
  imports: [DatePipe, GlassModalComponent],
  template: `
    <app-glass-modal
      [open]="open()"
      title="Historial del Préstamo"
      [subtitle]="loan() ? loan()!.lender.razonSocialCache + ' → ' + loan()!.borrower.razonSocialCache : ''"
      maxWidth="560px"
      (close)="close.emit()"
    >
      @if (loan()) {
        @if (reversedHistory().length === 0) {
          <div class="empty-state">Sin eventos registrados</div>
        } @else {
          <div class="timeline">
            @for (entry of reversedHistory(); track entry.date) {
              <div class="entry">
                <div class="entry-bullet" [class]="actionClass(entry.action)"></div>
                <div class="entry-content">
                  <div class="entry-header">
                    <span class="entry-action" [class]="actionClass(entry.action)">{{ entry.action }}</span>
                    <span class="entry-date">{{ entry.date | date: 'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                  <div class="entry-detail">{{ entry.detail }}</div>
                </div>
              </div>
            }
          </div>
        }
      }
    </app-glass-modal>
  `,
  styles: [
    `
      .empty-state {
        padding: 2rem 1rem;
        text-align: center;
        color: var(--color-gray-500);
        font-size: 0.875rem;
      }
      .timeline {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 0.5rem 0;
      }
      .entry {
        display: flex;
        gap: 0.875rem;
        position: relative;
      }
      .entry:not(:last-child)::after {
        content: '';
        position: absolute;
        left: 5px;
        top: 14px;
        bottom: -12px;
        width: 2px;
        background: var(--color-gray-200);
      }
      .entry-bullet {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-top: 4px;
        background: var(--color-gray-400);
        flex-shrink: 0;
        position: relative;
        z-index: 1;
        box-shadow: 0 0 0 3px var(--color-gray-50);
      }
      .entry-bullet.action-created {
        background: var(--color-info);
      }
      .entry-bullet.action-edited {
        background: var(--color-warning);
      }
      .entry-bullet.action-cleared {
        background: var(--color-error);
      }
      .entry-bullet.action-renewed {
        background: var(--color-success);
      }
      .entry-content {
        flex: 1;
        min-width: 0;
      }
      .entry-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
      }
      .entry-action {
        font-size: 0.8125rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: var(--color-gray-700);
      }
      .entry-action.action-created {
        color: var(--color-info);
      }
      .entry-action.action-edited {
        color: var(--color-warning);
      }
      .entry-action.action-cleared {
        color: var(--color-error);
      }
      .entry-action.action-renewed {
        color: var(--color-success);
      }
      .entry-date {
        font-size: 0.6875rem;
        color: var(--color-gray-500);
        white-space: nowrap;
      }
      .entry-detail {
        font-size: 0.8125rem;
        color: var(--color-gray-700);
        line-height: 1.4;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrestamoHistoryModalComponent {
  open = input(false);
  loan = input<PrestamoWithComputed | null>(null);
  close = output<void>();

  reversedHistory = computed<PrestamoHistoryEntry[]>(() => {
    const l = this.loan();
    if (!l) return [];
    return [...l.history].reverse();
  });

  actionClass(action: string): string {
    const a = action.toLowerCase();
    if (a.includes('creado')) return 'action-created';
    if (a.includes('editado')) return 'action-edited';
    if (a.includes('cancelado')) return 'action-cleared';
    if (a.includes('renovado')) return 'action-renewed';
    return '';
  }
}
