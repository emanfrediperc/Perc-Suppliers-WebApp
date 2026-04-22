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
  selector: 'app-compra-estimar-modal',
  standalone: true,
  imports: [FormsModule, GlassModalComponent],
  template: `
    <app-glass-modal
      [open]="open()"
      title="Fecha estimada de ejecución"
      subtitle="Indicá cuándo estimás que se va a ejecutar"
      maxWidth="440px"
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
              <span class="info-label">Monto</span>
              <span class="info-value">{{ fmtNum(montoPrincipal()) }} {{ monedaLabel[monedaPrincipal()] }}</span>
            </div>
          </div>

          <div class="form-row">
            <label>Fecha estimada</label>
            <input
              type="date"
              name="fechaEstimada"
              [(ngModel)]="fechaEstimada"
              [min]="minFecha()"
              required
            />
            @if (error()) {
              <span class="error">{{ error() }}</span>
            }
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="close.emit()" [disabled]="submitting()">
              Cancelar
            </button>
            <button type="button" class="btn-primary" (click)="confirmar()" [disabled]="submitting()">
              {{ submitting() ? 'Guardando...' : 'Guardar' }}
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
      padding: 0.75rem 1rem;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.25rem 0;
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
    .form-row input {
      padding: 0.625rem 0.875rem;
      border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-sm);
      background: var(--color-white);
      color: var(--color-gray-900);
      font-size: 0.875rem;
    }
    .form-row input:focus {
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
export class CompraEstimarModalComponent implements OnChanges {
  private service = inject(ComprasMonedaExtranjeraService);
  private toast = inject(ToastService);

  open = input(false);
  compra = input<CompraMonedaExtranjera | null>(null);
  close = output<void>();
  saved = output<void>();

  fechaEstimada = '';
  submitting = signal(false);
  error = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open']?.currentValue === true) {
      const c = this.compra();
      const previa = c?.fechaEstimadaEjecucion?.split('T')[0];
      const min = this.minFecha();
      const fallback = min && min > this.today() ? min : this.today();
      const candidata = previa ?? fallback;
      this.fechaEstimada = min && candidata < min ? min : candidata;
      this.error.set(null);
    }
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  minFecha(): string {
    return this.compra()?.fechaSolicitada?.split('T')[0] ?? '';
  }

  readonly monedaLabel = MONEDA_LABEL;

  montoPrincipal(): number {
    const c = this.compra();
    if (!c) return 0;
    return c.montoDestino ?? c.montoOrigen;
  }

  monedaPrincipal() {
    const c = this.compra()!;
    return c.montoDestino != null ? c.monedaDestino : c.monedaOrigen;
  }

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
    if (!this.fechaEstimada) {
      this.error.set('Requerido');
      return;
    }
    const min = this.minFecha();
    if (min && this.fechaEstimada < min) {
      this.error.set('Debe ser igual o posterior a la fecha solicitada');
      return;
    }
    this.error.set(null);
    this.submitting.set(true);
    this.service
      .estimarEjecucion(c._id, { fechaEstimadaEjecucion: this.fechaEstimada })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Fecha estimada guardada');
          this.saved.emit();
          this.close.emit();
        },
        error: (err) => {
          this.toast.error(err?.error?.message ?? 'Error al guardar la fecha estimada');
        },
      });
  }
}
