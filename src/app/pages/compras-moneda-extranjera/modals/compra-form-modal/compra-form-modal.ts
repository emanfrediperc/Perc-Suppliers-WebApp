import { finalize } from 'rxjs/operators';
import {
  Component,
  OnChanges,
  SimpleChanges,
  inject,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GlassModalComponent } from '../../../../shared/glass-modal/glass-modal';
import { EmpresaPickerComponent } from '../../../../shared/empresa-picker/empresa-picker';
import { ToastService } from '../../../../shared/toast/toast.service';
import { ComprasMonedaExtranjeraService } from '../../../../services/compras-moneda-extranjera.service';
import type { ModalidadCompra } from '../../../../models/compra-moneda-extranjera';
import type { EmpresaRef } from '../../../../models/prestamo';

@Component({
  selector: 'app-compra-form-modal',
  standalone: true,
  imports: [FormsModule, GlassModalComponent, EmpresaPickerComponent],
  template: `
    <app-glass-modal
      [open]="open()"
      title="Nueva Compra FX"
      subtitle="Registrar compra de moneda extranjera (USD)"
      maxWidth="640px"
      (close)="close.emit()"
    >
      <form (ngSubmit)="submit()" class="form" novalidate>

        <div class="form-row-inline">
          <div class="field">
            <label>Fecha solicitada</label>
            <input type="date" name="fechaSolicitada" [(ngModel)]="fechaSolicitada" required />
            @if (errors()['fechaSolicitada']) {
              <span class="error">{{ errors()['fechaSolicitada'] }}</span>
            }
          </div>
          <div class="field">
            <label>Modalidad</label>
            <select name="modalidad" [(ngModel)]="modalidad" required>
              <option value="CABLE">Cable</option>
              <option value="USD_LOCAL">USD Local</option>
              <option value="MEP">MEP</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <app-empresa-picker
            label="Empresa"
            placeholder="Buscar empresa (cliente o proveedora)..."
            [(selected)]="empresa" />
          @if (errors()['empresa']) {
            <span class="error">{{ errors()['empresa'] }}</span>
          }
        </div>

        <div class="form-row-inline">
          <div class="field">
            <label>Monto</label>
            <input type="number" name="montoUSD" [(ngModel)]="montoUSD" min="0.01" step="0.01" placeholder="0.00" required />
            @if (errors()['montoUSD']) {
              <span class="error">{{ errors()['montoUSD'] }}</span>
            }
          </div>
        </div>

        <div class="form-row">
          <label>Observaciones (opcional)</label>
          <textarea name="observaciones" [(ngModel)]="observaciones" maxlength="500" rows="3" placeholder="Notas adicionales..."></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" (click)="close.emit()" [disabled]="submitting()">
            Cancelar
          </button>
          <button type="submit" class="btn-primary" [disabled]="submitting()">
            {{ submitting() ? 'Guardando...' : 'Guardar Compra' }}
          </button>
        </div>
      </form>
    </app-glass-modal>
  `,
  styles: [`
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
    .form-row > label {
      font-size: 0.6875rem;
      color: var(--color-gray-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    .form-row-inline {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
    .form-row input,
    .form-row textarea,
    .field input,
    .field select {
      padding: 0.625rem 0.875rem;
      border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-sm);
      background: var(--color-white);
      color: var(--color-gray-900);
      font-size: 0.875rem;
      font-family: inherit;
    }
    .form-row input:focus,
    .form-row textarea:focus,
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
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); }
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
    .btn-secondary:hover:not(:disabled) { background: var(--color-gray-200); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompraFormModalComponent implements OnChanges {
  private service = inject(ComprasMonedaExtranjeraService);
  private toast = inject(ToastService);

  open = input(false);
  close = output<void>();
  saved = output<void>();

  fechaSolicitada = this.today();
  modalidad: ModalidadCompra = 'CABLE';
  empresa = signal<EmpresaRef | null>(null);
  montoUSD: number | null = null;
  observaciones = '';

  submitting = signal(false);
  errors = signal<Record<string, string>>({});

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open']?.currentValue === true) {
      this.reset();
    }
  }

  private reset() {
    this.fechaSolicitada = this.today();
    this.modalidad = 'CABLE';
    this.empresa.set(null);
    this.montoUSD = null;
    this.observaciones = '';
    this.errors.set({});
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private validate(): boolean {
    const e: Record<string, string> = {};
    if (!this.fechaSolicitada) e['fechaSolicitada'] = 'Requerido';
    if (!this.empresa()) e['empresa'] = 'Seleccioná una empresa';
    if (this.montoUSD == null || this.montoUSD <= 0) e['montoUSD'] = 'Debe ser mayor a 0';
    this.errors.set(e);
    return Object.keys(e).length === 0;
  }

  submit() {
    if (!this.validate()) return;
    const empresa = this.empresa()!;
    this.submitting.set(true);
    this.service
      .create({
        fechaSolicitada: this.fechaSolicitada,
        modalidad: this.modalidad,
        empresaId: empresa.empresaId,
        empresaKind: empresa.empresaKind,
        montoUSD: this.montoUSD!,
        ...(this.observaciones.trim() ? { observaciones: this.observaciones.trim() } : {}),
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Compra FX registrada');
          this.saved.emit();
          this.close.emit();
        },
        error: (err) => {
          this.toast.error(err?.error?.message ?? 'Error al registrar la compra');
        },
      });
  }
}
