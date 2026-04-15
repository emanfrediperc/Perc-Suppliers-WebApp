import {
  Component,
  OnChanges,
  SimpleChanges,
  inject,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GlassModalComponent } from '../../../../shared/glass-modal/glass-modal';
import { ToastService } from '../../../../shared/toast/toast.service';
import { ComprasMonedaExtranjeraService } from '../../../../services/compras-moneda-extranjera.service';
import { EmpresaClienteService } from '../../../../services/empresa-cliente.service';
import type { EmpresaCliente } from '../../../../models';
import type { ModalidadCompra } from '../../../../models/compra-moneda-extranjera';

@Component({
  selector: 'app-compra-form-modal',
  standalone: true,
  imports: [FormsModule, GlassModalComponent],
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
            <label>Fecha</label>
            <input type="date" name="fecha" [(ngModel)]="fecha" required />
            @if (errors()['fecha']) {
              <span class="error">{{ errors()['fecha'] }}</span>
            }
          </div>
          <div class="field">
            <label>Modalidad</label>
            <select name="modalidad" [(ngModel)]="modalidad" required>
              <option value="CABLE">Cable</option>
              <option value="USD_LOCAL">USD Local</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <label>Empresa Cliente</label>
          <select name="empresaClienteId" [(ngModel)]="empresaClienteId" required>
            <option value="">-- Seleccionar empresa --</option>
            @for (ec of empresasClientes(); track ec._id) {
              <option [value]="ec._id">{{ ec.razonSocial }}</option>
            }
          </select>
          @if (errors()['empresaClienteId']) {
            <span class="error">{{ errors()['empresaClienteId'] }}</span>
          }
        </div>

        <div class="form-row-inline">
          <div class="field">
            <label>Monto USD</label>
            <input type="number" name="montoUSD" [(ngModel)]="montoUSD" min="0.01" step="0.01" placeholder="0.00" required />
            @if (errors()['montoUSD']) {
              <span class="error">{{ errors()['montoUSD'] }}</span>
            }
          </div>
          <div class="field">
            <label>Tipo de Cambio (ARS/USD)</label>
            <input type="number" name="tipoCambio" [(ngModel)]="tipoCambio" min="0.0001" step="0.0001" placeholder="0.0000" required />
            @if (errors()['tipoCambio']) {
              <span class="error">{{ errors()['tipoCambio'] }}</span>
            }
          </div>
        </div>

        <div class="form-row">
          <div class="field field-with-action">
            <label>Monto ARS</label>
            <div class="input-with-btn">
              <input type="number" name="montoARS" [(ngModel)]="montoARS" min="0" step="0.01" placeholder="0.00" required />
              <button type="button" class="btn-calc" (click)="calcularARS()" title="Calcular ARS automáticamente">
                Calcular ARS
              </button>
            </div>
          </div>
          @if (errors()['montoARS']) {
            <span class="error">{{ errors()['montoARS'] }}</span>
          }
          @if (mostrarWarningARS()) {
            <div class="warning-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              El monto ARS difiere más del 1% del resultado de USD × Tipo de Cambio.
              El formulario se puede guardar igual.
            </div>
          }
        </div>

        <div class="form-row">
          <label>Contraparte</label>
          <input type="text" name="contraparte" [(ngModel)]="contraparte" maxlength="200" placeholder="Banco / broker / casa de cambio" required />
          @if (errors()['contraparte']) {
            <span class="error">{{ errors()['contraparte'] }}</span>
          }
        </div>

        <div class="form-row-inline">
          <div class="field">
            <label>Comisión (ARS, opcional)</label>
            <input type="number" name="comision" [(ngModel)]="comision" min="0" step="0.01" placeholder="0.00" />
          </div>
          <div class="field">
            <label>Referencia (opcional)</label>
            <input type="text" name="referencia" [(ngModel)]="referencia" maxlength="100" placeholder="N° de operación" />
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
    .form-row label {
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
    .field-with-action { gap: 0.375rem; }
    .input-with-btn {
      display: flex;
      gap: 0.5rem;
      align-items: stretch;
    }
    .input-with-btn input { flex: 1; }
    .btn-calc {
      white-space: nowrap;
      padding: 0.625rem 0.875rem;
      background: var(--color-gray-100);
      color: var(--color-gray-700);
      border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-calc:hover {
      background: var(--color-gray-200);
    }
    .form-row input,
    .form-row select,
    .form-row textarea,
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
    .form-row input:focus,
    .form-row select:focus,
    .form-row textarea:focus,
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
    .warning-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.625rem 0.875rem;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid var(--color-warning);
      border-radius: var(--radius-sm);
      color: var(--color-warning);
      font-size: 0.8125rem;
      line-height: 1.4;
    }
    .warning-banner svg { flex-shrink: 0; margin-top: 1px; }
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
  private empresaClienteService = inject(EmpresaClienteService);
  private toast = inject(ToastService);

  open = input(false);
  close = output<void>();
  saved = output<void>();

  // Form fields
  fecha = this.today();
  modalidad: ModalidadCompra = 'CABLE';
  empresaClienteId = '';
  montoUSD: number | null = null;
  tipoCambio: number | null = null;
  montoARS: number | null = null;
  contraparte = '';
  comision: number | null = null;
  referencia = '';
  observaciones = '';

  submitting = signal(false);
  errors = signal<Record<string, string>>({});
  empresasClientes = signal<EmpresaCliente[]>([]);

  mostrarWarningARS = computed(() => {
    if (
      this.montoARS == null ||
      this.montoUSD == null ||
      this.tipoCambio == null ||
      this.montoARS === 0
    ) return false;
    const esperado = this.montoUSD * this.tipoCambio;
    return Math.abs(this.montoARS - esperado) / this.montoARS > 0.01;
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open']?.currentValue === true) {
      this.reset();
      this.loadEmpresasClientes();
    }
  }

  private loadEmpresasClientes() {
    this.empresaClienteService.getAll({ limit: 200, activa: true }).subscribe({
      next: (res) => this.empresasClientes.set(res.data),
      error: () => this.empresasClientes.set([]),
    });
  }

  calcularARS() {
    if (this.montoUSD != null && this.tipoCambio != null) {
      this.montoARS = Math.round(this.montoUSD * this.tipoCambio);
    }
  }

  private reset() {
    this.fecha = this.today();
    this.modalidad = 'CABLE';
    this.empresaClienteId = '';
    this.montoUSD = null;
    this.tipoCambio = null;
    this.montoARS = null;
    this.contraparte = '';
    this.comision = null;
    this.referencia = '';
    this.observaciones = '';
    this.errors.set({});
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private validate(): boolean {
    const e: Record<string, string> = {};
    if (!this.fecha) e['fecha'] = 'Requerido';
    if (!this.empresaClienteId) e['empresaClienteId'] = 'Seleccioná una empresa';
    if (this.montoUSD == null || this.montoUSD <= 0) e['montoUSD'] = 'Debe ser mayor a 0';
    if (this.tipoCambio == null || this.tipoCambio <= 0) e['tipoCambio'] = 'Debe ser mayor a 0';
    if (this.montoARS == null || this.montoARS < 0) e['montoARS'] = 'Debe ser mayor o igual a 0';
    if (!this.contraparte || this.contraparte.trim().length < 2) e['contraparte'] = 'Mínimo 2 caracteres';
    this.errors.set(e);
    return Object.keys(e).length === 0;
  }

  submit() {
    if (!this.validate()) return;
    this.submitting.set(true);
    this.service
      .create({
        fecha: this.fecha,
        modalidad: this.modalidad,
        empresaClienteId: this.empresaClienteId,
        montoUSD: this.montoUSD!,
        tipoCambio: this.tipoCambio!,
        montoARS: this.montoARS!,
        contraparte: this.contraparte.trim(),
        ...(this.comision != null ? { comision: this.comision } : {}),
        ...(this.referencia.trim() ? { referencia: this.referencia.trim() } : {}),
        ...(this.observaciones.trim() ? { observaciones: this.observaciones.trim() } : {}),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.toast.success('Compra FX registrada');
          this.saved.emit();
          this.close.emit();
        },
        error: (err) => {
          this.submitting.set(false);
          this.toast.error(err?.error?.message || 'Error al registrar la compra');
        },
      });
  }
}
