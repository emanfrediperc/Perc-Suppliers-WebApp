import { Injectable, signal, inject, DestroyRef, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface IntegrationsStatus {
  afipPadron: { configured: boolean; env: string };
  apocrifos: { configured: boolean };
  email: { mode: 'resend' | 'smtp' | 'mock' };
  tsa: { enabled: boolean; url: string };
}

@Injectable({ providedIn: 'root' })
export class IntegrationsStatusService {
  private url = `${environment.apiUrl}/integrations/status`;
  private destroyRef = inject(DestroyRef);
  private _status = signal<IntegrationsStatus | null>(null);
  status = this._status.asReadonly();

  warnings = computed(() => {
    const s = this._status();
    if (!s) return [];
    const w: { key: string; label: string; detail: string }[] = [];
    if (!s.afipPadron.configured) {
      w.push({
        key: 'afip',
        label: 'AFIP Padrón A5',
        detail: 'Sin certificado WSAA. Las consultas de CUIT devuelven null y la validación de proveedor está desactivada.',
      });
    }
    if (!s.apocrifos.configured) {
      w.push({
        key: 'apocrifos',
        label: 'Apócrifos',
        detail: 'Sin TWOCAPTCHA_API_KEY. El bloqueo de facturas con CUIT apócrifo está desactivado — pueden entrar facturas que normalmente serían rechazadas.',
      });
    }
    if (s.email.mode === 'mock') {
      w.push({
        key: 'email',
        label: 'Emails',
        detail: 'En modo mock — no se envían emails reales. Configurá RESEND_API_KEY o SMTP en el backend.',
      });
    }
    return w;
  });

  constructor(private http: HttpClient) {}

  load() {
    this.http.get<IntegrationsStatus>(this.url).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (s) => this._status.set(s),
      error: () => this._status.set(null),
    });
  }
}
