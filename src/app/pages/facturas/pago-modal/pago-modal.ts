import { Component, input, output, signal, computed, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { GlassModalComponent } from '../../../shared/glass-modal/glass-modal';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge';
import { Factura, Convenio } from '../../../models';
import { FacturaService } from '../../../services/factura.service';
import { ConvenioService } from '../../../services/convenio.service';

@Component({
  selector: 'app-pago-modal',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, GlassModalComponent, StatusBadgeComponent],
  template: `
    <app-glass-modal [open]="open()" [title]="stepTitles[currentStep()]" [maxWidth]="'640px'" (close)="onClose()">
      <!-- Step 1: Resumen -->
      @if (currentStep() === 0) {
        <div class="step-content">
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Factura</span><span class="info-value">{{ factura()?.numero }}</span></div>
            <div class="info-item"><span class="info-label">Tipo</span><span class="info-value">{{ factura()?.tipo }}</span></div>
            <div class="info-item"><span class="info-label">Monto Total</span><span class="info-value">{{ factura()?.montoTotal | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
            <div class="info-item"><span class="info-label">Saldo Pendiente</span><span class="info-value highlight">{{ factura()?.saldoPendiente | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
            <div class="info-item"><span class="info-label">Estado</span><span class="info-value"><app-status-badge [status]="factura()?.estado || ''" /></span></div>
            <div class="info-item"><span class="info-label">Proveedor</span><span class="info-value">{{ factura()?.empresaProveedora?.razonSocial }}</span></div>
          </div>
          @if (convenio()) {
            <div class="convenio-info card-glass" style="margin-top:1rem;padding:0.75rem 1rem">
              <span class="convenio-label">Convenio: {{ convenio()!.nombre }}</span>
              <span class="convenio-detail">Comision {{ convenio()!.comisionPorcentaje }}% | Descuento {{ convenio()!.descuentoPorcentaje }}%</span>
            </div>
          }
          <div class="step-actions">
            <button class="btn-secondary" (click)="onClose()">Cancelar</button>
            <button class="btn-primary" (click)="currentStep.set(1)">Continuar</button>
          </div>
        </div>
      }

      <!-- Step 2: Formulario de pago -->
      @if (currentStep() === 1) {
        <div class="step-content">
          <div class="form-grid">
            <div class="form-group">
              <label>Monto a pagar</label>
              <input type="number" [(ngModel)]="montoBase" [max]="factura()?.saldoPendiente ?? 0" min="0.01" step="0.01" />
            </div>
            <div class="form-group">
              <label>Medio de pago</label>
              <select [(ngModel)]="medioPago">
                <option value="transferencia">Transferencia</option>
                <option value="cheque">Cheque</option>
                <option value="efectivo">Efectivo</option>
                <option value="compensacion">Compensacion</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div class="form-group">
              <label>Referencia de pago</label>
              <input type="text" [(ngModel)]="referenciaPago" placeholder="Nro. transferencia, cheque, etc." />
            </div>
          </div>

          <h4 class="section-subtitle">Retenciones</h4>
          <div class="form-grid">
            <div class="form-group">
              <label>IIBB</label>
              <input type="number" [(ngModel)]="retencionIIBB" min="0" step="0.01" />
            </div>
            <div class="form-group">
              <label>Ganancias</label>
              <input type="number" [(ngModel)]="retencionGanancias" min="0" step="0.01" />
            </div>
            <div class="form-group">
              <label>IVA</label>
              <input type="number" [(ngModel)]="retencionIVA" min="0" step="0.01" />
            </div>
            <div class="form-group">
              <label>SUSS</label>
              <input type="number" [(ngModel)]="retencionSUSS" min="0" step="0.01" />
            </div>
            <div class="form-group">
              <label>Otras retenciones</label>
              <input type="number" [(ngModel)]="otrasRetenciones" min="0" step="0.01" />
            </div>
          </div>

          <div class="form-group" style="margin-top:0.75rem">
            <label>Observaciones</label>
            <textarea [(ngModel)]="observaciones" rows="2" placeholder="Notas adicionales..."></textarea>
          </div>

          <!-- Calculo preview -->
          <div class="calc-preview card-glass" style="margin-top:1rem;padding:1rem">
            <div class="calc-row"><span>Monto base</span><span>{{ montoBase | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
            @if (comisionCalculada()) {
              <div class="calc-row"><span>Comision ({{ convenio()?.comisionPorcentaje }}%)</span><span class="text-error">- {{ comisionCalculada() | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
            }
            @if (descuentoCalculado()) {
              <div class="calc-row"><span>Descuento ({{ convenio()?.descuentoPorcentaje }}%)</span><span class="text-error">- {{ descuentoCalculado() | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
            }
            @if (totalRetenciones()) {
              <div class="calc-row"><span>Retenciones</span><span class="text-error">- {{ totalRetenciones() | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
            }
            <div class="calc-row total"><span>Monto Neto</span><span>{{ montoNetoCalc() | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
          </div>

          <div class="step-actions">
            <button class="btn-secondary" (click)="currentStep.set(0)">Atras</button>
            <button class="btn-primary" (click)="currentStep.set(2)" [disabled]="!montoBase">Revisar</button>
          </div>
        </div>
      }

      <!-- Step 3: Confirmacion -->
      @if (currentStep() === 2) {
        <div class="step-content">
          <div class="confirm-summary card-glass" style="padding:1rem">
            <div class="calc-row"><span>Factura</span><span>{{ factura()?.numero }}</span></div>
            <div class="calc-row"><span>Monto a pagar</span><span>{{ montoBase | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
            <div class="calc-row"><span>Medio de pago</span><span>{{ medioPago }}</span></div>
            @if (comisionCalculada()) {
              <div class="calc-row"><span>Comision</span><span>- {{ comisionCalculada() | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
            }
            @if (descuentoCalculado()) {
              <div class="calc-row"><span>Descuento</span><span>- {{ descuentoCalculado() | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
            }
            @if (totalRetenciones()) {
              <div class="calc-row"><span>Total retenciones</span><span>- {{ totalRetenciones() | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
            }
            <div class="calc-row total"><span>Monto Neto Final</span><span>{{ montoNetoCalc() | currency:'ARS':'ARS ':'1.2-2' }}</span></div>
          </div>
          <div class="step-actions">
            <button class="btn-secondary" (click)="currentStep.set(1)">Atras</button>
            <button class="btn-primary" (click)="submit()" [disabled]="submitting()">
              @if (submitting()) { <span class="spinner"></span> }
              Confirmar Pago
            </button>
          </div>
        </div>
      }

      <!-- Step 4: Resultado -->
      @if (currentStep() === 3) {
        <div class="step-content result-step">
          @if (success()) {
            <div class="result-icon success">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3>Pago registrado exitosamente</h3>
            <p class="result-msg">El pago fue procesado correctamente</p>
          } @else {
            <div class="result-icon error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h3>Error al registrar pago</h3>
            <p class="result-msg">{{ errorMsg() }}</p>
          }
          <div class="step-actions" style="justify-content:center">
            <button class="btn-primary" (click)="onClose()">Cerrar</button>
          </div>
        </div>
      }
    </app-glass-modal>
  `,
  styles: [`
    .step-content { display: flex; flex-direction: column; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.125rem; }
    .info-label { font-size: 0.75rem; font-weight: 500; color: var(--color-gray-500); text-transform: uppercase; }
    .info-value { font-size: 0.875rem; font-weight: 500; color: var(--color-gray-900); }
    .info-value.highlight { color: var(--color-primary); font-weight: 700; }
    .convenio-info { display: flex; flex-direction: column; gap: 0.125rem; }
    .convenio-label { font-size: 0.875rem; font-weight: 600; color: var(--color-primary); }
    .convenio-detail { font-size: 0.75rem; color: var(--color-gray-500); }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
    .form-group label { font-size: 0.75rem; font-weight: 500; color: var(--color-gray-600); }
    .form-group input, .form-group select, .form-group textarea {
      padding: 0.625rem 0.75rem; border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-md); font-size: 0.875rem;
      background: var(--glass-bg); backdrop-filter: blur(10px);
      color: var(--color-gray-900);
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--color-primary); }
    .form-group textarea { resize: vertical; font-family: inherit; }
    .section-subtitle { font-size: 0.875rem; font-weight: 600; color: var(--color-gray-700); margin: 1rem 0 0.5rem; }
    .calc-preview, .confirm-summary { font-size: 0.875rem; }
    .calc-row { display: flex; justify-content: space-between; padding: 0.375rem 0; color: var(--color-gray-700); }
    .calc-row.total { border-top: 1px solid var(--color-gray-200); margin-top: 0.5rem; padding-top: 0.75rem; font-weight: 700; color: var(--color-gray-900); }
    .step-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; }
    .step-actions .btn-primary, .step-actions .btn-secondary { padding: 0.625rem 1.5rem; font-size: 0.875rem; }
    .result-step { text-align: center; align-items: center; padding: 1rem 0; }
    .result-icon { margin-bottom: 1rem; }
    .result-step h3 { font-size: 1.125rem; font-weight: 700; color: var(--color-gray-900); }
    .result-msg { font-size: 0.875rem; color: var(--color-gray-500); margin-top: 0.5rem; }
  `],
})
export class PagoModalComponent implements OnChanges {
  open = input(false);
  factura = input<Factura | null>(null);
  close = output<void>();
  paid = output<void>();

