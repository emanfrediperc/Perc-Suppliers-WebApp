import { Component, input, output, signal, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GlassModalComponent } from '../../../shared/glass-modal/glass-modal';
import { ToastService } from '../../../shared/toast/toast.service';
import { FacturaService } from '../../../services/factura.service';
import { EmpresaProveedoraService } from '../../../services/empresa-proveedora.service';
import { EmpresaClienteService } from '../../../services/empresa-cliente.service';
import { EmpresaProveedora, EmpresaCliente, OcrExtractedData } from '../../../models';

@Component({
  selector: 'app-upload-factura-modal',
  standalone: true,
  imports: [FormsModule, GlassModalComponent],
  template: `
    <app-glass-modal [open]="open()" [title]="stepTitles[currentStep()]" [maxWidth]="'720px'" (close)="onClose()">
      <!-- Step 0: Subir archivo -->
      @if (currentStep() === 0) {
        <div class="step-content">
          @if (!selectedFile()) {
            <div
              class="drop-zone"
              [class.drag-over]="dragOver()"
              (dragover)="onDragOver($event)"
              (dragleave)="dragOver.set(false)"
              (drop)="onDrop($event)"
              (click)="fileInput.click()"
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-gray-400)" stroke-width="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p class="drop-text">Arrastra un archivo aqui o <span class="drop-link">selecciona uno</span></p>
              <p class="drop-hint">PDF, JPG o PNG (max 10MB)</p>
            </div>
          } @else {
            <div class="file-preview card-glass">
              <div class="file-icon">
                @if (selectedFile()!.type === 'application/pdf') {
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                } @else {
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                }
              </div>
              <div class="file-info">
                <span class="file-name">{{ selectedFile()!.name }}</span>
                <span class="file-size">{{ formatSize(selectedFile()!.size) }}</span>
              </div>
              <button class="btn-remove" (click)="removeFile()" title="Quitar archivo">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          }
          <input #fileInput type="file" hidden accept=".pdf,.jpg,.jpeg,.png" (change)="onFileSelected($event)" />

          @if (uploading() || ocrProcessing()) {
            <div class="progress-bar">
              <div class="progress-fill" [class.indeterminate]="true"></div>
            </div>
            <p class="progress-text">{{ ocrProcessing() ? 'Leyendo datos con IA...' : 'Subiendo archivo...' }}</p>
          }

          <div class="step-actions">
            <button class="btn-secondary" (click)="onClose()">Cancelar</button>
            <button class="btn-secondary" (click)="uploadOnly()" [disabled]="!selectedFile() || uploading() || ocrProcessing()">
              Solo subir
            </button>
            <button class="btn-primary" (click)="uploadWithOcr()" [disabled]="!selectedFile() || uploading() || ocrProcessing()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              Subir y leer datos
            </button>
          </div>
        </div>
      }

      <!-- Step 1: Datos de la factura -->
      @if (currentStep() === 1) {
        <div class="step-content">
          @if (ocrData()) {
            <div class="ocr-notice card-glass">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>Campos pre-llenados por OCR. Revisa y corrige si es necesario.</span>
            </div>
          }

          <div class="form-grid">
            <div class="form-group">
              <label>Numero <span class="required">*</span></label>
              <input type="text" [(ngModel)]="numero" placeholder="FC-A-0001-00001234" [class.ocr-filled]="ocrData()?.numero" />
            </div>
            <div class="form-group">
              <label>Tipo <span class="required">*</span></label>
              <select [(ngModel)]="tipo" [class.ocr-filled]="ocrData()?.tipo">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="M">M</option>
                <option value="E">E</option>
              </select>
            </div>
            <div class="form-group">
              <label>Fecha <span class="required">*</span></label>
              <input type="date" [(ngModel)]="fecha" [class.ocr-filled]="ocrData()?.fecha" />
            </div>
            <div class="form-group">
              <label>Fecha Vencimiento</label>
              <input type="date" [(ngModel)]="fechaVencimiento" [class.ocr-filled]="ocrData()?.fechaVencimiento" />
            </div>
          </div>

          <div class="form-grid" style="margin-top: 0.75rem">
            <div class="form-group">
              <label>Monto Neto <span class="required">*</span></label>
              <input type="number" [(ngModel)]="montoNeto" min="0" step="0.01" [class.ocr-filled]="ocrData()?.montoNeto" />
            </div>
            <div class="form-group">
              <label>IVA</label>
              <input type="number" [(ngModel)]="montoIva" min="0" step="0.01" [class.ocr-filled]="ocrData()?.montoIva" />
            </div>
            <div class="form-group">
              <label>Monto Total <span class="required">*</span></label>
              <input type="number" [(ngModel)]="montoTotal" min="0" step="0.01" [class.ocr-filled]="ocrData()?.montoTotal" />
            </div>
          </div>

          <div class="form-grid" style="margin-top: 0.75rem">
            <div class="form-group">
              <label>Empresa Proveedora <span class="required">*</span></label>
              <select [(ngModel)]="empresaProveedoraId">
                <option value="">Seleccionar...</option>
                @for (e of proveedores(); track e._id) {
                  <option [value]="e._id">{{ e.razonSocial }} ({{ e.cuit }})</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Empresa Cliente</label>
              <select [(ngModel)]="empresaClienteId">
                <option value="">Seleccionar...</option>
                @for (e of clientes(); track e._id) {
                  <option [value]="e._id">{{ e.razonSocial }} ({{ e.cuit }})</option>
                }
              </select>
            </div>
          </div>

          <div class="step-actions">
            <button class="btn-secondary" (click)="currentStep.set(0)">Atras</button>
            <button class="btn-primary" (click)="submitFactura()" [disabled]="submitting() || !isFormValid()">
              @if (submitting()) { <span class="spinner"></span> }
              Crear Factura
            </button>
          </div>
        </div>
      }

      <!-- Step 2: Resultado -->
      @if (currentStep() === 2) {
        <div class="step-content result-step">
          @if (success()) {
            <div class="result-icon success">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3>Factura creada exitosamente</h3>
            <p class="result-msg">La factura fue registrada correctamente</p>
          } @else {
            <div class="result-icon error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h3>Error al crear factura</h3>
            <p class="result-msg">{{ errorMsg() }}</p>
          }
          <div class="step-actions" style="justify-content: center">
            @if (!success()) {
              <button class="btn-secondary" (click)="currentStep.set(1)">Reintentar</button>
            }
            <button class="btn-primary" (click)="onClose()">Cerrar</button>
          </div>
        </div>
      }
    </app-glass-modal>
  `,
  styles: [`
    .step-content { display: flex; flex-direction: column; }
    .drop-zone {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 2.5rem 1.5rem; border: 2px dashed var(--color-gray-300);
      border-radius: var(--radius-lg); cursor: pointer;
      transition: all var(--transition-fast); text-align: center;
    }
    .drop-zone:hover, .drop-zone.drag-over {
      border-color: var(--color-primary); background: rgba(99, 102, 241, 0.04);
    }
    .drop-text { margin-top: 0.75rem; font-size: 0.9375rem; color: var(--color-gray-600); }
    .drop-link { color: var(--color-primary); font-weight: 600; }
    .drop-hint { font-size: 0.75rem; color: var(--color-gray-400); margin-top: 0.25rem; }
    .file-preview {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 1rem; border-radius: var(--radius-md);
    }
    .file-icon { flex-shrink: 0; }
    .file-info { flex: 1; display: flex; flex-direction: column; }
    .file-name { font-size: 0.875rem; font-weight: 600; color: var(--color-gray-900); word-break: break-all; }
    .file-size { font-size: 0.75rem; color: var(--color-gray-500); }
    .btn-remove {
      background: none; border: none; color: var(--color-gray-400);
      cursor: pointer; padding: 0.25rem; border-radius: var(--radius-sm);
      transition: color var(--transition-fast);
    }
    .btn-remove:hover { color: var(--color-error); }
    .progress-bar {
      height: 4px; background: var(--color-gray-200); border-radius: 2px;
      margin-top: 1rem; overflow: hidden;
    }
    .progress-fill {
      height: 100%; background: var(--color-primary); border-radius: 2px;
      transition: width 0.3s ease;
    }
    .progress-fill.indeterminate {
      width: 40%; animation: indeterminate 1.5s ease-in-out infinite;
    }
    @keyframes indeterminate { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }
    .progress-text { font-size: 0.75rem; color: var(--color-gray-500); text-align: center; margin-top: 0.5rem; }
    .ocr-notice {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.625rem 0.875rem; margin-bottom: 1rem;
      font-size: 0.8125rem; color: var(--color-primary);
    }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
    .form-group label { font-size: 0.75rem; font-weight: 500; color: var(--color-gray-600); }
    .required { color: var(--color-error); }
    .form-group input, .form-group select {
      padding: 0.625rem 0.75rem; border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-md); font-size: 0.875rem;
      background: var(--glass-bg); backdrop-filter: blur(10px);
      color: var(--color-gray-900);
    }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: var(--color-primary); }
    .ocr-filled { border-color: var(--color-primary) !important; background: rgba(99, 102, 241, 0.04) !important; }
    .step-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; }
    .step-actions .btn-primary, .step-actions .btn-secondary { padding: 0.625rem 1.5rem; font-size: 0.875rem; }
    .result-step { text-align: center; align-items: center; padding: 1rem 0; }
    .result-icon { margin-bottom: 1rem; }
    .result-step h3 { font-size: 1.125rem; font-weight: 700; color: var(--color-gray-900); }
    .result-msg { font-size: 0.875rem; color: var(--color-gray-500); margin-top: 0.5rem; }
  `],
})
export class UploadFacturaModalComponent implements OnChanges {
  open = input(false);
  close = output<void>();
  saved = output<void>();

