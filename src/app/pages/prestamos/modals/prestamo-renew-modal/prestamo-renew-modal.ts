import { Component, OnChanges, SimpleChanges, inject, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GlassModalComponent } from '../../../../shared/glass-modal/glass-modal';
import { NumberFormatDirective } from '../../../../shared/number-format/number-format.directive';
import { ToastService } from '../../../../shared/toast/toast.service';
import { PrestamosService } from '../../../../services/prestamos.service';
import type { PrestamoWithComputed, Vehicle } from '../../../../models/prestamo';

@Component({
  selector: 'app-prestamo-renew-modal',
  standalone: true,
  imports: [FormsModule, GlassModalComponent, NumberFormatDirective],
  template: `
    <app-glass-modal
      [open]="open()"
      title="Renovar Préstamo"
      [subtitle]="loan() ? loan()!.lender.razonSocialCache + ' → ' + loan()!.borrower.razonSocialCache : ''"
      maxWidth="560px"
      (close)="close.emit()"
    >
      @if (loan(); as l) {
        <!-- Current status summary -->
        <div class="current-summary">
          <div class="summary-title">Situación actual</div>
          <div class="summary-grid">
            <div><span class="k">Capital</span><span class="v">{{ fmtC(l.capital, l.currency) }}</span></div>
            <div><span class="k">Días</span><span class="v">{{ l.computed.days }}d</span></div>
            <div><span class="k">Interés</span><span class="v">{{ fmtC(l.computed.interest, l.currency) }}</span></div>
            <div><span class="k total">Total acumulado</span><span class="v total">{{ fmtC(l.computed.total, l.currency) }}</span></div>
          </div>
        </div>

        <form (ngSubmit)="submit()" class="form" novalidate>
          <div class="form-row-inline">
            <div class="field">
              <label>Nuevo capital</label>
              <input appNumberFormat name="capital" [(ngModel)]="capital" min="1" />
              <span class="hint">Por defecto: capital + intereses acumulados</span>
              @if (errors()['capital']) {
                <span class="error">{{ errors()['capital'] }}</span>
              }
            </div>
            <div class="field">
              <label>Nueva tasa (% anual)</label>
              <input appNumberFormat [decimals]="2" name="rate" [(ngModel)]="rate" min="0" />
              @if (errors()['rate']) {
                <span class="error">{{ errors()['rate'] }}</span>
              }
            </div>
          </div>

          <div class="form-row-inline">
            <div class="field">
              <label>Inicio de la renovación</label>
              <input type="date" name="startDate" [(ngModel)]="startDate" />
            </div>
            <div class="field">
              <label>Nuevo vencimiento <span class="required">*</span></label>
              <input type="date" name="dueDate" [(ngModel)]="dueDate" />
              @if (errors()['dueDate']) {
                <span class="error">{{ errors()['dueDate'] }}</span>
              }
            </div>
          </div>

          <div class="field">
            <label>Vehículo</label>
            <select name="vehicle" [(ngModel)]="vehicle">
              <option value="PAGARE">Pagaré</option>
              <option value="TITULOS_ON">Títulos ON</option>
              <option value="CVU_TITULOS">CVU→Títulos</option>
              <option value="CRYPTO_UY">Crypto UY</option>
            </select>
          </div>

          <div class="warning-note">
            ⚠️ La renovación marca este préstamo como RENOVADO y crea uno nuevo en estado ACTIVO.
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="close.emit()" [disabled]="submitting()">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" [disabled]="submitting()">
              {{ submitting() ? 'Procesando...' : 'Renovar Préstamo' }}
            </button>
          </div>
        </form>
      }
    </app-glass-modal>
  `,
  styles: [
    `
      .current-summary {
        background: var(--color-gray-50);
        border: 1px solid var(--color-gray-200);
        border-radius: var(--radius-sm);
        padding: 0.875rem 1rem;
        margin-bottom: 1rem;
      }
      .summary-title {
        font-size: 0.6875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-gray-500);
        font-weight: 700;
        margin-bottom: 0.5rem;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 0.5rem;
      }
      .summary-grid > div {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }
      .summary-grid .k {
        font-size: 0.6875rem;
        color: var(--color-gray-500);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .summary-grid .v {
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--color-gray-900);
        font-variant-numeric: tabular-nums;
      }
      .summary-grid .k.total {
        color: var(--color-primary);
      }
      .summary-grid .v.total {
        color: var(--color-primary);
      }
      .form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .form-row-inline {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 1rem;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .field label {
        font-size: 0.6875rem;
        color: var(--color-gray-500);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
      }
      .required {
        color: var(--color-error);
      }
      .field input,
      .field select {
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--color-gray-200);
        border-radius: var(--radius-sm);
        background: var(--color-white);
        color: var(--color-gray-900);
        font-size: 0.875rem;
      }
      .field input:focus,
      .field select:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }
      .field .hint {
        font-size: 0.6875rem;
        color: var(--color-gray-500);
      }
      .error {
        font-size: 0.75rem;
        color: var(--color-error);
      }
      .warning-note {
        font-size: 0.8125rem;
        color: var(--color-warning);
        background: rgba(245, 158, 11, 0.1);
        border-radius: var(--radius-sm);
        padding: 0.625rem 0.875rem;
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid var(--color-gray-200);
        margin-top: 0.5rem;
      }
      .btn-primary {
        background: var(--color-primary);
        color: white;
        border: none;
        border-radius: var(--radius-sm);
        padding: 0.625rem 1.25rem;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .btn-primary:hover:not(:disabled) {
        background: var(--color-primary-dark);
      }
      .btn-secondary {
        background: var(--color-gray-100);
        color: var(--color-gray-700);
        border: 1px solid var(--color-gray-200);
        border-radius: var(--radius-sm);
        padding: 0.625rem 1.25rem;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-secondary:hover:not(:disabled) {
        background: var(--color-gray-200);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrestamoRenewModalComponent implements OnChanges {
  private service = inject(PrestamosService);
  private toast = inject(ToastService);

  open = input(false);
  loan = input<PrestamoWithComputed | null>(null);
  close = output<void>();
  saved = output<void>();

  capital: number | null = null;
  rate: number | null = null;
  startDate = '';
  dueDate = '';
  vehicle: Vehicle = 'PAGARE';

  submitting = signal(false);
  errors = signal<Record<string, string>>({});

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open']?.currentValue === true && this.loan()) {
      this.populate(this.loan()!);
    }
  }

  private populate(l: PrestamoWithComputed) {
    this.capital = Math.round(l.computed.total);
    this.rate = l.rate;
    this.startDate = new Date().toISOString().split('T')[0];
    this.dueDate = '';
    this.vehicle = l.vehicle;
    this.errors.set({});
  }

  private validate(): boolean {
    const e: Record<string, string> = {};
    if (this.capital == null || this.capital <= 0) e['capital'] = 'Debe ser mayor a 0';
    if (this.rate == null || this.rate < 0) e['rate'] = 'Debe ser ≥ 0';
    if (!this.dueDate) e['dueDate'] = 'Requerido';
    else if (this.startDate && new Date(this.dueDate) <= new Date(this.startDate)) {
      e['dueDate'] = 'Debe ser posterior al inicio';
    }
    this.errors.set(e);
    return Object.keys(e).length === 0;
  }

  submit() {
    const l = this.loan();
    if (!l || !this.validate()) return;
    this.submitting.set(true);
    this.service
      .renew(l._id, {
        capital: this.capital ?? undefined,
        rate: this.rate ?? undefined,
        startDate: this.startDate || undefined,
        dueDate: this.dueDate,
        vehicle: this.vehicle,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.toast.success('Préstamo renovado');
          this.saved.emit();
          this.close.emit();
        },
        error: (err) => {
          this.submitting.set(false);
          this.toast.error(err?.error?.message || 'Error al renovar');
        },
      });
  }

  fmtC(value: number | null | undefined, currency: string): string {
    if (value == null) return '—';
    const parts = Math.abs(value).toFixed(0).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const formatted = (value < 0 ? '-' : '') + parts.join(',');
    switch (currency) {
      case 'ARS':
        return `$${formatted}`;
      case 'USDC':
        return `${formatted} USDC`;
      default:
        return `USD ${formatted}`;
    }
  }
}
