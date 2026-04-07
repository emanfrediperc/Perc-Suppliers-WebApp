import { Component, input, output, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GlassModalComponent } from '../../../shared/glass-modal/glass-modal';
import { EmpresaProveedoraService } from '../../../services/empresa-proveedora.service';
import { EmpresaProveedora } from '../../../models';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-empresa-proveedora-form-modal',
  standalone: true,
  imports: [FormsModule, GlassModalComponent],
  template: `
    <app-glass-modal [open]="open()" [title]="isEdit() ? 'Editar Empresa Proveedora' : 'Nueva Empresa Proveedora'" subtitle="Se creara tambien en Finnegans" (close)="onClose()">
      <form (ngSubmit)="onSubmit()" class="form">
        <div class="form-grid">
          <div class="form-group">
            <label>CUIT *</label>
            <div class="cuit-input-row">
              <input type="text" [(ngModel)]="cuit" name="cuit" placeholder="XX-XXXXXXXX-X" required maxlength="13" [readonly]="isEdit()" />
              @if (!isEdit()) {
                <button type="button" class="btn-afip" (click)="buscarCuit()" [disabled]="buscandoCuit() || !cuit">
                  @if (buscandoCuit()) {
                    <span class="spinner"></span>
                  } @else {
                    Buscar
                  }
                </button>
              }
            </div>
            @if (cuitError) {
              <span class="field-error">{{ cuitError }}</span>
            }
          </div>
          <div class="form-group">
            <label>Condicion IVA</label>
            <select [(ngModel)]="condicionIva" name="condicionIva">
              <option value="">Seleccionar...</option>
              <option value="Responsable Inscripto">Responsable Inscripto</option>
              <option value="Monotributista">Monotributista</option>
              <option value="Exento">Exento</option>
              <option value="Consumidor Final">Consumidor Final</option>
            </select>
          </div>
          <div class="form-group full">
            <label>Razon Social *</label>
            <input type="text" [(ngModel)]="razonSocial" name="razonSocial" placeholder="Razon social" required />
          </div>
          <div class="form-group full">
            <label>Nombre Fantasia</label>
            <input type="text" [(ngModel)]="nombreFantasia" name="nombreFantasia" placeholder="Nombre fantasia" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" placeholder="email@empresa.com" />
          </div>
          <div class="form-group">
            <label>Telefono</label>
            <input type="text" [(ngModel)]="telefono" name="telefono" placeholder="+54 11 ..." />
          </div>
          <div class="form-group full">
            <label>Direccion</label>
            <input type="text" [(ngModel)]="direccion" name="direccion" placeholder="Direccion" />
          </div>
          <div class="form-group full">
            <label>Contacto</label>
            <input type="text" [(ngModel)]="contacto" name="contacto" placeholder="Nombre del contacto" />
          </div>
        </div>

        <h4 class="section-subtitle">Datos Bancarios (opcional)</h4>
        <div class="form-grid">
          <div class="form-group">
            <label>Banco</label>
            <input type="text" [(ngModel)]="banco" name="banco" placeholder="Nombre del banco" />
          </div>
          <div class="form-group">
            <label>CBU</label>
            <input type="text" [(ngModel)]="cbu" name="cbu" placeholder="22 digitos" maxlength="22" />
          </div>
          <div class="form-group">
            <label>Alias</label>
            <input type="text" [(ngModel)]="alias" name="alias" placeholder="alias.bancario" />
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" (click)="onClose()">Cancelar</button>
          <button type="submit" class="btn-primary" [disabled]="saving() || !cuit || !razonSocial">
            @if (saving()) { <span class="spinner"></span> }
            {{ isEdit() ? 'Actualizar' : 'Guardar' }}
          </button>
        </div>
      </form>
    </app-glass-modal>
  `,
  styles: [`
    .form { display: flex; flex-direction: column; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
    .form-group.full { grid-column: 1 / -1; }
    .form-group label { font-size: 0.75rem; font-weight: 500; color: var(--color-gray-600); }
    .form-group input, .form-group select {
      padding: 0.625rem 0.75rem; border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-md); font-size: 0.875rem;
      background: var(--glass-bg); backdrop-filter: blur(10px);
      color: var(--color-gray-900);
    }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: var(--color-primary); }
    .form-group input[readonly] { opacity: 0.6; cursor: not-allowed; }
    .section-subtitle { font-size: 0.875rem; font-weight: 600; color: var(--color-gray-700); margin: 1rem 0 0.5rem; }
    .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; }
    .form-actions .btn-primary, .form-actions .btn-secondary { padding: 0.625rem 1.5rem; font-size: 0.875rem; }
    .cuit-input-row { display: flex; gap: 0.5rem; align-items: stretch; }
    .cuit-input-row input { flex: 1; }
    .btn-afip {
      padding: 0.625rem 1rem; font-size: 0.8rem; font-weight: 500;
      background: var(--color-primary); color: white; border: none;
      border-radius: var(--radius-md); cursor: pointer; white-space: nowrap;
      display: flex; align-items: center; justify-content: center; min-width: 70px;
    }
    .btn-afip:hover:not(:disabled) { opacity: 0.9; }
    .btn-afip:disabled { opacity: 0.5; cursor: not-allowed; }
    .field-error { font-size: 0.7rem; color: var(--color-danger, #dc3545); }
  `],
})
export class EmpresaProveedoraFormModalComponent {
  open = input(false);
  entity = input<EmpresaProveedora | null>(null);
  close = output<void>();
  saved = output<void>();
  saving = signal(false);
  buscandoCuit = signal(false);
  isEdit = computed(() => !!this.entity());

