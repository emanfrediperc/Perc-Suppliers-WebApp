import { Component, signal, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { BusquedaService, SearchResults } from '../../services/busqueda.service';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="global-search">
      <div class="search-input-wrapper">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text"
          placeholder="Buscar ordenes, facturas, empresas..."
          [ngModel]="query()"
          (ngModelChange)="onQueryChange($event)"
          (focus)="onFocus()"
          (keydown.escape)="close()"
          class="search-input"
        />
        @if (query()) {
          <button class="clear-btn" (click)="clear()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        }
      </div>

      @if (showResults()) {
        <div class="search-results">
          @if (loading()) {
            <div class="search-status">Buscando...</div>
          } @else if (noResults()) {
            <div class="search-status">Sin resultados para "{{ query() }}"</div>
          } @else {
            @if (results()?.ordenes?.length) {
              <div class="result-group">
                <div class="group-label">Ordenes de Pago</div>
                @for (o of results()!.ordenes; track o._id) {
                  <div class="result-item" (click)="goTo('/ordenes-pago', o._id)">
                    <span class="result-main">{{ o.numero }}</span>
                    <span class="result-sub">{{ o.empresaProveedora?.razonSocial }}</span>
                  </div>
                }
              </div>
            }
            @if (results()?.facturas?.length) {
              <div class="result-group">
                <div class="group-label">Facturas</div>
                @for (f of results()!.facturas; track f._id) {
                  <div class="result-item" (click)="goTo('/facturas', f._id)">
                    <span class="result-main">{{ f.numero }} ({{ f.tipo }})</span>
                    <span class="result-sub">{{ f.empresaProveedora?.razonSocial }}</span>
                  </div>
                }
              </div>
            }
            @if (results()?.proveedores?.length) {
              <div class="result-group">
                <div class="group-label">Proveedores</div>
                @for (p of results()!.proveedores; track p._id) {
                  <div class="result-item" (click)="goTo('/empresas-proveedoras', p._id)">
                    <span class="result-main">{{ p.razonSocial }}</span>
                    <span class="result-sub">{{ p.cuit }}</span>
                  </div>
                }
              </div>
            }
            @if (results()?.clientes?.length) {
              <div class="result-group">
                <div class="group-label">Clientes</div>
                @for (c of results()!.clientes; track c._id) {
                  <div class="result-item" (click)="goTo('/empresas-clientes', c._id)">
                    <span class="result-main">{{ c.razonSocial }}</span>
                    <span class="result-sub">{{ c.cuit }}</span>
                  </div>
                }
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .global-search { position: relative; width: 400px; margin-left: auto; }
    .search-input-wrapper {
      display: flex; align-items: center; gap: 0.625rem;
      padding: 0.625rem 1rem;
      background: var(--glass-bg); backdrop-filter: blur(10px);
      border: 1px solid var(--color-gray-200); border-radius: var(--radius-md);
    }
    .search-input-wrapper svg { color: var(--color-gray-400); flex-shrink: 0; }
    .search-input {
      flex: 1; background: transparent; border: none; outline: none;
      font-size: 1rem; color: var(--color-gray-700);
    }
    .search-input::placeholder { color: var(--color-gray-400); }
    .clear-btn { background: none; border: none; cursor: pointer; color: var(--color-gray-400); padding: 2px; display: flex; }
    .clear-btn:hover { color: var(--color-gray-600); }
    .search-results {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 1000;
      background: var(--glass-bg, white); backdrop-filter: blur(20px);
      border: 1px solid var(--color-gray-200); border-radius: var(--radius-md);
      box-shadow: 0 10px 40px rgba(0,0,0,0.12); max-height: 400px; overflow-y: auto;
    }
    .search-status { padding: 1rem; text-align: center; color: var(--color-gray-400); font-size: 0.875rem; }
    .result-group { padding: 0.25rem 0; }
    .result-group + .result-group { border-top: 1px solid var(--color-gray-100); }
    .group-label {
      padding: 0.375rem 0.75rem; font-size: 0.6875rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-gray-400);
    }
    .result-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.5rem 0.75rem; cursor: pointer; transition: background 0.15s;
    }
    .result-item:hover { background: var(--color-gray-50, rgba(0,0,0,0.03)); }
    .result-main { font-size: 0.875rem; font-weight: 500; color: var(--color-gray-900); }
    .result-sub { font-size: 0.75rem; color: var(--color-gray-500); }
  `],
})
export class GlobalSearchComponent {
  query = signal('');
  results = signal<SearchResults | null>(null);
  loading = signal(false);
  showResults = signal(false);
  noResults = signal(false);

  private searchSubject = new Subject<string>();

  constructor(
    private busquedaService: BusquedaService,
    private router: Router,
    private elRef: ElementRef,
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) {
          this.showResults.set(false);
          return of(null);
        }
        this.loading.set(true);
        this.showResults.set(true);
        return this.busquedaService.search(q);
      }),
    ).subscribe(res => {
      this.loading.set(false);
      if (res) {
        this.results.set(res);
        const total = (res.ordenes?.length || 0) + (res.facturas?.length || 0) +
          (res.proveedores?.length || 0) + (res.clientes?.length || 0);
        this.noResults.set(total === 0);
      }
    });
  }

  onQueryChange(value: string) {
    this.query.set(value);
    this.searchSubject.next(value);
  }

  onFocus() {
    if (this.query().length >= 2 && this.results()) {
      this.showResults.set(true);
    }
  }

  close() {
    this.showResults.set(false);
  }

  clear() {
    this.query.set('');
    this.showResults.set(false);
    this.results.set(null);
  }

  goTo(path: string, id: string) {
    this.close();
    this.router.navigate([path, id]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}
