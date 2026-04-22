import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="page-header">
      <div>
        <h1>{{ title() }}</h1>
        @if (subtitle()) { <p class="subtitle">{{ subtitle() }}</p> }
      </div>
      <div class="actions"><ng-content /></div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    h1 { font-size: 1.5rem; font-weight: 700; color: var(--color-gray-900); margin: 0; }
    .subtitle { font-size: 0.875rem; color: var(--color-gray-500); margin-top: 0.25rem; }
    .actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }

    @media (max-width: 600px) {
      .page-header { flex-direction: column; align-items: stretch; gap: 0.75rem; }
      h1 { font-size: 1.25rem; }
      .actions { width: 100%; }
      .actions > * { flex: 1 1 auto; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  title = input<string>('');
  subtitle = input<string>('');
}
