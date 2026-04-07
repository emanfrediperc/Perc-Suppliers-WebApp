import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardSummary, DashboardActivity, DashboardPagosPorMes, DashboardFacturasPorEstado, DashboardTopProveedor, DashboardFacturaPorVencer } from '../../models';
import { PageHeaderComponent } from '../../shared/page-header/page-header';
import { GlassCardComponent } from '../../shared/glass-card/glass-card';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge';
import { DateRangeSelectorComponent } from '../../shared/date-range-selector/date-range-selector';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe, PageHeaderComponent, GlassCardComponent, StatusBadgeComponent, DateRangeSelectorComponent],
  template: `
    <app-page-header title="Dashboard" subtitle="Resumen general del sistema" />
    <app-date-range-selector (rangeChange)="onDateChange($event)" />

    @if (loading()) {
      <div class="stats-grid">
        @for (i of [1,2,3,4]; track i) {
          <div class="card-glass stat-card"><div class="skeleton skeleton-text-lg" style="width:60%"></div><div class="skeleton skeleton-text" style="width:40%;margin-top:0.5rem"></div></div>
        }
      </div>
    } @else if (summary()) {
      <div class="stats-grid">
        <div class="card-glass stat-card clickable-card" style="background: var(--gradient-card-blue);" (click)="navigateTo('/ordenes-pago')">
          <div class="stat-header">
            <div class="stat-value">{{ summary()!.totalOrdenes }}</div>
            @if (summary()!.trends.ordenes; as t) {
              <span class="trend" [class.up]="t > 0" [class.down]="t < 0">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path [attr.d]="t >= 0 ? 'M6 2L10 7H2L6 2Z' : 'M6 10L2 5H10L6 10Z'" /></svg>
                {{ (t >= 0 ? '+' : '') }}{{ t | number:'1.1-1' }}%
              </span>
            }
          </div>
          <div class="stat-label">Ordenes de Pago</div>
          <div class="stat-sub">{{ summary()!.ordenesPendientes }} pendientes</div>
        </div>
        <div class="card-glass stat-card clickable-card" style="background: var(--gradient-card-purple);" (click)="navigateTo('/facturas')">
          <div class="stat-header">
            <div class="stat-value">{{ summary()!.totalFacturas }}</div>
            @if (summary()!.trends.facturas; as t) {
              <span class="trend" [class.up]="t > 0" [class.down]="t < 0">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path [attr.d]="t >= 0 ? 'M6 2L10 7H2L6 2Z' : 'M6 10L2 5H10L6 10Z'" /></svg>
                {{ (t >= 0 ? '+' : '') }}{{ t | number:'1.1-1' }}%
              </span>
            }
          </div>
          <div class="stat-label">Facturas</div>
          <div class="stat-sub">{{ summary()!.facturasPendientes }} pendientes</div>
        </div>
        <div class="card-glass stat-card clickable-card" style="background: var(--gradient-card-green);" (click)="navigateTo('/ordenes-pago', { estado: 'pendiente' })">
          <div class="stat-header">
            <div class="stat-value">{{ summary()!.montoPagado | currency:'ARS':'ARS ':'1.0-0' }}</div>
            @if (summary()!.trends.montoPagado; as t) {
              <span class="trend" [class.up]="t > 0" [class.down]="t < 0">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path [attr.d]="t >= 0 ? 'M6 2L10 7H2L6 2Z' : 'M6 10L2 5H10L6 10Z'" /></svg>
                {{ (t >= 0 ? '+' : '') }}{{ t | number:'1.1-1' }}%
              </span>
            }
          </div>
          <div class="stat-label">Total Pagado</div>
          <div class="stat-sub">{{ summary()!.totalPagos }} pagos realizados</div>
        </div>
        <div class="card-glass stat-card clickable-card" style="background: var(--gradient-card-orange);" (click)="navigateTo('/facturas', { estado: 'pendiente' })">
          <div class="stat-value">{{ summary()!.saldoPendiente | currency:'ARS':'ARS ':'1.0-0' }}</div>
          <div class="stat-label">Saldo Pendiente</div>
          <div class="stat-sub">{{ summary()!.totalProveedores }} proveedores</div>
        </div>
      </div>
    }

    <!-- Charts row -->
    <div class="charts-grid">
      <app-glass-card title="Pagos por Mes">
        @if (pagosPorMes().length) {
          <div class="bar-chart">
            @for (item of pagosPorMes(); track item.periodo) {
              <div class="bar-col">
                <div class="bar-value">{{ item.montoTotal | currency:'ARS':'ARS ':'1.0-0' }}</div>
                <div class="bar" [style.height.%]="getBarHeight(item.montoTotal, maxPagoMes())" title="{{ item.periodo }}: {{ item.montoTotal | currency:'ARS':'ARS ':'1.0-0' }}"></div>
                <div class="bar-label">{{ item.periodo }}</div>
              </div>
            }
          </div>
        } @else {
          <p class="no-data">Sin datos de pagos</p>
        }
      </app-glass-card>

      <app-glass-card title="Facturas por Estado">
        @if (facturasPorEstado().length) {
          <div class="h-bars">
            @for (item of facturasPorEstado(); track item.estado) {
              <div class="h-bar-row">
                <span class="h-bar-label">{{ item.estado | titlecase }}</span>
                <div class="h-bar-track">
                  <div class="h-bar-fill" [class]="'fill-' + item.estado" [style.width.%]="getBarHeight(item.cantidad, maxFacturaEstado())"></div>
                </div>
                <span class="h-bar-value">{{ item.cantidad }}</span>
              </div>
            }
          </div>
        } @else {
          <p class="no-data">Sin datos de facturas</p>
        }
      </app-glass-card>
    </div>

    <!-- Second row: Top proveedores + Facturas por vencer -->
    <div class="charts-grid">
      <app-glass-card title="Top 5 Proveedores">
        @if (topProveedores().length) {
          <div class="h-bars">
            @for (item of topProveedores(); track item.proveedor._id; let i = $index) {
              <div class="h-bar-row">
                <span class="h-bar-label rank">
                  <span class="rank-num">{{ i + 1 }}</span>
                  {{ item.proveedor.razonSocial }}
                </span>
                <div class="h-bar-track">
                  <div class="h-bar-fill fill-primary" [style.width.%]="getBarHeight(item.montoTotal, maxTopProv())"></div>
                </div>
                <span class="h-bar-value">{{ item.montoTotal | currency:'ARS':'ARS ':'1.0-0' }}</span>
              </div>
            }
          </div>
        } @else {
          <p class="no-data">Sin datos de proveedores</p>
        }
      </app-glass-card>

      <app-glass-card title="Facturas Proximas a Vencer">
        @if (facturasPorVencer().length) {
          @for (f of facturasPorVencer(); track f._id) {
            <a [routerLink]="['/facturas', f._id]" class="vencer-item">
              <div class="vencer-info">
                <span class="vencer-num">{{ f.numero }}</span>
                <span class="vencer-prov">{{ f.empresaProveedora?.razonSocial }}</span>
              </div>
              <div class="vencer-right">
                <span class="vencer-amount">{{ f.saldoPendiente | currency:'ARS':'ARS ':'1.2-2' }}</span>
                <span class="vencer-date">{{ f.fechaVencimiento | date:'dd/MM/yyyy' }}</span>
              </div>
            </a>
          }
        } @else {
          <p class="no-data">Sin facturas proximas a vencer</p>
        }
      </app-glass-card>
    </div>

    <!-- Activity row (existing) -->
    <div class="activity-grid">
      <app-glass-card title="Pagos Recientes">
        @if (activity()?.recentPagos?.length) {
          @for (pago of activity()!.recentPagos; track pago._id) {
            <div class="activity-item">
              <div class="activity-info">
                <span class="activity-label">Pago #{{ pago._id.slice(-6) }}</span>
                <span class="activity-date">{{ pago.fechaPago | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="activity-right">
                <span class="activity-amount">{{ pago.montoNeto | currency:'ARS':'ARS ':'1.2-2' }}</span>
                <app-status-badge [status]="pago.estado" />
              </div>
            </div>
          }
        } @else {
          <p class="no-data">Sin pagos recientes</p>
        }
      </app-glass-card>

      <app-glass-card title="Ordenes Recientes">
        @if (activity()?.recentOrdenes?.length) {
          @for (orden of activity()!.recentOrdenes; track orden._id) {
            <a [routerLink]="['/ordenes-pago', orden._id]" class="activity-item clickable">
              <div class="activity-info">
                <span class="activity-label">{{ orden.numero }}</span>
                <span class="activity-date">{{ orden.fecha | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="activity-right">
                <span class="activity-amount">{{ orden.montoTotal | currency:'ARS':'ARS ':'1.2-2' }}</span>
                <app-status-badge [status]="orden.estado" />
              </div>
            </a>
          }
        } @else {
          <p class="no-data">Sin ordenes recientes</p>
        }
      </app-glass-card>
    </div>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { padding: 1.25rem; }
    .clickable-card { cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; }
    .clickable-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .stat-header { display: flex; align-items: center; gap: 0.5rem; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--color-gray-900); }
    .stat-label { font-size: 0.875rem; font-weight: 500; color: var(--color-gray-700); margin-top: 0.25rem; }
    .stat-sub { font-size: 0.75rem; color: var(--color-gray-500); margin-top: 0.25rem; }

    .trend {
      display: inline-flex; align-items: center; gap: 0.125rem;
      font-size: 0.75rem; font-weight: 600; padding: 0.125rem 0.375rem; border-radius: 9999px;
    }
    .trend.up { color: #16a34a; background: rgba(22,163,74,0.1); }
    .trend.down { color: #dc2626; background: rgba(220,38,38,0.1); }

    .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }

    /* Vertical bar chart */
    .bar-chart { display: flex; align-items: flex-end; gap: 0.25rem; height: 200px; padding-top: 1.5rem; }
    .bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 0; height: 100%; justify-content: flex-end; }
    .bar {
      width: 100%; max-width: 36px; min-height: 4px; border-radius: 4px 4px 0 0;
      background: linear-gradient(180deg, #6366f1, #818cf8); transition: height 0.5s ease;
    }
    .bar-value { font-size: 0.5625rem; color: var(--color-gray-500); white-space: nowrap; margin-bottom: 0.25rem; display: none; }
    .bar-col:hover .bar-value { display: block; }
    .bar-col:hover .bar { background: linear-gradient(180deg, #4f46e5, #6366f1); }
    .bar-label { font-size: 0.625rem; color: var(--color-gray-500); margin-top: 0.375rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }

    /* Horizontal bars */
    .h-bars { display: flex; flex-direction: column; gap: 0.75rem; }
    .h-bar-row { display: flex; align-items: center; gap: 0.75rem; }
    .h-bar-label { font-size: 0.8125rem; color: var(--color-gray-700); min-width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .h-bar-label.rank { display: flex; align-items: center; gap: 0.5rem; }
    .rank-num {
      display: inline-flex; align-items: center; justify-content: center;
      width: 20px; height: 20px; border-radius: 50%; background: var(--color-gray-100);
      font-size: 0.6875rem; font-weight: 700; color: var(--color-gray-600); flex-shrink: 0;
    }
    .h-bar-track { flex: 1; height: 24px; background: var(--color-gray-100); border-radius: 4px; overflow: hidden; }
    .h-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; min-width: 4px; }
    .fill-primary { background: linear-gradient(90deg, #6366f1, #818cf8); }
    .fill-pendiente { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .fill-parcial { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
    .fill-pagada { background: linear-gradient(90deg, #16a34a, #4ade80); }
    .fill-anulada { background: linear-gradient(90deg, #dc2626, #f87171); }
    .h-bar-value { font-size: 0.8125rem; font-weight: 600; color: var(--color-gray-800); min-width: 40px; text-align: right; }

    /* Facturas por vencer */
    .vencer-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.625rem 0; border-bottom: 1px solid var(--color-gray-100);
      text-decoration: none; cursor: pointer; border-radius: var(--radius-sm);
    }
    .vencer-item:last-child { border-bottom: none; }
    .vencer-item:hover { background: rgba(99, 102, 241, 0.04); }
    .vencer-info { display: flex; flex-direction: column; gap: 0.125rem; }
    .vencer-num { font-size: 0.8125rem; font-weight: 600; color: var(--color-gray-800); }
    .vencer-prov { font-size: 0.75rem; color: var(--color-gray-500); }
    .vencer-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.125rem; }
    .vencer-amount { font-size: 0.8125rem; font-weight: 600; color: var(--color-gray-900); }
    .vencer-date { font-size: 0.6875rem; color: #f59e0b; font-weight: 500; }

    /* Activity (existing) */
    .activity-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1rem; }
    .activity-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.75rem 0; border-bottom: 1px solid var(--color-gray-100);
      text-decoration: none;
    }
    .activity-item:last-child { border-bottom: none; }
    .activity-item.clickable { cursor: pointer; border-radius: var(--radius-sm); }
    .activity-item.clickable:hover { background: rgba(99, 102, 241, 0.04); }
    .activity-info { display: flex; flex-direction: column; gap: 0.125rem; }
    .activity-label { font-size: 0.875rem; font-weight: 500; color: var(--color-gray-800); }
    .activity-date { font-size: 0.75rem; color: var(--color-gray-500); }
    .activity-right { display: flex; align-items: center; gap: 0.75rem; }
    .activity-amount { font-size: 0.875rem; font-weight: 600; color: var(--color-gray-900); }
    .no-data { font-size: 0.875rem; color: var(--color-gray-400); text-align: center; padding: 1rem; }
  `],
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  summary = signal<DashboardSummary | null>(null);
  activity = signal<DashboardActivity | null>(null);
  pagosPorMes = signal<DashboardPagosPorMes[]>([]);
  facturasPorEstado = signal<DashboardFacturasPorEstado[]>([]);
  topProveedores = signal<DashboardTopProveedor[]>([]);
  facturasPorVencer = signal<DashboardFacturaPorVencer[]>([]);

  maxPagoMes = signal(0);
  maxFacturaEstado = signal(0);
  maxTopProv = signal(0);

  private currentFilters: { desde?: string; hasta?: string } = {};

  constructor(private dashboardService: DashboardService, private router: Router) {}

  ngOnInit() {
    this.loadSummary();
    this.loadActivity();
    this.loadCharts();
  }

  onDateChange(range: { desde: string; hasta: string }) {
    this.currentFilters = range;
    this.loadSummary();
    this.loadTopProveedores();
  }

  private loadSummary() {
    this.loading.set(true);
    this.dashboardService.getSummary(this.currentFilters).subscribe({
      next: (data) => { this.summary.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private loadActivity() {
    this.dashboardService.getRecentActivity().subscribe({
      next: (data) => this.activity.set(data),
    });
  }

  private loadCharts() {
    this.dashboardService.getPagosPorMes().subscribe({
      next: (data) => {
        this.pagosPorMes.set(data);
        this.maxPagoMes.set(Math.max(...data.map(d => d.montoTotal), 1));
      },
    });
    this.dashboardService.getFacturasPorEstado().subscribe({
      next: (data) => {
        this.facturasPorEstado.set(data);
        this.maxFacturaEstado.set(Math.max(...data.map(d => d.cantidad), 1));
      },
    });
    this.loadTopProveedores();
    this.dashboardService.getFacturasPorVencer().subscribe({
      next: (data) => this.facturasPorVencer.set(data),
    });
  }

  private loadTopProveedores() {
    this.dashboardService.getTopProveedores(this.currentFilters).subscribe({
      next: (data) => {
        this.topProveedores.set(data);
        this.maxTopProv.set(Math.max(...data.map(d => d.montoTotal), 1));
      },
    });
  }

  navigateTo(path: string, params?: any) {
    if (params) {
      this.router.navigate([path], { queryParams: params });
    } else {
      this.router.navigate([path]);
    }
  }

  getBarHeight(value: number, max: number): number {
    if (!max) return 0;
    return Math.max((value / max) * 100, 2);
  }
}