  currentStep = signal(0);
  selectedFile = signal<File | null>(null);
  dragOver = signal(false);
  uploading = signal(false);
  ocrProcessing = signal(false);
  ocrData = signal<OcrExtractedData | null>(null);
  archivoUrl = signal('');
  archivoKey = signal('');
  archivoNombre = signal('');
  submitting = signal(false);
  success = signal(false);
  errorMsg = signal('');

  proveedores = signal<EmpresaProveedora[]>([]);
  clientes = signal<EmpresaCliente[]>([]);

  // Form fields
  numero = '';
  tipo = 'A';
  fecha = '';
  fechaVencimiento = '';
  montoNeto = 0;
  montoIva = 0;
  montoTotal = 0;
  empresaProveedoraId = '';
  empresaClienteId = '';

  stepTitles = ['Subir Factura', 'Datos de la Factura', 'Resultado'];

  constructor(
    private facturaService: FacturaService,
    private proveedorService: EmpresaProveedoraService,
    private clienteService: EmpresaClienteService,
    private toast: ToastService,
  ) {}

  ngOnChanges() {
    if (this.open()) {
      this.reset();
      this.loadEmpresas();
    }
  }

  loadEmpresas() {
    this.proveedorService.getAll({ limit: 200 }).subscribe({
      next: (res) => this.proveedores.set(res.data),
    });
    this.clienteService.getAll({ limit: 200 }).subscribe({
      next: (res) => this.clientes.set(res.data),
    });
  }

