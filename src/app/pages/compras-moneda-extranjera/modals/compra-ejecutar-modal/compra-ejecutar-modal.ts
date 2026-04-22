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
import { ToastService } from '../../../../shared/toast/toast.service';
import { ComprasMonedaExtranjeraService } from '../../../../services/compras-moneda-extranjera.service';
import { MONEDA_LABEL, type CompraMonedaExtranjera } from '../../../../models/compra-moneda-extranjera';

@Component({
  selector: 'app-compra-ejecutar-modal',
  standalone: true,
  imports: [FormsModule, GlassModalComponent],
  template: `
    <app-glass-modal
      [open]="open()"
      title="Marcar Compra como Ejecutada"
      maxWidth="500px"
      (close)="close.emit()"
    >
      @if (compra()) {
        <div class="content">
          <div class="compra-info">
            <div class="info-row">
              <span class="info-label">Empresa</span>
              <span class="info-value">{{ compra()!.empresa.razonSocialCache }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Monto origen</span>
              <span class="info-value">{{ fmtNum(compra()!.montoOrigen) }} {{ monedaLabel[compra()!.monedaOrigen] }}</span>
            </div>
            @if (compra()!.montoDestino != null) {
              <div class="info-row">
                <span class="info-label">Monto destino</span>
                <span class="info-value">{{ fmtNum(compra()!.montoDestino!) }} {{ monedaLabel[compra()!.monedaDestino] }}</span>
              </div>
            }
            <div class="info-row">
              <span class="info-label">Origen → Destino</span>
              <span class="info-value">{{ monedaLabel[compra()!.monedaOrigen] }} → {{ monedaLabel[compra()!.monedaDestino] }}</span>
            </div>
          </div>

          <div class="form-row">
            <label>Fecha de ejecución</label>
            <input type="date" name="fechaEjecutada" [(ngModel)]="fechaEjecutada" required />
            @if (error()) {
              <span class="error">{{ error() }}</span>
            }
          </div>

          <div class="form-row">
            <label>Observaciones (opcional)</label>
            <textarea
              name="observaciones"
              [(ngModel)]="observaciones"
              maxlength="500"
              rows="3"
              placeholder="Nro de operación, detalles del bróker, etc."
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="close.emit()" [disabled]="submitting()">
              Cancelar
            </button>
            <button type="button" class="btn-success" (click)="confirmar()" [disabled]="submitting()">
              {{ submitting() ? 'Ejecutando...' : 'Confirmar ejecución' }}
            </button>
          </div>
        </div>
      }
    </app-glass-modal>
  `,
  styles: [`
    .content { display: flex; flex-direction: column; gap: 1rem; }
    .compra-info {
      background: var(--color-gray-50);
      border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-sm);
      padding: 0.875rem 1rem;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.375rem 0;
      font-size: 0.875rem;
      border-bottom: 1px solid var(--color-gray-100);
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: var(--color-gray-500); font-weight: 500; }
    .info-value { color: var(--color-gray-900); font-weight: 600; }
    .form-row { display: flex; flex-direction: column; gap: 0.375rem; }
    .form-row label {
      font-size: 0.6875rem;
      color: var(--color-gray-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    .form-row input,
    .form-row textarea {
      padding: 0.625rem 0.875rem;
      border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-sm);
      background: var(--color-white);
      color: var(--color-gray-900);
      font-size: 0.875rem;
      font-family: inherit;
    }
    .form-row input:focus,
    .form-row textarea:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    .error { font-size: 0.75rem; color: var(--color-error); }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--color-gray-200);
    }
    .btn-success {
      background: #16a34a;
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-success:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-success:hover:not(:disabled) { filter: brightness(0.95); }
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
export class CompraEjecutarModalComponent implements OnChanges {
  private service = inject(ComprasMonedaExtranjeraService);
  private toast = inject(ToastService);

  open = input(false);
  compra = input<CompraMonedaExtranjera | null>(null);
  close = output<void>();
  saved = output<void>();

  fechaEjecutada = this.today();
  observaciones = '';
  submitting = signal(false);
  error = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open']?.currentValue === true) {
      this.fechaEjecutada = this.today();
      this.observaciones = '';
      this.error.set(null);
    }
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  readonly monedaLabel = MONEDA_LABEL;

  fmtNum(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) return '—';
    return value.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  confirmar() {
    const c = this.compra();
    if (!c) return;
    if (!this.fechaEjecutada) {
      this.error.set('Requerido');
      return;
    }
    this.error.set(null);
    this.submitting.set(true);
    this.service
      .ejecutar(c._id, {
        fechaEjecutada: this.fechaEjecutada,
        ...(this.observaciones.trim() ? { observaciones: this.observaciones.trim() } : {}),
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Compra marcada como ejecutada');
          this.saved.emit();
          this.close.emit();
        },
        error: (err) => {
          this.toast.error(err?.error?.message ?? 'Error al ejecutar la compra');
        },
      });
  }
}
