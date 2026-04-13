import { Component, OnInit, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-range-selector',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="date-range-selector card-glass">
      <div class="presets">
        @for (preset of presets; track preset.label) {
          <button class="preset-btn" [class.active]="activePreset() === preset.label" (click)="applyPreset(preset)">
            {{ preset.label }}
          </button>
        }
      </div>
      <div class="custom-range">
        <div class="date-field">
          <label>Desde</label>
          <input type="date" [ngModel]="desde()" (ngModelChange)="desde.set($event); activePreset.set('Personalizado'); emitRange()" />
        </div>
        <div class="date-field">
          <label>Hasta</label>
          <input type="date" [ngModel]="hasta()" (ngModelChange)="hasta.set($event); activePreset.set('Personalizado'); emitRange()" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .date-range-selector {
      display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
    }
    .presets { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .preset-btn {
      padding: 0.375rem 0.75rem; border-radius: var(--radius-full, 9999px); border: 1px solid var(--color-gray-200);
      background: transparent; color: var(--color-gray-600); font-size: 0.8125rem; cursor: pointer;
      transition: all 0.2s;
    }
    .preset-btn:hover { border-color: var(--color-primary, #6366f1); color: var(--color-primary, #6366f1); }
    .preset-btn.active {
      background: var(--color-primary, #6366f1); color: #fff; border-color: var(--color-primary, #6366f1);
    }
    .custom-range { display: flex; gap: 0.75rem; align-items: flex-end; margin-left: auto; }
    .date-field { display: flex; flex-direction: column; gap: 0.25rem; }
    .date-field label { font-size: 0.6875rem; font-weight: 500; color: var(--color-gray-500); text-transform: uppercase; }
    .date-field input {
      padding: 0.375rem 0.5rem; border: 1px solid var(--color-gray-200); border-radius: var(--radius-sm, 6px);
      font-size: 0.8125rem; color: var(--color-gray-800); background: var(--color-gray-50, #f9fafb);
    }
    .date-field input:focus { outline: none; border-color: var(--color-primary, #6366f1); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeSelectorComponent implements OnInit {
  rangeChange = output<{ desde: string; hasta: string }>();

  desde = signal('');
  hasta = signal('');
  activePreset = signal('30 dias');

  presets = [
    { label: '7 dias', days: 7 },
    { label: '30 dias', days: 30 },
    { label: '90 dias', days: 90 },
    { label: 'Este anio', days: -1 },
    { label: 'Personalizado', days: 0 },
  ];

  ngOnInit() {
    this.applyPreset(this.presets[1]);
  }

  applyPreset(preset: { label: string; days: number }) {
    this.activePreset.set(preset.label);
    if (preset.days === 0) return;

    const hasta = new Date();
    let desde: Date;

    if (preset.days === -1) {
      desde = new Date(hasta.getFullYear(), 0, 1);
    } else {
      desde = new Date();
      desde.setDate(desde.getDate() - preset.days);
    }

    this.desde.set(desde.toISOString().split('T')[0]);
    this.hasta.set(hasta.toISOString().split('T')[0]);
    this.emitRange();
  }

  emitRange() {
    if (this.desde() && this.hasta()) {
      this.rangeChange.emit({ desde: this.desde(), hasta: this.hasta() });
    }
  }
}
