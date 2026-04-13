import { Component, OnChanges, SimpleChanges, inject, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GlassModalComponent } from '../../../../shared/glass-modal/glass-modal';
import { EmpresaPickerComponent } from '../../../../shared/empresa-picker/empresa-picker';
import { NumberFormatDirective } from '../../../../shared/number-format/number-format.directive';
import { ToastService } from '../../../../shared/toast/toast.service';
import { PrestamosService } from '../../../../services/prestamos.service';
import type {
  EmpresaRef,
  Currency,
  Vehicle,
  BalanceCut,
} from '../../../../models/prestamo';

@Component({
  selector: 'app-prestamo-form-modal',
  standalone: true,
  imports: [FormsModule, GlassModalComponent, EmpresaPickerComponent, NumberFormatDirective],
  template: `
    <app-glass-modal
      [open]="open()"
      title="Registrar Préstamo"
      subtitle="Intercompany loan — contrapartes y términos"
      maxWidth="640px"
      (close)="close.emit()"
    >
      <form (ngSubmit)="submit()" class="form" novalidate>
        <div class="form-row">
          <app-empresa-picker label="Acreedor (presta)" [(selected)]="lender" />
          @if (errors()['lender']) {
            <span class="error">{{ errors()['lender'] }}</span>
          }
        </div>

        <div class="form-row">
          <app-empresa-picker label="Deudor (recibe)" [(selected)]="borrower" />
          @if (errors()['borrower']) {
            <span class="error">{{ errors()['borrower'] }}</span>
          }
        </div>

        <div class="form-row-inline">
          <div class="field">
            <label>Moneda</label>
            <select name="currency" [(ngModel)]="currency">
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
          <div class="field">
            <label>Capital</label>
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
            <label>Inicio</label>
            <input type="date" name="startDate" [(ngModel)]="startDate" />
            @if (errors()['startDate']) {
              <span class="error">{{ errors()['startDate'] }}</span>
            }
          </div>
          <div class="field">
            <label>Vencimiento</label>
            <input type="date" name="dueDate" [(ngModel)]="dueDate" />
            @if (errors()['dueDate']) {
              <span class="error">{{ errors()['dueDate'] }}</span>
            }
          </div>
        </div>

        <div class="form-row-inline">
          <div class="field">
            <label>Vehículo</label>
            <select name="vehicle" [(ngModel)]="vehicle">
              <option value="PAGARE">Pagaré</option>
              <option value="TITULOS_ON">Títulos ON</option>
              <option value="CVU_TITULOS">CVU→Títulos</option>
              <option value="CRYPTO_UY">Crypto UY</option>
            </select>
          </div>
          <div class="field">
            <label>Corte de balance</label>
            <select name="balanceCut" [(ngModel)]="balanceCut">
              <option value="12-31">12-31 (Diciembre)</option>
              <option value="06-30">06-30 (Junio)</option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" (click)="close.emit()" [disabled]="submitting()">
            Cancelar
          </button>
          <button type="submit" class="btn-primary" [disabled]="submitting()">
            {{ submitting() ? 'Guardando...' : 'Registrar Préstamo' }}
          </button>
        </div>
      </form>
    </app-glass-modal>
  `,
  styles: [
    `
      .form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .form-row {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
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
export class PrestamoFormModalComponent implements OnChanges {
  private service = inject(PrestamosService);
  private toast = inject(ToastService);

  open = input(false);
  close = output<void>();
  saved = output<void>();

  lender: EmpresaRef | null = null;
  borrower: EmpresaRef | null = null;
  currency: Currency = 'USD';
  capital: number | null = null;
  rate: number | null = null;
  startDate = this.today();
  dueDate = '';
  vehicle: Vehicle = 'PAGARE';
  balanceCut: BalanceCut = '12-31';

  submitting = signal(false);
  errors = signal<Record<string, string>>({});

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open']?.currentValue === true) {
      this.reset();
    }
  }

  private reset() {
    this.lender = null;
    this.borrower = null;
    this.currency = 'USD';
    this.capital = null;
    this.rate = null;
    this.startDate = this.today();
    this.dueDate = '';
    this.vehicle = 'PAGARE';
    this.balanceCut = '12-31';
    this.errors.set({});
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private validate(): boolean {
    const e: Record<string, string> = {};
    if (!this.lender) e['lender'] = 'Seleccioná una empresa acreedora';
    if (!this.borrower) e['borrower'] = 'Seleccioná una empresa deudora';
    if (
      this.lender &&
      this.borrower &&
      this.lender.empresaId === this.borrower.empresaId
    ) {
      e['borrower'] = 'Debe ser distinto del acreedor';
    }
    if (this.capital == null || this.capital <= 0) e['capital'] = 'Debe ser mayor a 0';
    if (this.rate == null || this.rate < 0) e['rate'] = 'Debe ser ≥ 0';
    if (!this.startDate) e['startDate'] = 'Requerido';
    if (!this.dueDate) e['dueDate'] = 'Requerido';
    else if (new Date(this.dueDate) <= new Date(this.startDate)) {
      e['dueDate'] = 'Debe ser posterior al inicio';
    }
    this.errors.set(e);
    return Object.keys(e).length === 0;
  }

  submit() {
    if (!this.validate() || !this.lender || !this.borrower) return;
    this.submitting.set(true);
    this.service
      .create({
        lender: { empresaId: this.lender.empresaId, empresaKind: this.lender.empresaKind },
        borrower: { empresaId: this.borrower.empresaId, empresaKind: this.borrower.empresaKind },
        currency: this.currency,
        capital: this.capital!,
        rate: this.rate!,
        startDate: this.startDate,
        dueDate: this.dueDate,
        vehicle: this.vehicle,
        balanceCut: this.balanceCut,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.toast.success('Préstamo registrado');
          this.saved.emit();
          this.close.emit();
        },
        error: (err) => {
          this.submitting.set(false);
          this.toast.error(err?.error?.message || 'Error al registrar préstamo');
        },
      });
  }
}
