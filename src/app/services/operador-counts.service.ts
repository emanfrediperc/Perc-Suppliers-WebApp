import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../environments/environment';

export interface OperadorCounts {
  ordenesPago: number;
  pagos: number;
  prestamos: number;
  comprasFx: number;
  total: number;
}

const EMPTY: OperadorCounts = {
  ordenesPago: 0,
  pagos: 0,
  prestamos: 0,
  comprasFx: 0,
  total: 0,
};

@Injectable({ providedIn: 'root' })
export class OperadorCountsService {
  private url = `${environment.apiUrl}/dashboard/operador-counts`;
  private destroyRef = inject(DestroyRef);
  private _counts = signal<OperadorCounts>(EMPTY);

  counts = this._counts.asReadonly();

  constructor(private http: HttpClient) {}

  load() {
    this.http.get<OperadorCounts>(this.url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => this._counts.set(res),
        error: () => this._counts.set(EMPTY),
      });
  }

  reset() {
    this._counts.set(EMPTY);
  }
}
