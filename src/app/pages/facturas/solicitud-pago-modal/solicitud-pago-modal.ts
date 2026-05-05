import { Component, input, output, signal, computed, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GlassModalComponent } from '../../../shared/glass-modal/glass-modal';
import { NumberFormatDirective } from '../../../shared/number-format/number-format.directive';
import { ToastService } from '../../../shared/toast/toast.service';
import { SolicitudPagoService, MedioPago, TipoSolicitud } from '../../../services/solicitud-pago.service';

@Component({
  selector: 'app-solicitud-pago-modal',
  standalone: true,
  imports: [FormsModule, GlassModalComponent, NumberFormatDirective],
  template: `
    <app-glass-modal [open]="open()" [title]="title()" [maxWidth]="'560px'" (close)="onClose()">
      <div class="step-content">
        <div class="form-grid">
          <div class="form-group">
            <label>Monto <span class="required">*</span></label>
            <input appNumberFormat [decimals]="2" [(ngModel)]="monto" min="0" />
            @if (saldo() != null) {
              <span class="hint">Saldo pendiente: {{ saldoFmt() }}</span>
            }
          </div>

          <div class="form-group">
            <label>Medio de pago <span class="required">*</span></label>
            <select [(ngModel)]="medioPago">
              <option value="transferencia">Transferencia</option>
              <option value="cheque">Cheque</option>
              <option value="efectivo">Efectivo</option>
              <option value="compensacion">Compensación</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        <div class="form-grid" style="margin-top:0.75rem">
          <div class="form-group">
            <label>Banco origen</label>
            <input type="text" [(ngModel)]="bancoOrigen" placeholder="Ej: Galicia" />
          </div>

          @if (tipo() === 'compromiso') {
            <div class="form-group">
              <label>Fecha de vencimiento <span class="required">*</span></label>
              <input type="date" [(ngModel)]="fechaVencimiento" [min]="hoyISO" />
            </div>
          }
        </div>

        <div class="form-group" style="margin-top:0.75rem">
          <label>Nota</label>
          <textarea rows="2" [(ngModel)]="nota" placeholder="Comentario opcional"></textarea>
        </div>

        <div class="info-box card-glass" style="margin-top:1rem">
          <strong>Próximo paso:</strong> al confirmar, la solicitud queda en estado "Pendiente" y se notifica por email a Contabilidad para su aprobación.
        </div>

        <div class="step-actions">
          <button class="btn-secondary" (click)="onClose()" [disabled]="submitting()">Cancelar</button>
          <button class="btn-primary" (click)="submit()" [disabled]="submitting() || !isValid()">
            @if (submitting()) { <span class="spinner"></span> }
            Crear {{ tipo() === 'compromiso' ? 'Compromiso' : 'Solicitud' }}
          </button>
        </div>
      </div>
    </app-glass-modal>
  `,
  styles: [`
    .step-content { display:flex; flex-direction:column; }
    .form-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.75rem; }
    .form-group { display:flex; flex-direction:column; gap:0.25rem; }
    .form-group label { font-size:0.75rem; font-weight:500; color:var(--color-gray-600); }
    .required { color:var(--color-error); }
    .hint { font-size:0.6875rem; color:var(--color-gray-500); margin-top:0.125rem; }
    .form-group input, .form-group select, .form-group textarea {
      padding:0.625rem 0.75rem; border:1px solid var(--color-gray-200);
      border-radius:var(--radius-md); font-size:0.875rem;
      background:var(--glass-bg); backdrop-filter:blur(10px); color:var(--color-gray-900);
      font-family:inherit;
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline:none; border-color:var(--color-primary); }
    .info-box { padding:0.75rem 0.875rem; font-size:0.8125rem; color:var(--color-gray-700); border-left:3px solid var(--color-info); }
    .step-actions { display:flex; gap:0.75rem; justify-content:flex-end; margin-top:1.5rem; }
    .step-actions .btn-primary, .step-actions .btn-secondary { padding:0.625rem 1.5rem; font-size:0.875rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitudPagoModalComponent implements OnChanges {
  open = input(false);
  facturaId = input<string | null>(null);
  saldoPendiente = input<number | null>(null);
  initialTipo = input<TipoSolicitud>('manual');
  close = output<void>();
  saved = output<void>();

  tipo = signal<TipoSolicitud>('manual');
  monto = 0;
  medioPago: MedioPago = 'transferencia';
  bancoOrigen = '';
  fechaVencimiento = '';
  nota = '';
  submitting = signal(false);

  saldo = computed(() => this.saldoPendiente());
  saldoFmt = computed(() => {
    const v = this.saldo();
    return v != null ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v) : '';
  });
  title = computed(() => this.tipo() === 'compromiso' ? 'Compromiso de Pago' : 'Solicitud de Pago');

  hoyISO = new Date().toISOString().slice(0, 10);

  constructor(private service: SolicitudPagoService, private toast: ToastService) {}

  ngOnChanges() {
    if (this.open()) {
      this.tipo.set(this.initialTipo());
      this.monto = this.saldo() ?? 0;
      this.medioPago = 'transferencia';
      this.bancoOrigen = '';
      this.fechaVencimiento = '';
      this.nota = '';
      this.submitting.set(false);
    }
  }

  isValid(): boolean {
    if (!this.facturaId()) return false;
    if (this.monto <= 0) return false;
    if (!this.medioPago) return false;
    if (this.tipo() === 'compromiso') {
      if (!this.fechaVencimiento) return false;
      const f = new Date(this.fechaVencimiento);
      if (f.getTime() <= Date.now()) return false;
    }
    return true;
  }

  submit() {
    if (!this.isValid()) return;
    this.submitting.set(true);
    this.service.create({
      factura: this.facturaId()!,
      tipo: this.tipo(),
      monto: this.monto,
      fechaVencimiento: this.tipo() === 'compromiso' ? this.fechaVencimiento : undefined,
      nota: this.nota || undefined,
      medioPago: this.medioPago,
      bancoOrigen: this.bancoOrigen || undefined,
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast.success(`${this.title()} creada — Contabilidad fue notificada por email`);
        this.saved.emit();
        this.close.emit();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.error(err.error?.message || 'Error al crear solicitud');
      },
    });
  }

  onClose() {
    if (!this.submitting()) this.close.emit();
  }
}