  onDragOver(e: DragEvent) { e.preventDefault(); this.dragOver.set(true); }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.setFile(file);
  }

  setFile(file: File) {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      this.toast.error('Tipo de archivo no permitido. Use PDF, JPG o PNG');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.toast.error('El archivo excede 10MB');
      return;
    }
    this.selectedFile.set(file);
  }

  removeFile() { this.selectedFile.set(null); }

  uploadOnly() {
    const file = this.selectedFile();
    if (!file) return;
    this.uploading.set(true);
    this.facturaService.uploadFile(file).subscribe({
      next: (res) => {
        this.archivoUrl.set(res.archivoUrl);
        this.archivoKey.set(res.archivoKey);
        this.archivoNombre.set(res.archivoNombre);
        this.uploading.set(false);
        this.currentStep.set(1);
      },
      error: (err) => {
        this.uploading.set(false);
        this.toast.error(err.error?.message || 'Error al subir archivo');
      },
    });
  }

  uploadWithOcr() {
    const file = this.selectedFile();
    if (!file) return;
    this.uploading.set(true);
    this.ocrProcessing.set(true);
    this.facturaService.uploadAndOcr(file).subscribe({
      next: (res) => {
        this.archivoUrl.set(res.archivoUrl);
        this.archivoKey.set(res.archivoKey);
        this.archivoNombre.set(res.archivoNombre);
        this.uploading.set(false);
        this.ocrProcessing.set(false);

        if (res.ocrData) {
          this.ocrData.set(res.ocrData);
          this.fillFromOcr(res.ocrData);
        }
        if (res.ocrError) {
          this.toast.error(`OCR: ${res.ocrError}. Completa los datos manualmente.`);
        }
        this.currentStep.set(1);
      },
      error: (err) => {
        this.uploading.set(false);
        this.ocrProcessing.set(false);
        this.toast.error(err.error?.message || 'Error al procesar archivo');
      },
    });
  }

  fillFromOcr(data: OcrExtractedData) {
    if (data.numero) this.numero = data.numero;
    if (data.tipo) this.tipo = data.tipo;
    if (data.fecha) this.fecha = data.fecha;
    if (data.fechaVencimiento) this.fechaVencimiento = data.fechaVencimiento;
    if (data.montoNeto != null) this.montoNeto = data.montoNeto;
    if (data.montoIva != null) this.montoIva = data.montoIva;
    if (data.montoTotal != null) this.montoTotal = data.montoTotal;

    // Match proveedora by CUIT
    if (data.cuitProveedor) {
      const match = this.proveedores().find(p => p.cuit === data.cuitProveedor);
      if (match) this.empresaProveedoraId = match._id;
    }
    // Match cliente by CUIT
    if (data.cuitCliente) {
      const match = this.clientes().find(c => c.cuit === data.cuitCliente);
      if (match) this.empresaClienteId = match._id;
    }
  }

  isFormValid(): boolean {
    return !!this.numero && !!this.tipo && !!this.fecha && this.montoNeto > 0 && this.montoTotal > 0 && !!this.empresaProveedoraId;
  }

  submitFactura() {
    this.submitting.set(true);
    const payload: any = {
      numero: this.numero,
      tipo: this.tipo,
      fecha: this.fecha,
      montoNeto: this.montoNeto,
      montoIva: this.montoIva || 0,
      montoTotal: this.montoTotal,
      empresaProveedora: this.empresaProveedoraId,
    };
    if (this.fechaVencimiento) payload.fechaVencimiento = this.fechaVencimiento;
    if (this.empresaClienteId) payload.empresaCliente = this.empresaClienteId;
    if (this.archivoUrl()) payload.archivoUrl = this.archivoUrl();
    if (this.archivoKey()) payload.archivoKey = this.archivoKey();
    if (this.archivoNombre()) payload.archivoNombre = this.archivoNombre();

    this.facturaService.create(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set(true);
        this.currentStep.set(2);
      },
      error: (err) => {
        this.submitting.set(false);
        this.success.set(false);
        this.errorMsg.set(err.error?.message || 'Error desconocido');
        this.currentStep.set(2);
      },
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  onClose() {
    if (this.success()) this.saved.emit();
    this.close.emit();
  }

  reset() {
    this.currentStep.set(0);
    this.selectedFile.set(null);
    this.dragOver.set(false);
    this.uploading.set(false);
    this.ocrProcessing.set(false);
    this.ocrData.set(null);
    this.archivoUrl.set('');
    this.archivoKey.set('');
    this.archivoNombre.set('');
    this.submitting.set(false);
    this.success.set(false);
    this.errorMsg.set('');
    this.numero = '';
    this.tipo = 'A';
    this.fecha = '';
    this.fechaVencimiento = '';
    this.montoNeto = 0;
    this.montoIva = 0;
    this.montoTotal = 0;
    this.empresaProveedoraId = '';
    this.empresaClienteId = '';
  }
}
