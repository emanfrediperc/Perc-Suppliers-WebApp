import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  template: `
    <div class="card-glass skeleton-table">
      <div class="skeleton-header">
        @for (col of colArray(); track $index) {
          <div class="skeleton skeleton-text" [style.width]="col"></div>
        }
      </div>
      @for (r of rowArray(); track $index) {
        <div class="skeleton-row">
          @for (col of colArray(); track $index) {
            <div class="skeleton skeleton-text-sm" [style.width]="col"></div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton-table { padding: 0; overflow: hidden; }
    .skeleton-header {
      display: flex; gap: 1rem; padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-gray-200);
    }
    .skeleton-row {
      display: flex; gap: 1rem; padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-gray-100);
    }
    .skeleton-row:last-child { border-bottom: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonTableComponent {
  rows = input(5);
  cols = input(4);

  colArray = () => {
    const widths = ['20%', '30%', '25%', '15%', '10%'];
    return Array.from({ length: this.cols() }, (_, i) => widths[i % widths.length]);
  };

  rowArray = () => Array.from({ length: this.rows() });
}
