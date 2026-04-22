import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';

type PageItem = number | 'ellipsis-left' | 'ellipsis-right';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (showPagination()) {
      <div class="pagination" role="navigation" aria-label="Paginación">
        <div class="page-left">
          @if (totalItems() > 0) {
            <span class="page-info" aria-live="polite">
              <span class="info-range">{{ fromIndex() }}–{{ toIndex() }}</span>
              <span class="info-sep">de</span>
              <span class="info-total">{{ totalItems() }}</span>
            </span>
          }
          @if (pageSizeOptions().length > 0) {
            <label class="page-size-group">
              <span class="page-size-label">por página</span>
              <select
                class="page-size-select"
                [value]="pageSize()"
                (change)="onPageSizeChange($event)"
                aria-label="Items por página"
              >
                @for (opt of pageSizeOptions(); track opt) {
                  <option [value]="opt">{{ opt }}</option>
                }
              </select>
            </label>
          }
        </div>


        <div class="page-controls">
          <button
            type="button"
            class="page-btn page-btn-nav"
            [disabled]="currentPage() <= 1"
            (click)="pageChange.emit(1)"
            aria-label="Primera página"
            title="Primera"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>
            </svg>
          </button>
          <button
            type="button"
            class="page-btn page-btn-nav"
            [disabled]="currentPage() <= 1"
            (click)="pageChange.emit(currentPage() - 1)"
            aria-label="Página anterior"
            title="Anterior"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          @for (p of pages(); track p) {
            @if (p === 'ellipsis-left' || p === 'ellipsis-right') {
              <span class="page-ellipsis">…</span>
            } @else {
              <button
                type="button"
                class="page-btn"
                [class.active]="p === currentPage()"
                [attr.aria-current]="p === currentPage() ? 'page' : null"
                (click)="pageChange.emit(p)"
              >
                {{ p }}
              </button>
            }
          }

          <button
            type="button"
            class="page-btn page-btn-nav"
            [disabled]="currentPage() >= totalPages()"
            (click)="pageChange.emit(currentPage() + 1)"
            aria-label="Página siguiente"
            title="Siguiente"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <button
            type="button"
            class="page-btn page-btn-nav"
            [disabled]="currentPage() >= totalPages()"
            (click)="pageChange.emit(totalPages())"
            aria-label="Última página"
            title="Última"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/>
            </svg>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1rem;
      padding: 0.625rem 0;
    }

    .page-left {
      display: inline-flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .page-size-group {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--color-gray-500);
    }
    .page-size-label { line-height: 1; }
    .page-size-select {
      appearance: none;
      -webkit-appearance: none;
      padding: 0.25rem 1.75rem 0.25rem 0.625rem;
      border: 1px solid var(--glass-border);
      border-radius: 999px;
      background:
        linear-gradient(45deg, transparent 50%, var(--color-gray-500) 50%) calc(100% - 13px) calc(50% - 2px) / 5px 5px no-repeat,
        linear-gradient(135deg, var(--color-gray-500) 50%, transparent 50%) calc(100% - 8px) calc(50% - 2px) / 5px 5px no-repeat,
        var(--glass-bg);
      color: var(--color-gray-900);
      font-size: 0.8125rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      line-height: 1.25;
      backdrop-filter: blur(10px);
      transition: border-color var(--transition-fast);
    }
    .page-size-select:hover { border-color: var(--color-gray-300); }
    .page-size-select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
    }

    .page-info {
      font-size: 0.8125rem;
      color: var(--color-gray-500);
      display: inline-flex;
      align-items: baseline;
      gap: 0.375rem;
      line-height: 1;
    }
    .page-info .info-range {
      color: var(--color-gray-900);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .page-info .info-sep { color: var(--color-gray-400); }
    .page-info .info-total {
      color: var(--color-gray-700);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .page-controls {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      margin-left: auto;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 999px;
      padding: 3px;
      backdrop-filter: blur(10px);
    }

    .page-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 30px;
      height: 30px;
      padding: 0 10px;
      border: none;
      border-radius: 999px;
      background: transparent;
      color: var(--color-gray-700);
      font-size: 0.8125rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      transition: background var(--transition-fast), color var(--transition-fast), transform 0.08s ease;
    }
    .page-btn:hover:not(:disabled):not(.active) {
      background: var(--glass-hover-bg);
      color: var(--color-gray-900);
    }
    .page-btn:active:not(:disabled):not(.active) { transform: scale(0.96); }
    .page-btn.active {
      background: var(--color-primary);
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(99, 102, 241, 0.35);
    }
    .page-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .page-btn-nav { padding: 0 8px; color: var(--color-gray-500); }
    .page-btn-nav:hover:not(:disabled) { color: var(--color-gray-900); }

    .page-ellipsis {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      color: var(--color-gray-400);
      font-size: 0.875rem;
      letter-spacing: 1px;
      user-select: none;
    }

    @media (max-width: 520px) {
      .pagination { flex-direction: column-reverse; align-items: stretch; gap: 0.5rem; }
      .page-controls { align-self: center; }
      .page-info { align-self: center; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  currentPage = input(1);
  totalPages = input(1);
  /** Si se pasa, se muestra "X–Y de Z" a la izquierda. */
  totalItems = input(0);
  /** Necesario para calcular el rango X–Y cuando se muestra `totalItems`. */
  pageSize = input(5);
  /**
   * Opciones para el selector de items por página. Pasá `[]` para ocultarlo.
   * Default: [5, 10, 20, 50, 100].
   */
  pageSizeOptions = input<number[]>([5, 10, 20, 50, 100]);

  pageChange = output<number>();
  pageSizeChange = output<number>();

  showPagination = computed(() => this.totalPages() > 1 || this.totalItems() > 0);

  onPageSizeChange(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    if (!Number.isNaN(value) && value > 0) {
      this.pageSizeChange.emit(value);
    }
  }

  fromIndex = computed(() => {
    if (this.totalItems() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  toIndex = computed(() => {
    const t = this.totalItems();
    if (t === 0) return 0;
    return Math.min(this.currentPage() * this.pageSize(), t);
  });

  /**
   * Genera la lista de páginas a mostrar con ellipsis en bordes:
   * 1 ... 4 5 [6] 7 8 ... 20
   */
  pages = computed<PageItem[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const window = 1; // páginas a cada lado de la actual
    const start = Math.max(2, current - window);
    const end = Math.min(total - 1, current + window);

    const items: PageItem[] = [1];
    if (start > 2) items.push('ellipsis-left');
    for (let i = start; i <= end; i++) items.push(i);
    if (end < total - 1) items.push('ellipsis-right');
    items.push(total);
    return items;
  });
}
