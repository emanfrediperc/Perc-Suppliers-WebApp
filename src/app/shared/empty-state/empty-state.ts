import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-gray-400)" stroke-width="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
      <p class="title">{{ title() }}</p>
      @if (message()) { <p class="message">{{ message() }}</p> }
      <ng-content />
    </div>
  `,
  styles: [`
    .empty-state { text-align: center; padding: 3rem 1rem; }
    .title { font-size: 1rem; font-weight: 600; color: var(--color-gray-700); margin-top: 1rem; }
    .message { font-size: 0.875rem; color: var(--color-gray-500); margin-top: 0.5rem; }
  `],
})
export class EmptyStateComponent {
  title = input('Sin datos');
  message = input('');
}