  currentStep = signal(0);
  submitting = signal(false);
  success = signal(false);
  errorMsg = signal('');
  convenio = signal<Convenio | null>(null);

  montoBase = 0;
  medioPago = 'transferencia';
  referenciaPago = '';
  retencionIIBB = 0;
  retencionGanancias = 0;
  retencionIVA = 0;
  retencionSUSS = 0;
  otrasRetenciones = 0;
  observaciones = '';

  stepTitles = ['Resumen de Factura', 'Registrar Pago', 'Confirmar Pago', 'Resultado'];

  comisionCalculada = computed(() => {
    if (!this.convenio()) return 0;
    let com = this.montoBase * this.convenio()!.comisionPorcentaje / 100;
    const reglas = this.convenio()!.reglas;
    if (reglas) {
      if (reglas.comisionMinima && com < reglas.comisionMinima) com = reglas.comisionMinima;
      if (reglas.comisionMaxima && com > reglas.comisionMaxima) com = reglas.comisionMaxima;
    }
    return com;
  });

  descuentoCalculado = computed(() => {
    if (!this.convenio()) return 0;
    return this.montoBase * this.convenio()!.descuentoPorcentaje / 100;
  });

  totalRetenciones = computed(() =>
    this.retencionIIBB + this.retencionGanancias + this.retencionIVA + this.retencionSUSS + this.otrasRetenciones
  );

