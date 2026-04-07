import { Component, input, output, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GlassModalComponent } from '../../../shared/glass-modal/glass-modal';
import { ConvenioService } from '../../../services/convenio.service';
import { Convenio } from '../../../models';

@Component({
  selector: 'app-convenio-form-modal',
  standalone: true,
  imports: [FormsModule, GlassModalComponent],
  template: `
    <app-glass-modal [open]="open()" [title]="isEdit() ? 'Editar Convenio' : 'Nuevo Convenio'" subtitle="Configura las reglas del convenio" (close)="onClose()">
      <form (ngSubmit)="onSubmit()" class="form">
        <div class="form-grid">
          <div class="form-group full">
            <label>Nombre</label>
            <input type="text" [(ngModel)]="nombre" name="nombre" placeholder="Nombre del convenio" required />
          </div>
          <div class="form-group full">
            <label>Descripcion</label>
            <textarea [(ngModel)]="descripcion" name="descripcion" rows="2" placeholder="Descripcion opcional"></textarea>
          </div>
          <div class="form-group">
            <label>Comision (%)</label>
            <input type="number" [(ngModel)]="comisionPorcentaje" name="comision" min="0" max="100" step="0.01" />
          </div>
          <div class="form-group">
            <label>Descuento (%)</label>
            <input type="number" [(ngModel)]="descuentoPorcentaje" name="descuento" min="0" max="100" step="0.01" />
          </div>
        </div>

        <h4 class="section-subtitle">Reglas (opcional)</h4>
        <div class="form-grid">
          <div class="form-group">
            <label>Comision Minima</label>
            <input type="number" [(ngModel)]="comisionMinima" name="comMin" min="0" step="0.01" />
          </div>
          <div class="form-group">
            <label>Comision Maxima</label>
            <input type="number" [(ngModel)]="comisionMaxima" name="comMax" min="0" step="0.01" />
          </div>
          <div class="form-group">
            <label>Dias de pago</label>
            <input type="number" [(ngModel)]="diasPago" name="diasPago" min="0" />
          </div>
          <div class="form-group checkbox-group">
            <label><input type="checkbox" [(ngModel)]="aplicaIVA" name="aplicaIVA" /> Aplica IVA sobre comision</label>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" (click)="onClose()">Cancelar</button>
          <button type="submit" class="btn-primary" [disabled]="saving() || !nombre">
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
    .form-group input, .form-group select, .form-group textarea {
      padding: 0.625rem 0.75rem; border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-md); font-size: 0.875rem;
      background: var(--glass-bg); backdrop-filter: blur(10px);
      color: var(--color-gray-900);
    }
    .form-group input:focus, .form-group textarea:focus { outline: none; border-color: var(--color-primary); }
    .form-group textarea { resize: vertical; font-family: inherit; }
    .checkbox-group label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer; }
    .checkbox-group input[type="checkbox"] { width: auto; }
    .section-subtitle { font-size: 0.875rem; font-weight: 600; color: var(--color-gray-700); margin: 1rem 0 0.5rem; }
    .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; }
    .form-actions .btn-primary, .form-actions .btn-secondary { padding: 0.625rem 1.5rem; font-size: 0.875rem; }
  `],
})
export class ConvenioFormModalComponent {
  open = input(false);
  entity = input<Convenio | null>(null);
  close = output<void>();
  saved = output<void>();
  saving = signal(false);
  isEdit = computed(() => !!this.entity());

  nombre = '';
  descripcion = '';
  comisionPorcentaje = 0;
  descuentoPorcentaje = 0;
  comisionMinima = 0;
  comisionMaxima = 0;
  diasPago = 30;
  aplicaIVA = false;

  constructor(private service: ConvenioService) {
    effect(() => {
      const e = this.entity();
      if (e) {
        this.nombre = e.nombre;
        this.descripcion = e.descripcion || '';
        this.comisionPorcentaje = e.comisionPorcentaje;
        this.descuentoPorcentaje = e.descuentoPorcentaje;
        this.comisionMinima = e.reglas?.comisionMinima || 0;
        this.comisionMaxima = e.reglas?.comisionMaxima || 0;
        this.diasPago = e.reglas?.diasPago || 30;
        this.aplicaIVA = e.reglas?.aplicaIVASobreComision || false;
      } else {
        this.resetForm();
      }
    });
  }

  onSubmit() {
    if (!this.nombre) return;
    this.saving.set(true);
    const payload = {
      nombre: this.nombre,
      descripcion: this.descripcion,
      comisionPorcentaje: this.comisionPorcentaje,
      descuentoPorcentaje: this.descuentoPorcentaje,
      reglas: {
        comisionMinima: this.comisionMinima,
        comisionMaxima: this.comisionMaxima,
        aplicaIVASobreComision: this.aplicaIVA,
        diasPago: this.diasPago,
      },
    };
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
    this.nombre = '';
    this.descripcion = '';
    this.comisionPorcentaje = 0;
    this.descuentoPorcentaje = 0;
    this.comisionMinima = 0;
    this.comisionMaxima = 0;
    this.diasPago = 30;
    this.aplicaIVA = false;
  }
}
