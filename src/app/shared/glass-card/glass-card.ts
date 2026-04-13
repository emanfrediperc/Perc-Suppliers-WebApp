import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-glass-card',
  standalone: true,
  template: `
    <div class="card-glass" [style.padding]="padding()">
      @if (title()) { <h3 class="card-title">{{ title() }}</h3> }
      <ng-content />
    </div>
  `,
  styles: [`
    .card-glass { padding: 1.5rem; }
    .card-title { font-size: 1rem; font-weight: 600; color: var(--color-gray-900); margin-bottom: 1rem; }
    :host { display: block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlassCardComponent {
  title = input<string>('');
  padding = input<string>('1.5rem');
}
