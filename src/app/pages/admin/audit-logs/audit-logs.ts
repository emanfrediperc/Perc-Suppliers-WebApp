import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService, AuditLog } from '../../../services/audit-log.service';
import { ExportService } from '../../../services/export.service';
import { PaginationComponent } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [DatePipe, FormsModule, PaginationComponent],
  template: `
    <div class="page">
      <div class="header-row">
        <h1>Audit Logs</h1>
        <button class="btn-export" (click)="exportar('xlsx')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar Excel
        </button>
      </div>
      <div class="filters">
        <select [(ngModel)]="filterEntidad" (ngModelChange)="load()">
          <option value="">Todas las entidades</option>
          <option value="ordenes-pago">Ordenes de Pago</option>
          <option value="facturas">Facturas</option>
          <option value="pagos">Pagos</option>
          <option value="convenios">Productores</option>
          <option value="empresas-proveedoras">Empresas Proveedoras</option>
          <option value="auth">Auth</option>
        </select>
        <select [(ngModel)]="filterAccion" (ngModelChange)="load()">
          <option value="">Todas las acciones</option>
          <option value="crear">Crear</option>
          <option value="editar">Editar</option>
          <option value="pagar">Pagar</option>
          <option value="anular">Anular</option>
          <option value="sync">Sync</option>
        </select>
      </div>
      <div class="table-wrapper">
        <table class="glass-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Accion</th>
              <th>Entidad</th>
              <th>Descripcion</th>
            </tr>
          </thead>
          <tbody>
            @for (log of logs(); track log._id) {
              <tr>
                <td class="date-cell">{{ log.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                <td>{{ log.usuarioEmail }}</td>
                <td><span class="action-pill" [attr.data-action]="log.accion">{{ log.accion }}</span></td>
                <td>{{ log.entidad }}</td>
                <td class="desc-cell">{{ log.descripcion }}</td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="empty">No hay registros</td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination
        [currentPage]="page()"
        [totalPages]="totalPages()"
        [totalItems]="totalItems()"
        [pageSize]="pageSize"
        (pageChange)="goToPage($event)"
      />
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    h1 { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .btn-export {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.5rem 0.875rem; border: 1px solid var(--color-gray-200);
      border-radius: 8px; background: var(--card-bg); color: var(--color-gray-700);
      font-size: 0.8125rem; font-weight: 500; cursor: pointer;
    }
    .btn-export:hover { background: var(--glass-bg); border-color: var(--color-primary); color: var(--color-primary); }
    .filters { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
    .filters select {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      background: var(--card-bg);
      color: var(--text-primary);
      font-size: 0.8125rem;
    }
    .table-wrapper {
      background: var(--card-bg);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      overflow: hidden;
    }
    .glass-table { width: 100%; border-collapse: collapse; }
    .glass-table th {
      text-align: left;
      padding: 0.875rem 1rem;
      background: var(--glass-bg);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .glass-table td {
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--glass-border);
      font-size: 0.8125rem;
      color: var(--text-primary);
    }
    .date-cell { white-space: nowrap; font-size: 0.75rem; color: var(--text-muted); }
    .desc-cell { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .action-pill {
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      background: var(--glass-bg);
      color: var(--text-secondary);
      text-transform: uppercase;
    }
    .action-pill[data-action="crear"] { background: #dbeafe; color: #1e40af; }
    .action-pill[data-action="editar"] { background: #fef3c7; color: #92400e; }
    .action-pill[data-action="pagar"] { background: #d1fae5; color: #065f46; }
    .action-pill[data-action="anular"] { background: #fee2e2; color: #991b1b; }
    .empty { text-align: center; padding: 2rem; color: var(--text-muted); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogsComponent implements OnInit {
  logs = signal<AuditLog[]>([]);
  page = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  pageSize = 25;
  filterEntidad = '';
  filterAccion = '';

  constructor(
    private auditService: AuditLogService,
    private exportService: ExportService,
  ) {}

  ngOnInit() { this.load(); }

  exportar(formato: 'xlsx' | 'csv') {
    const params: Record<string, any> = {};
    if (this.filterEntidad) params['entidad'] = this.filterEntidad;
    if (this.filterAccion) params['accion'] = this.filterAccion;
    this.exportService.download('audit-logs/export', formato, params);
  }

  load() {
    const params: any = { page: this.page(), limit: this.pageSize };
    if (this.filterEntidad) params.entidad = this.filterEntidad;
    if (this.filterAccion) params.accion = this.filterAccion;
    this.auditService.getAll(params).subscribe(res => {
      this.logs.set(res.data);
      this.totalPages.set(res.totalPages || 1);
      this.totalItems.set((res as any).total ?? res.data.length);
    });
  }

  goToPage(p: number) {
    this.page.set(p);
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
