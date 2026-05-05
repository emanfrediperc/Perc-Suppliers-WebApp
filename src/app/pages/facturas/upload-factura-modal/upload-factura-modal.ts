import { Component, input, output, signal, computed, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GlassModalComponent } from '../../../shared/glass-modal/glass-modal';
import { NumberFormatDirective } from '../../../shared/number-format/number-format.directive';
import { ToastService } from '../../../shared/toast/toast.service';
import { FacturaService } from '../../../services/factura.service';
import { EmpresaProveedoraService } from '../../../services/empresa-proveedora.service';
import { EmpresaClienteService } from '../../../services/empresa-cliente.service';
import { EmpresaProveedora, EmpresaCliente, OcrExtractedData } from '../../../models';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface FacturaDraft {
  file: File | null;
  archivoUrl: string;
  archivoKey: string;
  archivoNombre: string;
  ocrData: OcrExtractedData | null;
  numero: string;
  tipo: string;
  fecha: string;
  fechaVencimiento: string;
  montoNeto: number;
  montoIva: number;
  montoTotal: number;
  empresaProveedoraId: string;
  empresaClienteId: string;
  submitStatus: 'idle' | 'creating' | 'created' | 'error';
  errorMsg: string;
}

@Component({
  selector: 'app-upload-factura-modal',
  standalone: true,
  imports: [FormsModule, GlassModalComponent, NumberFormatDirective],
  template: `
    <app-glass-modal [open]="open()" [title]="stepTitles[currentStep()]" [maxWidth]="'780px'" (close)="onClose()">
      <!-- Step 0: Subir archivos -->
      @if (currentStep() === 0) {
        <div class="step-content">
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
            <p class="drop-text">Arrastra uno o varios archivos aqui o <span class="drop-link">selecciona</span></p>
            <p class="drop-hint">PDF, JPG o PNG (max 10MB cada uno)</p>
          </div>
          <input #fileInput type="file" hidden multiple accept=".pdf,.jpg,.jpeg,.png" (change)="onFileSelected($event)" />

          @if (selectedFiles().length > 0) {
            <div class="file-list">
              <div class="file-list-header">
                <span>{{ selectedFiles().length }} archivo(s) seleccionado(s)</span>
                <button class="btn-link" (click)="clearFiles()">Limpiar todo</button>
              </div>
              @for (f of selectedFiles(); track $index) {
                <div class="file-row card-glass">
                  <div class="file-icon">
                    @if (f.type === 'application/pdf') {
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    } @else {
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    }
                  </div>
                  <div class="file-info">
                    <span class="file-name">{{ f.name }}</span>
                    <span class="file-size">{{ formatSize(f.size) }}</span>
                  </div>
                  <button class="btn-remove" (click)="removeFileAt($index)" title="Quitar archivo">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              }
            </div>
          }

          @if (uploading() || ocrProcessing()) {
            <div class="progress-bar">
              <div class="progress-fill" [class.indeterminate]="true"></div>
            </div>
            <p class="progress-text">
              {{ ocrProcessing() ? 'Leyendo datos con IA' : 'Subiendo archivos' }}
              ({{ processedCount() }} / {{ selectedFiles().length }})
            </p>
          }

          <div class="step-actions">
            <button class="btn-secondary" (click)="onClose()">Cancelar</button>
            <button class="btn-secondary" (click)="manualEntry()" [disabled]="uploading() || ocrProcessing()" title="Crear factura sin adjuntar archivo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Carga manual
            </button>
            <button class="btn-secondary" (click)="uploadOnly()" [disabled]="selectedFiles().length === 0 || uploading() || ocrProcessing()">
              Solo subir
            </button>
            <button class="btn-primary" (click)="uploadWithOcr()" [disabled]="selectedFiles().length === 0 || uploading() || ocrProcessing()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              Subir y leer datos
            </button>
          </div>
        </div>
      }

      <!-- Step 1: Datos de las facturas -->
      @if (currentStep() === 1 && currentDraft()) {
        <div class="step-content">
          <div class="draft-nav">
            <button class="btn-icon" (click)="prevDraft()" [disabled]="currentIndex() === 0" title="Anterior">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="draft-pos">
              <strong>Factura {{ currentIndex() + 1 }} de {{ drafts().length }}</strong>
              <span class="draft-file">{{ currentDraft()!.archivoNombre || currentDraft()!.file?.name || 'Sin archivo (carga manual)' }}</span>
            </div>
            <button class="btn-icon" (click)="nextDraft()" [disabled]="currentIndex() === drafts().length - 1" title="Siguiente">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <div class="draft-chips">
            @for (d of drafts(); track $index) {
              <button
                class="chip"
                [class.active]="$index === currentIndex()"
                [class.valid]="isDraftValid(d)"
                [class.invalid]="!isDraftValid(d)"
                (click)="goToDraft($index)"
                [title]="d.file?.name || 'Carga manual'"
              >
                {{ $index + 1 }}
              </button>
            }
          </div>

          @if (currentDraft()!.ocrData) {
            <div class="ocr-notice card-glass">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>Campos pre-llenados por OCR. Revisa y corrige si es necesario.</span>
            </div>
          }

          <div class="form-grid">
            <div class="form-group">
              <label>Numero <span class="required">*</span></label>
              <input type="text" [(ngModel)]="currentDraft()!.numero" placeholder="FC-A-0001-00001234" [class.ocr-filled]="currentDraft()!.ocrData?.numero" />
            </div>
            <div class="form-group">
              <label>Tipo <span class="required">*</span></label>
              <select [(ngModel)]="currentDraft()!.tipo" [class.ocr-filled]="currentDraft()!.ocrData?.tipo">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="M">M</option>
                <option value="E">E</option>
              </select>
            </div>
            <div class="form-group">
              <label>Fecha <span class="required">*</span></label>
              <input type="date" [(ngModel)]="currentDraft()!.fecha" [class.ocr-filled]="currentDraft()!.ocrData?.fecha" />
            </div>
            <div class="form-group">
              <label>Fecha Vencimiento</label>
              <input type="date" [(ngModel)]="currentDraft()!.fechaVencimiento" [class.ocr-filled]="currentDraft()!.ocrData?.fechaVencimiento" />
            </div>
          </div>

          <div class="form-grid" style="margin-top: 0.75rem">
            <div class="form-group">
              <label>Monto Neto <span class="required">*</span></label>
              <input appNumberFormat [decimals]="2" [(ngModel)]="currentDraft()!.montoNeto" min="0" [class.ocr-filled]="currentDraft()!.ocrData?.montoNeto" />
            </div>
            <div class="form-group">
              <label>IVA</label>
              <input appNumberFormat [decimals]="2" [(ngModel)]="currentDraft()!.montoIva" min="0" [class.ocr-filled]="currentDraft()!.ocrData?.montoIva" />
            </div>
            <div class="form-group">
              <label>Monto Total <span class="required">*</span></label>
              <input appNumberFormat [decimals]="2" [(ngModel)]="currentDraft()!.montoTotal" min="0" [class.ocr-filled]="currentDraft()!.ocrData?.montoTotal" />
            </div>
          </div>

          <div class="form-grid" style="margin-top: 0.75rem">
            <div class="form-group">
              <label>Empresa del Grupo <span class="required">*</span></label>
              <select [(ngModel)]="currentDraft()!.empresaClienteId">
                <option value="">Seleccionar...</option>
                @for (e of clientes(); track e._id) {
                  <option [value]="e._id">{{ e.razonSocial }} ({{ e.cuit }})</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Empresa Proveedora <span class="required">*</span></label>
              <select [(ngModel)]="currentDraft()!.empresaProveedoraId">
                <option value="">Seleccionar...</option>
                @for (e of proveedores(); track e._id) {
                  <option [value]="e._id">{{ e.razonSocial }} ({{ e.cuit }})</option>
                }
              </select>
            </div>
          </div>

          <div class="bulk-actions-row">
            <button class="btn-link" (click)="applyEmpresasToAll()" [disabled]="!currentDraft()!.empresaClienteId && !currentDraft()!.empresaProveedoraId">
              Aplicar empresas a todas las facturas
            </button>
          </div>

          <div class="step-actions">
            <button class="btn-secondary" (click)="currentStep.set(0)">Atras</button>
            <button class="btn-primary" (click)="submitAll()" [disabled]="submitting() || !allValid()">
              @if (submitting()) { <span class="spinner"></span> }
              Crear {{ drafts().length }} factura{{ drafts().length === 1 ? '' : 's' }}
            </button>
          </div>
        </div>
      }

      <!-- Step 2: Resultado -->
      @if (currentStep() === 2) {
        <div class="step-content result-step">
          @if (createdCount() > 0 && errorCount() === 0) {
            <div class="result-icon success">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3>{{ createdCount() }} factura{{ createdCount() === 1 ? '' : 's' }} creada{{ createdCount() === 1 ? '' : 's' }} correctamente</h3>
          } @else if (createdCount() > 0 && errorCount() > 0) {
            <div class="result-icon partial">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3>Resultado parcial</h3>
            <p class="result-msg">{{ createdCount() }} creadas, {{ errorCount() }} con error</p>
          } @else {
            <div class="result-icon error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h3>No se pudo crear ninguna factura</h3>
          }

          @if (apocrifosCount() > 0) {
            <div class="apocrifo-banner">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div>
                <strong>{{ apocrifosCount() }} factura{{ apocrifosCount() === 1 ? '' : 's' }} rechazada{{ apocrifosCount() === 1 ? '' : 's' }} por proveedor apócrifo</strong>
                <p>El CUIT figura en la base de facturas apócrifas de AFIP. La factura no puede registrarse contra este proveedor.</p>
              </div>
            </div>
          }

          @if (errorCount() > 0) {
            <div class="error-list">
              @for (d of drafts(); track $index) {
                @if (d.submitStatus === 'error') {
                  <div class="error-item card-glass" [class.error-apocrifo]="isApocrifoError(d.errorMsg)">
                    <div class="error-item-header">
                      @if (isApocrifoError(d.errorMsg)) {
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        <span class="error-tag">APÓCRIFO</span>
                      }
                      <strong>{{ d.file?.name || 'Carga manual #' + ($index + 1) }}</strong>
                    </div>
                    <span>{{ d.errorMsg }}</span>
                  </div>
                }
              }
            </div>
          }

          <div class="step-actions" style="justify-content: center">
            @if (errorCount() > 0) {
              <button class="btn-secondary" (click)="backToFix()">Corregir errores</button>
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
      padding: 2rem 1.5rem; border: 2px dashed var(--color-gray-300);
      border-radius: var(--radius-lg); cursor: pointer;
      transition: all var(--transition-fast); text-align: center;
    }
    .drop-zone:hover, .drop-zone.drag-over {
      border-color: var(--color-primary); background: rgba(99, 102, 241, 0.04);
    }
    .drop-text { margin-top: 0.75rem; font-size: 0.9375rem; color: var(--color-gray-600); }
    .drop-link { color: var(--color-primary); font-weight: 600; }
    .drop-hint { font-size: 0.75rem; color: var(--color-gray-400); margin-top: 0.25rem; }

    .file-list { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; max-height: 280px; overflow-y: auto; }
    .file-list-header {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 0.8125rem; color: var(--color-gray-600); padding: 0 0.25rem;
    }
    .file-row {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.625rem 0.875rem; border-radius: var(--radius-md);
    }
    .file-icon { flex-shrink: 0; }
    .file-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .file-name { font-size: 0.8125rem; font-weight: 600; color: var(--color-gray-900); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .file-size { font-size: 0.6875rem; color: var(--color-gray-500); }
    .btn-remove {
      background: none; border: none; color: var(--color-gray-400);
      cursor: pointer; padding: 0.25rem; border-radius: var(--radius-sm);
      transition: color var(--transition-fast);
    }
    .btn-remove:hover { color: var(--color-error); }
    .btn-link {
      background: none; border: none; color: var(--color-primary);
      cursor: pointer; font-size: 0.8125rem; font-weight: 500; padding: 0;
    }
    .btn-link:hover { text-decoration: underline; }
    .btn-link:disabled { color: var(--color-gray-400); cursor: not-allowed; text-decoration: none; }

    .progress-bar { height: 4px; background: var(--color-gray-200); border-radius: 2px; margin-top: 1rem; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--color-primary); border-radius: 2px; }
    .progress-fill.indeterminate { width: 40%; animation: indeterminate 1.5s ease-in-out infinite; }
    @keyframes indeterminate { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }
    .progress-text { font-size: 0.75rem; color: var(--color-gray-500); text-align: center; margin-top: 0.5rem; }

    .draft-nav {
      display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
      padding: 0.5rem 0.75rem; margin-bottom: 0.75rem;
      background: var(--glass-bg); border-radius: var(--radius-md);
    }
    .draft-pos { display: flex; flex-direction: column; align-items: center; gap: 0.125rem; flex: 1; min-width: 0; }
    .draft-pos strong { font-size: 0.875rem; color: var(--color-gray-900); }
    .draft-file { font-size: 0.6875rem; color: var(--color-gray-500); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
    .btn-icon {
      background: var(--color-gray-100); border: 1px solid var(--color-gray-200);
      color: var(--color-gray-700); cursor: pointer;
      width: 32px; height: 32px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      transition: all var(--transition-fast);
    }
    .btn-icon:hover:not(:disabled) { background: var(--color-primary); color: white; border-color: var(--color-primary); }
    .btn-icon:disabled { opacity: 0.4; cursor: not-allowed; }

    .draft-chips { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-bottom: 0.75rem; }
    .chip {
      width: 28px; height: 28px; border-radius: 50%;
      border: 1px solid var(--color-gray-300); background: transparent;
      font-size: 0.75rem; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all var(--transition-fast); color: var(--color-gray-600);
    }
    .chip.valid { border-color: var(--color-success); color: var(--color-success); }
    .chip.invalid { border-color: var(--color-warning); color: var(--color-warning); }
    .chip.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }

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

    .bulk-actions-row { display: flex; justify-content: flex-end; margin-top: 0.5rem; }

    .step-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; }
    .step-actions .btn-primary, .step-actions .btn-secondary { padding: 0.625rem 1.5rem; font-size: 0.875rem; }

    .result-step { text-align: center; align-items: center; padding: 1rem 0; }
    .result-icon { margin-bottom: 1rem; }
    .result-step h3 { font-size: 1.125rem; font-weight: 700; color: var(--color-gray-900); }
    .result-msg { font-size: 0.875rem; color: var(--color-gray-500); margin-top: 0.5rem; }
    .error-list { display: flex; flex-direction: column; gap: 0.5rem; margin: 1rem 0; width: 100%; max-width: 480px; }
    .error-item {
      display: flex; flex-direction: column; gap: 0.125rem;
      padding: 0.625rem 0.875rem; text-align: left;
      border-left: 3px solid var(--color-error);
    }
    .error-item strong { font-size: 0.8125rem; color: var(--color-gray-900); }
    .error-item span { font-size: 0.75rem; color: var(--color-error); }
    .error-item-header { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.25rem; }
    .error-tag {
      font-size: 0.625rem; font-weight: 700; letter-spacing: 0.05em;
      color: var(--color-error); background: color-mix(in srgb, var(--color-error) 14%, transparent);
      padding: 0.125rem 0.375rem; border-radius: var(--radius-sm);
    }
    .error-apocrifo { border-left-width: 4px; background: color-mix(in srgb, var(--color-error) 6%, transparent); }
    .apocrifo-banner {
      display: flex; align-items: flex-start; gap: 0.625rem;
      padding: 0.875rem 1rem; margin: 1rem 0;
      background: color-mix(in srgb, var(--color-error) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-error) 30%, transparent);
      border-radius: var(--radius-md);
      color: var(--color-error);
      width: 100%; max-width: 480px; text-align: left;
    }
    .apocrifo-banner svg { flex-shrink: 0; margin-top: 2px; }
    .apocrifo-banner strong { display: block; font-size: 0.875rem; }
    .apocrifo-banner p { font-size: 0.75rem; margin-top: 0.25rem; color: var(--color-gray-700); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadFacturaModalComponent implements OnChanges {
  open = input(false);
  close = output<void>();
  saved = output<void>();

  currentStep = signal(0);
  selectedFiles = signal<File[]>([]);
  dragOver = signal(false);
  uploading = signal(false);
  ocrProcessing = signal(false);
  processedCount = signal(0);
  submitting = signal(false);

  drafts = signal<FacturaDraft[]>([]);
  currentIndex = signal(0);
  currentDraft = computed(() => this.drafts()[this.currentIndex()] ?? null);

  proveedores = signal<EmpresaProveedora[]>([]);
  clientes = signal<EmpresaCliente[]>([]);

  stepTitles = ['Subir Facturas', 'Datos de las Facturas', 'Resultado'];

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
    const files = e.dataTransfer?.files;
    if (files) this.addFiles(Array.from(files));
  }

  onFileSelected(e: Event) {
    const files = (e.target as HTMLInputElement).files;
    if (files) this.addFiles(Array.from(files));
    (e.target as HTMLInputElement).value = '';
  }

  addFiles(files: File[]) {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    const valid: File[] = [];
    for (const file of files) {
      if (!allowed.includes(file.type)) {
        this.toast.error(`${file.name}: tipo no permitido`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        this.toast.error(`${file.name}: excede 10MB`);
        continue;
      }
      valid.push(file);
    }
    if (valid.length) this.selectedFiles.update(curr => [...curr, ...valid]);
  }

  removeFileAt(index: number) {
    this.selectedFiles.update(curr => curr.filter((_, i) => i !== index));
  }

  clearFiles() { this.selectedFiles.set([]); }

  uploadOnly() {
    const files = this.selectedFiles();
    if (!files.length) return;
    this.uploading.set(true);
    this.processedCount.set(0);
    const calls = files.map(file =>
      this.facturaService.uploadFile(file).pipe(
        map(res => ({ file, ...res, ocrData: null as OcrExtractedData | null })),
        catchError(err => {
          this.toast.error(`${file.name}: ${err.error?.message || 'error al subir'}`);
          return of(null);
        }),
      ),
    );
    forkJoin(calls).subscribe(results => {
      const drafts: FacturaDraft[] = [];
      results.forEach(r => {
        if (r) drafts.push(this.makeDraft(r.file, r.archivoUrl, r.archivoKey, r.archivoNombre, null));
      });
      this.uploading.set(false);
      if (drafts.length === 0) return;
      this.drafts.set(drafts);
      this.currentIndex.set(0);
      this.currentStep.set(1);
    });
  }

  uploadWithOcr() {
    const files = this.selectedFiles();
    if (!files.length) return;
    this.uploading.set(true);
    this.ocrProcessing.set(true);
    this.processedCount.set(0);
    const calls = files.map(file =>
      this.facturaService.uploadAndOcr(file).pipe(
        map(res => ({ file, ...res })),
        catchError(err => {
          this.toast.error(`${file.name}: ${err.error?.message || 'error al procesar'}`);
          return of(null);
        }),
      ),
    );
    forkJoin(calls).subscribe(results => {
      const drafts: FacturaDraft[] = [];
      results.forEach(r => {
        if (r) drafts.push(this.makeDraft(r.file, r.archivoUrl, r.archivoKey, r.archivoNombre, r.ocrData));
      });
      this.uploading.set(false);
      this.ocrProcessing.set(false);
      if (drafts.length === 0) return;
      this.drafts.set(drafts);
      this.currentIndex.set(0);
      this.currentStep.set(1);
    });
  }

  manualEntry() {
    const draft = this.makeDraft(null, '', '', '', null);
    this.drafts.set([draft]);
    this.currentIndex.set(0);
    this.currentStep.set(1);
  }

  makeDraft(file: File | null, archivoUrl: string, archivoKey: string, archivoNombre: string, ocr: OcrExtractedData | null): FacturaDraft {
    const draft: FacturaDraft = {
      file,
      archivoUrl,
      archivoKey,
      archivoNombre,
      ocrData: ocr,
      numero: ocr?.numero ?? '',
      tipo: ocr?.tipo ?? 'A',
      fecha: ocr?.fecha ?? '',
      fechaVencimiento: ocr?.fechaVencimiento ?? '',
      montoNeto: ocr?.montoNeto ?? 0,
      montoIva: ocr?.montoIva ?? 0,
      montoTotal: ocr?.montoTotal ?? 0,
      empresaProveedoraId: '',
      empresaClienteId: '',
      submitStatus: 'idle',
      errorMsg: '',
    };
    if (ocr?.cuitProveedor) {
      const match = this.proveedores().find(p => p.cuit === ocr.cuitProveedor);
      if (match) draft.empresaProveedoraId = match._id;
    }
    if (ocr?.cuitCliente) {
      const match = this.clientes().find(c => c.cuit === ocr.cuitCliente);
      if (match) draft.empresaClienteId = match._id;
    }
    return draft;
  }

  prevDraft() { if (this.currentIndex() > 0) this.currentIndex.update(i => i - 1); }
  nextDraft() { if (this.currentIndex() < this.drafts().length - 1) this.currentIndex.update(i => i + 1); }
  goToDraft(i: number) { this.currentIndex.set(i); }

  isDraftValid(d: FacturaDraft): boolean {
    return !!d.numero && !!d.tipo && !!d.fecha && d.montoNeto > 0 && d.montoTotal > 0 && !!d.empresaProveedoraId && !!d.empresaClienteId;
  }

  allValid(): boolean {
    return this.drafts().length > 0 && this.drafts().every(d => this.isDraftValid(d));
  }

  applyEmpresasToAll() {
    const cur = this.currentDraft();
    if (!cur) return;
    this.drafts.update(list => list.map(d => ({
      ...d,
      empresaClienteId: cur.empresaClienteId || d.empresaClienteId,
      empresaProveedoraId: cur.empresaProveedoraId || d.empresaProveedoraId,
    })));
    this.toast.success('Empresas aplicadas a todas las facturas');
  }

  submitAll() {
    if (!this.allValid()) return;
    this.submitting.set(true);
    const calls = this.drafts().map((d, idx) => {
      const payload: any = {
        numero: d.numero,
        tipo: d.tipo,
        fecha: d.fecha,
        montoNeto: d.montoNeto,
        montoIva: d.montoIva || 0,
        montoTotal: d.montoTotal,
        empresaProveedora: d.empresaProveedoraId,
        empresaCliente: d.empresaClienteId,
      };
      if (d.fechaVencimiento) payload.fechaVencimiento = d.fechaVencimiento;
      if (d.archivoUrl) payload.archivoUrl = d.archivoUrl;
      if (d.archivoKey) payload.archivoKey = d.archivoKey;
      if (d.archivoNombre) payload.archivoNombre = d.archivoNombre;

      return this.facturaService.create(payload).pipe(
        map(() => ({ idx, ok: true, msg: '' })),
        catchError(err => of({ idx, ok: false, msg: err.error?.message || 'Error desconocido' })),
      );
    });
    forkJoin(calls).subscribe(results => {
      this.drafts.update(list => list.map((d, i) => {
        const r = results.find(x => x.idx === i);
        if (!r) return d;
        return { ...d, submitStatus: r.ok ? 'created' : 'error', errorMsg: r.msg };
      }));
      this.submitting.set(false);
      this.currentStep.set(2);
    });
  }

  createdCount = computed(() => this.drafts().filter(d => d.submitStatus === 'created').length);
  errorCount = computed(() => this.drafts().filter(d => d.submitStatus === 'error').length);
  apocrifosCount = computed(() => this.drafts().filter(d => d.submitStatus === 'error' && this.isApocrifoError(d.errorMsg)).length);

  isApocrifoError(msg: string): boolean {
    return /apócrif|apocrif/i.test(msg || '');
  }

  backToFix() {
    const errs = this.drafts().filter(d => d.submitStatus === 'error');
    this.drafts.set(errs.map(d => ({ ...d, submitStatus: 'idle', errorMsg: '' })));
    this.currentIndex.set(0);
    this.currentStep.set(1);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  onClose() {
    if (this.createdCount() > 0) this.saved.emit();
    this.close.emit();
  }

  reset() {
    this.currentStep.set(0);
    this.selectedFiles.set([]);
    this.dragOver.set(false);
    this.uploading.set(false);
    this.ocrProcessing.set(false);
    this.processedCount.set(0);
    this.submitting.set(false);
    this.drafts.set([]);
    this.currentIndex.set(0);
  }
}