  cuit = '';
  cuitError = '';
  razonSocial = '';
  nombreFantasia = '';
  condicionIva = '';
  email = '';
  telefono = '';
  direccion = '';
  contacto = '';
  banco = '';
  cbu = '';
  alias = '';

  constructor(
    private service: EmpresaProveedoraService,
    private toast: ToastService,
  ) {
    effect(() => {
      const e = this.entity();
      if (e) {
        this.cuit = e.cuit;
        this.razonSocial = e.razonSocial;
        this.nombreFantasia = e.nombreFantasia || '';
        this.condicionIva = e.condicionIva || '';
        this.email = e.email || '';
        this.telefono = e.telefono || '';
        this.direccion = e.direccion || '';
        this.contacto = e.contacto || '';
        this.banco = e.datosBancarios?.banco || '';
        this.cbu = e.datosBancarios?.cbu || '';
        this.alias = e.datosBancarios?.alias || '';
      } else {
        this.resetForm();
      }
    });
  }

  buscarCuit() {
    this.cuitError = '';
    const cleaned = this.cuit.replace(/-/g, '');
    if (!/^\d{11}$/.test(cleaned)) {
      this.cuitError = 'El CUIT debe tener 11 digitos (ej: XX-XXXXXXXX-X)';
      return;
    }
    this.buscandoCuit.set(true);
    this.service.consultarCuit(cleaned).subscribe({
      next: (data) => {
        this.buscandoCuit.set(false);
        if (data) {
          if (data.razonSocial) this.razonSocial = data.razonSocial;
          if (data.condicionIva && data.condicionIva !== '-') this.condicionIva = data.condicionIva;
          if (data.domicilio) this.direccion = data.domicilio;
          this.toast.success('Datos obtenidos de AFIP');
        } else {
          this.toast.error('No se encontraron datos para el CUIT ingresado');
        }
      },
      error: () => {
        this.buscandoCuit.set(false);
        this.toast.error('Error al consultar AFIP. Intente nuevamente.');
      },
    });
  }

  onSubmit() {
    if (!this.cuit || !this.razonSocial) return;
    this.saving.set(true);
    const payload: any = {
      razonSocial: this.razonSocial,
      nombreFantasia: this.nombreFantasia || undefined,
      condicionIva: this.condicionIva || undefined,
      email: this.email || undefined,
      telefono: this.telefono || undefined,
      direccion: this.direccion || undefined,
      contacto: this.contacto || undefined,
    };
    if (!this.isEdit()) {
      payload.cuit = this.cuit.replace(/[^0-9]/g, '');
    }
    if (this.banco || this.cbu || this.alias) {
      payload.datosBancarios = { banco: this.banco, cbu: this.cbu, alias: this.alias };
    }
    const request = this.isEdit()
      ? this.service.update(this.entity()!._id, payload)
      : this.service.create(payload);
    request.subscribe({
      next: () => { this.saving.set(false); this.resetForm(); this.saved.emit(); },
      error: () => this.saving.set(false),
    });
  }

  onClose() {
    this.resetForm();
    this.close.emit();
  }

  resetForm() {
    this.cuit = '';
    this.cuitError = '';
    this.razonSocial = '';
    this.nombreFantasia = '';
    this.condicionIva = '';
    this.email = '';
    this.telefono = '';
    this.direccion = '';
    this.contacto = '';
    this.banco = '';
    this.cbu = '';
    this.alias = '';
  }
}
