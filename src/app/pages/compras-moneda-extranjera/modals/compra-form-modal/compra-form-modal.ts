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
import {
  MONEDAS,
  MONEDA_LABEL,
  type Moneda,
} from '../../../../models/compra-moneda-extranjera';
import type { EmpresaRef } from '../../../../models/prestamo';

@Component({
  selector: 'app-compra-form-modal',
  standalone: true,
  imports: [FormsModule, GlassModalComponent, EmpresaPickerComponent],
  template: `
    <app-glass-modal
      [open]="open()"
      title="Nueva Compra de Divisa"
      subtitle="Registrar compra de moneda extranjera"
      maxWidth="640px"
      (close)="close.emit()"
    >
      <form (ngSubmit)="submit()" class="form" novalidate>

        <div class="form-row">
          <div class="field">
            <label>Fecha solicitada</label>
            <input type="date" name="fechaSolicitada" [(ngModel)]="fechaSolicitada" required />
            @if (errors()['fechaSolicitada']) {
              <span class="error">{{ errors()['fechaSolicitada'] }}</span>
            }
          </div>
        </div>

        <div class="form-row-inline">
          <div class="field">
            <label>Moneda origen</label>
            <select name="monedaOrigen" [ngModel]="monedaOrigen()" (ngModelChange)="onMonedaOrigenChange($event)" required>
              @for (m of monedas; track m) {
                <option [value]="m">{{ monedaLabel[m] }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label>Moneda destino</label>
            <select name="monedaDestino" [ngModel]="monedaDestino()" (ngModelChange)="onMonedaDestinoChange($event)" required>
              @for (m of monedas; track m) {
                <option [value]="m">{{ monedaLabel[m] }}</option>
              }
            </select>
            @if (errors()['monedas']) {
              <span class="error">{{ errors()['monedas'] }}</span>
            }
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

        <div class="form-row">
          <div class="field">
            <label>Tipo de cambio</label>
            <input
              type="number"
              name="tipoCambio"
              [ngModel]="tipoCambio()"
              (ngModelChange)="onTipoCambioChange($event)"
              min="0.0001"
              step="0.0001"
              placeholder="0.0000" />
            <span class="hint">{{ tcHint() }}</span>
            @if (errors()['tipoCambio']) {
              <span class="error">{{ errors()['tipoCambio'] }}</span>
            }
          </div>
        </div>

        <div class="form-row">
          <div class="field">
            <label>Monto origen <span class="req">*</span></label>
            <div class="input-with-suffix">
              <input
                type="number"
                name="montoOrigen"
                [ngModel]="montoOrigen()"
                (ngModelChange)="onMontoOrigenChange($event)"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                required />
              <span class="suffix">{{ monedaLabel[monedaOrigen()] }}</span>
            </div>
            @if (errors()['montoOrigen']) {
              <span class="error">{{ errors()['montoOrigen'] }}</span>
            }
          </div>
        </div>

        <div class="form-row">
          <div class="field">
            <label>Monto destino (opcional)</label>
            <div class="input-with-suffix">
              <input
                type="number"
                name="montoDestino"
                [ngModel]="montoDestino()"
                (ngModelChange)="onMontoDestinoChange($event)"
                min="0.01"
                step="0.01"
                placeholder="0.00" />
              <span class="suffix">{{ monedaLabel[monedaDestino()] }}</span>
            </div>
            @if (errors()['montoDestino']) {
              <span class="error">{{ errors()['montoDestino'] }}</span>
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
    .req { color: var(--color-error); }
    .hint {
      font-size: 0.6875rem;
      color: var(--color-gray-500);
      font-style: italic;
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
    .input-with-suffix {
      position: relative;
      display: flex;
      align-items: stretch;
    }
    .input-with-suffix input {
      flex: 1;
      padding-right: 5.5rem;
    }
    .input-with-suffix .suffix {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-gray-500);
      pointer-events: none;
      background: color-mix(in srgb, var(--color-gray-100) 60%, transparent);
      padding: 0.125rem 0.375rem;
      border-radius: var(--radius-sm);
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

  readonly monedas = MONEDAS;
  readonly monedaLabel = MONEDA_LABEL;

  fechaSolicitada = this.today();
  monedaOrigen = signal<Moneda>('ARS');
  monedaDestino = signal<Moneda>('USD_CABLE');
  empresa = signal<EmpresaRef | null>(null);

  montoOrigen = signal<number | null>(null);
  montoDestino = signal<number | null>(null);
  tipoCambio = signal<number | null>(null);

  observaciones = '';

  private lastEditedMonto: 'origen' | 'destino' | null = null;

  submitting = signal(false);
  errors = signal<Record<string, string>>({});

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open']?.currentValue === true) {
      this.reset();
    }
  }

  tcHint(): string {
    const o = this.monedaLabel[this.monedaOrigen()];
    const d = this.monedaLabel[this.monedaDestino()];
    return `${o} por 1 ${d}`;
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  onMontoOrigenChange(v: number | null) {
    this.montoOrigen.set(this.parseNum(v));
    this.lastEditedMonto = 'origen';
    const tc = this.tipoCambio();
    const mo = this.montoOrigen();
    if (tc && tc > 0 && mo != null) {
      this.montoDestino.set(this.round2(mo / tc));
    }
  }

  onMontoDestinoChange(v: number | null) {
    this.montoDestino.set(this.parseNum(v));
    this.lastEditedMonto = 'destino';
    const tc = this.tipoCambio();
    const md = this.montoDestino();
    if (tc && tc > 0 && md != null) {
      this.montoOrigen.set(this.round2(md * tc));
    }
  }

  onTipoCambioChange(v: number | null) {
    const tc = this.parseNum(v);
    this.tipoCambio.set(tc);
    if (!tc || tc <= 0) return;

    // Recalculamos el que NO fue editado último
    if (this.lastEditedMonto === 'destino' && this.montoDestino() != null) {
      this.montoOrigen.set(this.round2(this.montoDestino()! * tc));
    } else if (this.montoOrigen() != null) {
      this.montoDestino.set(this.round2(this.montoOrigen()! / tc));
    }
  }

  onMonedaOrigenChange(m: Moneda) {
    this.monedaOrigen.set(m);
    if (this.monedaOrigen() === this.monedaDestino()) {
      this.monedaDestino.set(this.pickDifferent(m));
    }
  }

  onMonedaDestinoChange(m: Moneda) {
    this.monedaDestino.set(m);
    if (this.monedaOrigen() === this.monedaDestino()) {
      this.monedaOrigen.set(this.pickDifferent(m));
    }
  }

  private pickDifferent(m: Moneda): Moneda {
    return this.monedas.find((x) => x !== m) ?? 'ARS';
  }

  private parseNum(v: number | null | undefined): number | null {
    if (v == null || v === ('' as unknown as number)) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  // ── Reset & validate ─────────────────────────────────────────────────────

  private reset() {
    this.fechaSolicitada = this.today();
    this.monedaOrigen.set('ARS');
    this.monedaDestino.set('USD_CABLE');
    this.empresa.set(null);
    this.montoOrigen.set(null);
    this.montoDestino.set(null);
    this.tipoCambio.set(null);
    this.observaciones = '';
    this.lastEditedMonto = null;
    this.errors.set({});
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private validate(): boolean {
    const e: Record<string, string> = {};
    if (!this.fechaSolicitada) e['fechaSolicitada'] = 'Requerido';
    if (this.monedaOrigen() === this.monedaDestino()) {
      e['monedas'] = 'Origen y destino deben ser distintos';
    }
    if (!this.empresa()) e['empresa'] = 'Seleccioná una empresa';

    const mo = this.montoOrigen();
    if (mo == null || mo <= 0) e['montoOrigen'] = 'Debe ser mayor a 0';

    const tc = this.tipoCambio();
    if (tc != null && tc <= 0) e['tipoCambio'] = 'Debe ser mayor a 0';

    const md = this.montoDestino();
    if (md != null && md <= 0) e['montoDestino'] = 'Debe ser mayor a 0';

    this.errors.set(e);
    return Object.keys(e).length === 0;
  }

  submit() {
    if (!this.validate()) return;
    const empresa = this.empresa()!;
    const tc = this.tipoCambio();
    const md = this.montoDestino();
    this.submitting.set(true);
    this.service
      .create({
        fechaSolicitada: this.fechaSolicitada,
        monedaOrigen: this.monedaOrigen(),
        monedaDestino: this.monedaDestino(),
        empresaId: empresa.empresaId,
        empresaKind: empresa.empresaKind,
        montoOrigen: this.montoOrigen()!,
        ...(tc != null ? { tipoCambio: tc } : {}),
        ...(md != null ? { montoDestino: md } : {}),
        ...(this.observaciones.trim() ? { observaciones: this.observaciones.trim() } : {}),
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Compra de Divisa registrada');
          this.saved.emit();
          this.close.emit();
        },
        error: (err) => {
          this.toast.error(err?.error?.message ?? 'Error al registrar la compra');
        },
      });
  }
}
