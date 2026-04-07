import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { EmpresaClienteService } from '../../../services/empresa-cliente.service';
import { FacturaService } from '../../../services/factura.service';
import { EmpresaCliente, Factura } from '../../../models';
import { PageHeaderComponent } from '../../../shared/page-header/page-header';
import { GlassCardComponent } from '../../../shared/glass-card/glass-card';
import { GlassTableComponent, TableColumn } from '../../../shared/glass-table/glass-table';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge';
import { ToastService } from '../../../shared/toast/toast.service';
import { ToastComponent } from '../../../shared/toast/toast';
import { EmpresaClienteFormModalComponent } from '../empresa-cliente-form-modal/empresa-cliente-form-modal';

@Component({
  selector: 'app-empresa-cliente-detail',
  standalone: true,
  imports: [CurrencyPipe, PageHeaderComponent, GlassCardComponent, GlassTableComponent, StatusBadgeComponent, ToastComponent, EmpresaClienteFormModalComponent],
  template: `
    <app-toast />
    @if (loading()) {
      <div class="card-glass" style="padding:2rem"><div class="skeleton skeleton-text-lg" style="width:40%"></div></div>
    } @else if (empresa()) {
      <app-page-header [title]="empresa()!.razonSocial" [subtitle]="'CUIT: ' + empresa()!.cuit">
        <button class="btn-secondary" (click)="goBack()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Volver
        </button>
        <button class="btn-primary" (click)="showEdit.set(true)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Editar
        </button>
      </app-page-header>

      <div class="detail-grid">
        <app-glass-card title="Informacion General">
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Razon Social</span><span class="info-value">{{ empresa()!.razonSocial }}</span></div>
            <div class="info-item"><span class="info-label">CUIT</span><span class="info-value">{{ empresa()!.cuit }}</span></div>
            @if (empresa()!.nombreFantasia) {
              <div class="info-item"><span class="info-label">Nombre Fantasia</span><span class="info-value">{{ empresa()!.nombreFantasia }}</span></div>
            }
            <div class="info-item"><span class="info-label">Condicion IVA</span><span class="info-value">{{ empresa()!.condicionIva || '-' }}</span></div>
            <div class="info-item"><span class="info-label">Email</span><span class="info-value">{{ empresa()!.email || '-' }}</span></div>
            <div class="info-item"><span class="info-label">Telefono</span><span class="info-value">{{ empresa()!.telefono || '-' }}</span></div>
            <div class="info-item"><span class="info-label">Direccion</span><span class="info-value">{{ empresa()!.direccion || '-' }}</span></div>
            <div class="info-item"><span class="info-label">Estado</span><span class="info-value">
              <span class="badge" [class]="empresa()!.activa ? 'bg-glass-green' : 'bg-glass-red'">{{ empresa()!.activa ? 'Activa' : 'Inactiva' }}</span>
            </span></div>
          </div>
        </app-glass-card>
      </div>

      <h3 class="section-title">Facturas ({{ facturas().length }})</h3>
      @if (facturas().length) {
        <app-glass-table [columns]="facturaColumns" [data]="facturas()" [clickable]="true" (rowClick)="goToFactura($event)">
          <ng-template #row let-f>
            <td class="name-cell">{{ f.numero }}</td>
            <td>{{ f.tipo }}</td>
            <td>{{ f.montoTotal | currency:'ARS':'ARS ':'1.2-2' }}</td>
            <td>{{ f.saldoPendiente | currency:'ARS':'ARS ':'1.2-2' }}</td>
            <td><app-status-badge [status]="f.estado" /></td>
          </ng-template>
        </app-glass-table>
      } @else {
        <div class="card-glass empty-card">Sin facturas</div>
      }
    }

    <app-empresa-cliente-form-modal [open]="showEdit()" [entity]="empresa()" (close)="showEdit.set(false)" (saved)="onEdited()" />
  `,
  styles: [`
    :host { display: block; }
    .detail-grid { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.125rem; }
    .info-label { font-size: 0.75rem; font-weight: 500; color: var(--color-gray-500); text-transform: uppercase; letter-spacing: 0.05em; }
    .info-value { font-size: 0.9375rem; font-weight: 500; color: var(--color-gray-900); }
    .badge { font-size: 0.75rem; font-weight: 500; }
    .section-title { font-size: 1rem; font-weight: 600; color: var(--color-gray-900); margin-bottom: 0.75rem; }
    .name-cell { font-weight: 500; }
    .empty-card { padding: 1.5rem; text-align: center; color: var(--color-gray-400); }
  `],
})
export class EmpresaClienteDetailComponent implements OnInit {
  loading = signal(true);
  empresa = signal<EmpresaCliente | null>(null);
  facturas = signal<Factura[]>([]);
  showEdit = signal(false);

  facturaColumns: TableColumn[] = [
    { key: 'numero', label: 'Numero', width: '25%' },
    { key: 'tipo', label: 'Tipo', width: '10%' },
    { key: 'montoTotal', label: 'Monto Total', width: '20%' },
    { key: 'saldo', label: 'Saldo Pend.', width: '20%' },
    { key: 'estado', label: 'Estado', width: '15%' },
  ];

  constructor(
    private route: ActivatedRoute,
    private service: EmpresaClienteService,
    private facturaService: FacturaService,
    private router: Router,
    private toast: ToastService,
  ) {}

  ngOnInit() { this.loadAll(); }

  loadAll() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.getById(id).subscribe({
      next: (data) => {
        this.empresa.set(data);
        this.loading.set(false);
        this.loadFacturas(id);
      },
      error: () => { this.loading.set(false); this.router.navigate(['/empresas-clientes']); },
    });
  }

  loadFacturas(empresaId: string) {
    this.facturaService.getAll({ empresaCliente: empresaId, limit: 50 }).subscribe({
      next: (res) => this.facturas.set(res.data),
    });
  }

  goBack() { this.router.navigate(['/empresas-clientes']); }
  goToFactura(f: Factura) { this.router.navigate(['/facturas', f._id]); }

  onEdited() {
    this.showEdit.set(false);
    this.toast.success('Empresa cliente actualizada');
    this.loading.set(true);
    this.loadAll();
  }
}
