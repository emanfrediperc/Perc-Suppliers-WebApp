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
  selector: 'app-compra-anular-modal',
  standalone: true,
  imports: [FormsModule, GlassModalComponent],
  template: `
    <app-glass-modal
      [open]="open()"
      title="Anular Compra FX"
      maxWidth="500px"
      (close)="close.emit()"
    >
      @if (compra()) {
        <div class="anular-content">
          <div class="danger-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>Esta acción es <strong>irreversible</strong>. La compra quedará en estado ANULADA.</span>
          </div>

          <div class="compra-info">
            <div class="info-row">
              <span class="info-label">Empresa</span>
              <span class="info-value">{{ compra()!.empresa.razonSocialCache }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Monto origen</span>
              <span class="info-value">{{ fmtNum(compra()!.montoOrigen) }} {{ monedaLabel[compra()!.monedaOrigen] }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Origen → Destino</span>
              <span class="info-value">{{ monedaLabel[compra()!.monedaOrigen] }} → {{ monedaLabel[compra()!.monedaDestino] }}</span>
            </div>
          </div>

          <div class="form-row">
            <label>Motivo de anulación (opcional)</label>
            <textarea
              name="motivo"
              [(ngModel)]="motivo"
              maxlength="500"
              rows="3"
              placeholder="Describí el motivo de la anulación..."
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="close.emit()" [disabled]="submitting()">
              Cancelar
            </button>
            <button type="button" class="btn-danger" (click)="confirmar()" [disabled]="submitting()">
              {{ submitting() ? 'Anulando...' : 'Confirmar anulación' }}
            </button>
          </div>
        </div>
      }
    </app-glass-modal>
  `,
  styles: [`
    .anular-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .danger-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid var(--color-error);
      border-radius: var(--radius-sm);
      color: var(--color-error);
      font-size: 0.875rem;
      line-height: 1.5;
    }
    .danger-banner svg { flex-shrink: 0; margin-top: 1px; }
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
    .form-row textarea {
      padding: 0.625rem 0.875rem;
      border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-sm);
      background: var(--color-white);
      color: var(--color-gray-900);
      font-size: 0.875rem;
      font-family: inherit;
      resize: vertical;
    }
    .form-row textarea:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--color-gray-200);
      margin-top: 0.25rem;
    }
    .btn-danger {
      background: var(--color-error);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-danger:hover:not(:disabled) { filter: brightness(0.9); }
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
export class CompraAnularModalComponent implements OnChanges {
  private service = inject(ComprasMonedaExtranjeraService);
  private toast = inject(ToastService);

  open = input(false);
  compra = input<CompraMonedaExtranjera | null>(null);
  close = output<void>();
  saved = output<void>();

  motivo = '';
  submitting = signal(false);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open']?.currentValue === true) {
      this.motivo = '';
    }
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
    this.submitting.set(true);
    this.service
      .anular(c._id, { motivo: this.motivo.trim() || undefined })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Compra anulada correctamente');
          this.saved.emit();
          this.close.emit();
        },
        error: (err) => {
          this.toast.error(err?.error?.message ?? 'Error al anular la compra');
        },
      });
  }
}
