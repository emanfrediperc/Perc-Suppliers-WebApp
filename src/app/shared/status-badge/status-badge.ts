import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge" [class]="'bg-glass-' + colorMap[status()]">{{ labelMap[status()] || status() }}</span>`,
  styles: [`.badge { font-size: 0.75rem; font-weight: 500; padding: 0.25rem 0.75rem; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  status = input<string>('');
  colorMap: Record<string, string> = { pendiente: 'orange', parcial: 'blue', pagada: 'green', anulada: 'red', anulado: 'red', confirmado: 'green', rechazado: 'red', CONFIRMADA: 'green', SOLICITADA: 'orange', EJECUTADA: 'green', ANULADA: 'red', ACTIVE: 'green', CLEARED: 'blue', RENEWED: 'orange', esperando_aprobacion: 'orange', ESPERANDO_APROBACION: 'orange', RECHAZADO: 'red' };
  labelMap: Record<string, string> = { pendiente: 'Pendiente', parcial: 'Parcial', pagada: 'Pagada', anulada: 'Anulada', anulado: 'Anulado', confirmado: 'Confirmado', rechazado: 'Rechazado', CONFIRMADA: 'Confirmada', SOLICITADA: 'Solicitada', EJECUTADA: 'Ejecutada', ANULADA: 'Anulada', ACTIVE: 'Activo', CLEARED: 'Cancelado', RENEWED: 'Renovado', esperando_aprobacion: 'Esperando aprobación', ESPERANDO_APROBACION: 'Esperando aprobación', RECHAZADO: 'Rechazado' };
}