  montoNetoCalc = computed(() =>
    this.montoBase - this.totalRetenciones() - this.comisionCalculada() - this.descuentoCalculado()
  );

  constructor(private facturaService: FacturaService, private convenioService: ConvenioService) {}

  ngOnChanges() {
    if (this.open() && this.factura()) {
      this.reset();
      this.montoBase = this.factura()!.saldoPendiente;
      this.loadConvenio();
    }
  }

  loadConvenio() {
    const empresa = this.factura()?.empresaProveedora;
    if (empresa?.convenios?.length) {
      const convId = typeof empresa.convenios[0] === 'string' ? empresa.convenios[0] : (empresa.convenios[0] as any)._id;
      this.convenioService.getById(convId).subscribe({
        next: (c) => this.convenio.set(c),
        error: () => this.convenio.set(null),
      });
    }
  }

  submit() {
    this.submitting.set(true);
    const payload = {
      montoBase: this.montoBase,
      medioPago: this.medioPago,
      referenciaPago: this.referenciaPago,
      retencionIIBB: this.retencionIIBB,
      retencionGanancias: this.retencionGanancias,
      retencionIVA: this.retencionIVA,
      retencionSUSS: this.retencionSUSS,
      otrasRetenciones: this.otrasRetenciones,
      observaciones: this.observaciones,
    };
    this.facturaService.pagar(this.factura()!._id, payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set(true);
        this.currentStep.set(3);
      },
      error: (err) => {
        this.submitting.set(false);
        this.success.set(false);
        this.errorMsg.set(err.error?.message || 'Error desconocido');
        this.currentStep.set(3);
      },
    });
  }

  onClose() {
    if (this.success()) this.paid.emit();
    this.close.emit();
  }

  reset() {
    this.currentStep.set(0);
    this.submitting.set(false);
    this.success.set(false);
    this.errorMsg.set('');
    this.convenio.set(null);
    this.montoBase = 0;
    this.medioPago = 'transferencia';
    this.referenciaPago = '';
    this.retencionIIBB = 0;
    this.retencionGanancias = 0;
    this.retencionIVA = 0;
    this.retencionSUSS = 0;
    this.otrasRetenciones = 0;
    this.observaciones = '';
  }
}
