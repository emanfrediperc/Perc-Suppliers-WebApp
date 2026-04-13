import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export interface BarChartItem {
  label: string;
  value: number;
  displayValue: string;
  color: string;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  template: `
    <div class="bar-chart">
      <div class="bars">
        @for (item of items; track item.label) {
          <div class="bar-wrapper">
            <div class="bar-value" [style.color]="item.color">{{ item.displayValue }}</div>
            <div
              class="bar"
              [style.height.%]="getBarHeightPct(item.value)"
              [style.background]="'linear-gradient(180deg, ' + item.color + ' 0%, ' + item.color + 'cc 100%)'"
              [style.box-shadow]="'0 0 12px ' + item.color + '40'"
            ></div>
          </div>
        }
      </div>
      <div class="labels">
        @for (item of items; track item.label) {
          <div class="label">{{ item.label }}</div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .bar-chart {
      position: relative;
      padding: 1.75rem 0 0.5rem;
    }
    .bars {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      gap: 1rem;
      height: 180px;
      border-bottom: 1px solid var(--color-gray-200);
    }
    .bar-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      height: 100%;
      position: relative;
    }
    .bar-value {
      font-size: 0.6875rem;
      font-weight: 700;
      white-space: nowrap;
      position: absolute;
      top: -1.25rem;
    }
    .bar {
      width: 100%;
      max-width: 60px;
      border-top-left-radius: 0.375rem;
      border-top-right-radius: 0.375rem;
      transition: all 0.5s ease-out;
    }
    .labels {
      display: flex;
      justify-content: space-around;
      gap: 1rem;
      margin-top: 0.5rem;
    }
    .label {
      flex: 1;
      font-size: 0.625rem;
      color: var(--color-gray-500);
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent {
  @Input({ required: true }) items: BarChartItem[] = [];

  private get maxValue(): number {
    return Math.max(...this.items.map((i) => i.value), 1);
  }

  getBarHeightPct(value: number): number {
    return Math.max(5, (value / this.maxValue) * 100);
  }
}
