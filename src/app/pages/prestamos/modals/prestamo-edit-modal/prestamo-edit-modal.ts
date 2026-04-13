import { Component, OnChanges, SimpleChanges, inject, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GlassModalComponent } from '../../../../shared/glass-modal/glass-modal';
import { NumberFormatDirective } from '../../../../shared/number-format/number-format.directive';
import { ToastService } from '../../../../shared/toast/toast.service';
import { PrestamosService } from '../../../../services/prestamos.service';
import type { PrestamoWithComputed, Vehicle } from '../../../../models/prestamo';

@Component({
  selector: 'app-prestamo-edit-modal',
  standalone: true,
  imports: [FormsModule, GlassModalComponent, NumberFormatDirective],
  template: `
    <app-glass-modal
      [open]="open()"
      title="Editar Préstamo"
      [subtitle]="loan() ? loan()!.lender.razonSocialCache + ' → ' + loan()!.borrower.razonSocialCache : ''"
      maxWidth="560px"
      (close)="close.emit()"
    >
      @if (loan(); as l) {
        <form (ngSubmit)="submit()" class="form" novalidate>
          <div class="form-row-inline">
            <div class="field">
              <label>Capital ({{ l.currency }})</label>
              <input appNumberFormat name="capital" [(ngModel)]="capital" min="1" />
              @if (errors()['capital']) {
                <span class="error">{{ errors()['capital'] }}</span>
              }
            </div>
            <div class="field">
              <label>Tasa (% anual)</label>
              <input appNumberFormat [decimals]="2" name="rate" [(ngModel)]="rate" min="0" />
              @if (errors()['rate']) {
                <span class="error">{{ errors()['rate'] }}</span>
              }
            </div>
          </div>

          <div class="form-row-inline">
            <div class="field">
              <label>Vencimiento</label>
              <input type="date" name="dueDate" [(ngModel)]="dueDate" />
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
          </div>

          <div class="field">
            <label>Motivo del cambio <span class="required">*</span></label>
            <textarea
              name="reason"
              [(ngModel)]="reason"
              rows="2"
              placeholder="Describí el motivo del ajuste (requerido)"
            ></textarea>
            @if (errors()['reason']) {
              <span class="error">{{ errors()['reason'] }}</span>
            }
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="close.emit()" [disabled]="submitting()">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" [disabled]="submitting()">
              {{ submitting() ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      }
    </app-glass-modal>
  `,
  styles: [
    `
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
      .field select,
      .field textarea {
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--color-gray-200);
        border-radius: var(--radius-sm);
        background: var(--color-white);
        color: var(--color-gray-900);
        font-size: 0.875rem;
        font-family: inherit;
      }
      .field textarea {
        resize: vertical;
        min-height: 60px;
      }
      .field input:focus,
      .field select:focus,
      .field textarea:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }
      .error {
        font-size: 0.75rem;
        color: var(--color-error);
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
export class PrestamoEditModalComponent implements OnChanges {
  private service = inject(PrestamosService);
  private toast = inject(ToastService);

  open = input(false);
  loan = input<PrestamoWithComputed | null>(null);
  close = output<void>();
  saved = output<void>();

  capital: number | null = null;
  rate: number | null = null;
  dueDate = '';
  vehicle: Vehicle = 'PAGARE';
  reason = '';

  submitting = signal(false);
  errors = signal<Record<string, string>>({});

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open']?.currentValue === true && this.loan()) {
      this.populate(this.loan()!);
    }
  }

  private populate(l: PrestamoWithComputed) {
    this.capital = l.capital;
    this.rate = l.rate;
    this.dueDate = new Date(l.dueDate).toISOString().split('T')[0];
    this.vehicle = l.vehicle;
    this.reason = '';
    this.errors.set({});
  }

  private validate(): boolean {
    const e: Record<string, string> = {};
    if (this.capital == null || this.capital <= 0) e['capital'] = 'Debe ser mayor a 0';
    if (this.rate == null || this.rate < 0) e['rate'] = 'Debe ser ≥ 0';
    if (!this.reason.trim()) e['reason'] = 'El motivo es obligatorio';
    this.errors.set(e);
    return Object.keys(e).length === 0;
  }

  submit() {
    const l = this.loan();
    if (!l || !this.validate()) return;
    this.submitting.set(true);
    this.service
      .update(l._id, {
        capital: this.capital ?? undefined,
        rate: this.rate ?? undefined,
        dueDate: this.dueDate || undefined,
        vehicle: this.vehicle,
        reason: this.reason.trim(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.toast.success('Préstamo actualizado');
          this.saved.emit();
          this.close.emit();
        },
        error: (err) => {
          this.submitting.set(false);
          this.toast.error(err?.error?.message || 'Error al actualizar');
        },
      });
  }
}
