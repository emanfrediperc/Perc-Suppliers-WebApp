import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { GlassModalComponent } from '../../../../shared/glass-modal/glass-modal';
import { StatusBadgeComponent } from '../../../../shared/status-badge/status-badge';
import {
  MONEDA_LABEL,
  type CompraMonedaExtranjera,
  type CreadoPorRef,
} from '../../../../models/compra-moneda-extranjera';

@Component({
  selector: 'app-compra-detalle-modal',
  standalone: true,
  imports: [DatePipe, GlassModalComponent, StatusBadgeComponent],
  template: `
    <app-glass-modal
      [open]="open()"
      title="Detalle de Compra de Divisa"
      subtitle="Información completa del registro"
      maxWidth="600px"
      (close)="close.emit()"
    >
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Cargando detalle...</span>
        </div>
      } @else if (compra()) {
        <div class="detalle-content">

          <!-- Sección: datos principales -->
          <div class="section">
            <div class="section-title">Datos de la operación</div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Fecha solicitada</span>
                <span class="info-value">{{ compra()!.fechaSolicitada | date: 'dd/MM/yyyy' }}</span>
              </div>
              @if (compra()!.fechaEstimadaEjecucion) {
                <div class="info-row">
                  <span class="info-label">Fecha estimada ejecución</span>
                  <span class="info-value">{{ compra()!.fechaEstimadaEjecucion | date: 'dd/MM/yyyy' }}</span>
                </div>
              }
              @if (compra()!.fechaEjecutada) {
                <div class="info-row">
                  <span class="info-label">Fecha ejecutada</span>
                  <span class="info-value">{{ compra()!.fechaEjecutada | date: 'dd/MM/yyyy' }}</span>
                </div>
              }
              <div class="info-row">
                <span class="info-label">Origen → Destino</span>
                <span class="info-value">
                  <span class="badge-moneda" [class]="'badge-' + compra()!.monedaOrigen">
                    {{ monedaLabel[compra()!.monedaOrigen] }}
                  </span>
                  <span class="arrow">→</span>
                  <span class="badge-moneda" [class]="'badge-' + compra()!.monedaDestino">
                    {{ monedaLabel[compra()!.monedaDestino] }}
                  </span>
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Estado</span>
                <span class="info-value"><app-status-badge [status]="compra()!.estado" /></span>
              </div>
              <div class="info-row">
                <span class="info-label">Empresa</span>
                <span class="info-value">
                  {{ compra()!.empresa.razonSocialCache }}
                  <span class="kind-tag">{{ compra()!.empresa.empresaKind === 'cliente' ? 'Cliente' : 'Proveedora' }}</span>
                </span>
              </div>
              @if (compra()!.contraparte) {
                <div class="info-row">
                  <span class="info-label">Contraparte</span>
                  <span class="info-value">{{ compra()!.contraparte }}</span>
                </div>
              }
              @if (compra()!.referencia) {
                <div class="info-row">
                  <span class="info-label">Referencia</span>
                  <span class="info-value">{{ compra()!.referencia }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Sección: importes -->
          <div class="section">
            <div class="section-title">Importes</div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Monto origen</span>
                <span class="info-value num">
                  {{ fmtNum(compra()!.montoOrigen) }}
                  <span class="moneda-suffix">{{ monedaLabel[compra()!.monedaOrigen] }}</span>
                </span>
              </div>
              @if (compra()!.tipoCambio != null) {
                <div class="info-row">
                  <span class="info-label">Tipo de Cambio</span>
                  <span class="info-value num">
                    {{ fmtTC(compra()!.tipoCambio!) }}
                    <span class="moneda-suffix">{{ tcSuffix() }}</span>
                  </span>
                </div>
              }
              @if (compra()!.montoDestino != null) {
                <div class="info-row">
                  <span class="info-label">Monto destino</span>
                  <span class="info-value num">
                    {{ fmtNum(compra()!.montoDestino!) }}
                    <span class="moneda-suffix">{{ monedaLabel[compra()!.monedaDestino] }}</span>
                  </span>
                </div>
              }
              @if (compra()!.comision > 0) {
                <div class="info-row">
                  <span class="info-label">Honorarios</span>
                  <span class="info-value num">{{ fmtNum(compra()!.comision) }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Sección: observaciones -->
          @if (compra()!.observaciones) {
            <div class="section">
              <div class="section-title">Observaciones</div>
              <p class="observaciones-text">{{ compra()!.observaciones }}</p>
            </div>
          }

          <!-- Sección: anulación -->
          @if (compra()!.estado === 'ANULADA') {
            <div class="section section-danger">
              <div class="section-title">Información de anulación</div>
              <div class="info-grid">
                @if (compra()!.anuladoAt) {
                  <div class="info-row">
                    <span class="info-label">Fecha anulación</span>
                    <span class="info-value">{{ compra()!.anuladoAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                }
                @if (compra()!.motivoAnulacion) {
                  <div class="info-row">
                    <span class="info-label">Motivo</span>
                    <span class="info-value">{{ compra()!.motivoAnulacion }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Sección: auditoría -->
          <div class="section section-meta">
            <div class="section-title">Auditoría</div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Creado por</span>
                <span class="info-value">{{ creadoPorLabel() }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha de creación</span>
                <span class="info-value">{{ compra()!.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="close.emit()">Cerrar</button>
          </div>
        </div>
      }
    </app-glass-modal>
  `,
  styles: [`
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 2rem;
      color: var(--color-gray-500);
      font-size: 0.875rem;
    }
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-gray-200);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .detalle-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .section {
      background: var(--color-gray-50);
      border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-sm);
      padding: 0.875rem 1rem;
    }
    .section-danger {
      background: rgba(239, 68, 68, 0.04);
      border-color: rgba(239, 68, 68, 0.3);
    }
    .section-meta {
      background: transparent;
      border-color: var(--color-gray-100);
    }

    .section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-gray-400);
      margin-bottom: 0.625rem;
    }

    .info-grid {
      display: flex;
      flex-direction: column;
      gap: 0;
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
    .info-value {
      color: var(--color-gray-900);
      font-weight: 600;
      text-align: right;
    }
    .info-value.num { font-variant-numeric: tabular-nums; }

    /* Moneda badges */
    .badge-moneda {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.55rem;
      border-radius: var(--radius-sm);
    }
    .arrow {
      margin: 0 0.35rem;
      color: var(--color-gray-500);
      font-weight: 600;
    }
    .badge-ARS {
      background: rgba(34, 197, 94, 0.12);
      color: #15803d;
    }
    .badge-USD_CABLE {
      background: rgba(59, 130, 246, 0.12);
      color: #2563eb;
    }
    .badge-USD_LOCAL {
      background: rgba(245, 158, 11, 0.12);
      color: #d97706;
    }
    .badge-USD_MEP {
      background: rgba(168, 85, 247, 0.12);
      color: #9333ea;
    }
    .moneda-suffix {
      margin-left: 0.4rem;
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--color-gray-500);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .kind-tag {
      display: inline-block;
      margin-left: 0.5rem;
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.1rem 0.5rem;
      border-radius: 999px;
      background: var(--color-gray-100);
      color: var(--color-gray-600);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .observaciones-text {
      font-size: 0.875rem;
      color: var(--color-gray-700);
      line-height: 1.5;
      margin: 0;
      white-space: pre-wrap;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--color-gray-200);
      margin-top: 0.5rem;
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
    .btn-secondary:hover { background: var(--color-gray-200); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompraDetalleModalComponent {
  open = input(false);
  compra = input<CompraMonedaExtranjera | null>(null);
  loading = input(false);
  close = output<void>();

  readonly monedaLabel = MONEDA_LABEL;

  fmtNum(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) return '—';
    return value.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  fmtTC(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) return '—';
    return value.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }

  tcSuffix(): string {
    const c = this.compra();
    if (!c) return '';
    return `${MONEDA_LABEL[c.monedaOrigen]} por 1 ${MONEDA_LABEL[c.monedaDestino]}`;
  }

  creadoPorLabel(): string {
    const c = this.compra();
    if (!c) return '—';
    const cp = c.creadoPor;
    if (typeof cp === 'object' && cp !== null) {
      const ref = cp as CreadoPorRef;
      return ref.nombre ? `${ref.nombre} (${ref.email})` : ref.email;
    }
    // ObjectId crudo (no debería pasar con populate, pero por seguridad)
    return String(cp);
  }
}
