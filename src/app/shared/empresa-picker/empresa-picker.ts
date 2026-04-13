import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { PrestamosService } from '../../services/prestamos.service';
import type { EmpresaRef, EmpresaSearchResult } from '../../models/prestamo';

@Component({
  selector: 'app-empresa-picker',
  standalone: true,
  template: `
    <div class="picker">
      @if (label()) {
        <label class="picker-label">{{ label() }}</label>
      }
      @if (selected(); as sel) {
        <div class="selected-chip">
          <span
            class="kind-badge"
            [class.cliente]="sel.empresaKind === 'cliente'"
            [class.proveedora]="sel.empresaKind === 'proveedora'"
          >
            {{ sel.empresaKind === 'cliente' ? 'Cliente' : 'Proveedora' }}
          </span>
          <span class="selected-name">{{ sel.razonSocialCache }}</span>
          <button type="button" class="clear-btn" (click)="onClear()" [attr.aria-label]="'Limpiar'">✕</button>
        </div>
      } @else {
        <div class="input-wrapper">
          <input
            type="text"
            [value]="query()"
            (input)="onQueryChange($any($event.target).value)"
            (focus)="onFocus()"
            [placeholder]="placeholder()"
            autocomplete="off"
          />
          @if (showDropdown()) {
            <div class="dropdown">
              @if (loading()) {
                <div class="dropdown-status">Buscando...</div>
              } @else if (query().length < 2) {
                <div class="dropdown-status">Escribí al menos 2 caracteres</div>
              } @else if (results().length === 0) {
                <div class="dropdown-status">Sin resultados</div>
              } @else {
                @for (r of results(); track r.id) {
                  <button type="button" class="dropdown-item" (click)="onSelect(r)">
                    <span
                      class="kind-badge"
                      [class.cliente]="r.kind === 'cliente'"
                      [class.proveedora]="r.kind === 'proveedora'"
                    >
                      {{ r.kind === 'cliente' ? 'C' : 'P' }}
                    </span>
                    <span class="item-name">{{ r.razonSocial }}</span>
                    <span class="item-cuit">{{ r.cuit }}</span>
                  </button>
                }
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .picker {
        position: relative;
      }
      .picker-label {
        display: block;
        font-size: 0.6875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-gray-500);
        font-weight: 600;
        margin-bottom: 0.375rem;
      }
      .input-wrapper {
        position: relative;
      }
      .input-wrapper input {
        width: 100%;
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--color-gray-200);
        border-radius: var(--radius-sm);
        background: var(--color-white);
        color: var(--color-gray-900);
        font-size: 0.875rem;
        transition: border-color 0.2s;
      }
      .input-wrapper input:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }
      .dropdown {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: var(--color-white);
        border: 1px solid var(--color-gray-200);
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-lg);
        max-height: 280px;
        overflow-y: auto;
        z-index: 100;
      }
      .dropdown-status {
        padding: 0.75rem 1rem;
        color: var(--color-gray-500);
        font-size: 0.8125rem;
      }
      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        width: 100%;
        padding: 0.625rem 0.875rem;
        background: none;
        border: none;
        border-bottom: 1px solid var(--color-gray-100);
        text-align: left;
        cursor: pointer;
        font-size: 0.8125rem;
        color: var(--color-gray-900);
      }
      .dropdown-item:hover {
        background: var(--color-gray-50);
      }
      .dropdown-item:last-child {
        border-bottom: none;
      }
      .item-name {
        flex: 1;
        font-weight: 500;
      }
      .item-cuit {
        color: var(--color-gray-500);
        font-size: 0.6875rem;
        font-variant-numeric: tabular-nums;
      }
      .selected-chip {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--color-gray-200);
        border-radius: var(--radius-sm);
        background: var(--color-gray-50);
      }
      .selected-name {
        flex: 1;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-gray-900);
      }
      .clear-btn {
        background: none;
        border: none;
        color: var(--color-gray-400);
        cursor: pointer;
        padding: 0 0.25rem;
        font-size: 0.875rem;
        line-height: 1;
      }
      .clear-btn:hover {
        color: var(--color-error);
      }
      .kind-badge {
        display: inline-block;
        padding: 0.125rem 0.5rem;
        border-radius: var(--radius-full);
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        white-space: nowrap;
      }
      .kind-badge.cliente {
        background: rgba(34, 197, 94, 0.15);
        color: var(--color-success);
      }
      .kind-badge.proveedora {
        background: rgba(59, 130, 246, 0.15);
        color: var(--color-info);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaPickerComponent {
  private service = inject(PrestamosService);
  private elementRef = inject(ElementRef);
  private destroyRef = inject(DestroyRef);

  label = input<string>('Empresa');
  placeholder = input<string>('Buscar empresa por razón social...');
  selected = model<EmpresaRef | null>(null);

  query = signal('');
  results = signal<EmpresaSearchResult[]>([]);
  showDropdown = signal(false);
  loading = signal(false);

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((q) => {
          if (q.length >= 2) this.loading.set(true);
          else this.loading.set(false);
        }),
        switchMap((q) => {
          if (q.length < 2) return of([]);
          return this.service.searchEmpresas(q);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((results) => {
        this.results.set(results);
        this.loading.set(false);
      });
  }

  onQueryChange(value: string) {
    this.query.set(value);
    this.showDropdown.set(true);
    this.searchSubject.next(value);
  }

  onFocus() {
    if (this.query().length >= 2 || this.results().length > 0) {
      this.showDropdown.set(true);
    }
  }

  onSelect(result: EmpresaSearchResult) {
    this.selected.set({
      empresaId: result.id,
      empresaKind: result.kind,
      razonSocialCache: result.razonSocial,
    });
    this.query.set('');
    this.results.set([]);
    this.showDropdown.set(false);
  }

  onClear() {
    this.selected.set(null);
    this.query.set('');
    this.results.set([]);
    this.showDropdown.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown.set(false);
    }
  }
}
