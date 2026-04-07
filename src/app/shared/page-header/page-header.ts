import { Component, input } from '@angular/core';

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
    .actions { display: flex; gap: 0.75rem; align-items: center; }
  `],
})
export class PageHeaderComponent {
  title = input<string>('');
  subtitle = input<string>('');
}
