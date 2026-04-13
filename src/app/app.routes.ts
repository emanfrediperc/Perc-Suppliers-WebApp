import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register').then(m => m.RegisterComponent) },
  { path: 'change-password', loadComponent: () => import('./pages/change-password/change-password').then(m => m.ChangePasswordComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'ordenes-pago', loadComponent: () => import('./pages/ordenes-pago/ordenes-pago-list/ordenes-pago-list').then(m => m.OrdenesPagoListComponent) },
      { path: 'ordenes-pago/:id', loadComponent: () => import('./pages/ordenes-pago/orden-pago-detail/orden-pago-detail').then(m => m.OrdenPagoDetailComponent) },
      { path: 'facturas', loadComponent: () => import('./pages/facturas/facturas-list/facturas-list').then(m => m.FacturasListComponent) },
      { path: 'facturas/:id', loadComponent: () => import('./pages/facturas/factura-detail/factura-detail').then(m => m.FacturaDetailComponent) },
      { path: 'convenios', loadComponent: () => import('./pages/convenios/convenios-list/convenios-list').then(m => m.ConveniosListComponent) },
      { path: 'convenios/:id', loadComponent: () => import('./pages/convenios/convenio-detail/convenio-detail').then(m => m.ConvenioDetailComponent) },
      { path: 'empresas-proveedoras', loadComponent: () => import('./pages/empresas-proveedoras/empresas-proveedoras-list/empresas-proveedoras-list').then(m => m.EmpresasProveedorasListComponent) },
      { path: 'empresas-proveedoras/:id', loadComponent: () => import('./pages/empresas-proveedoras/empresa-proveedora-detail/empresa-proveedora-detail').then(m => m.EmpresaProveedoraDetailComponent) },
      { path: 'empresas-clientes', loadComponent: () => import('./pages/empresas-clientes/empresas-clientes-list/empresas-clientes-list').then(m => m.EmpresasClientesListComponent) },
      { path: 'empresas-clientes/:id', loadComponent: () => import('./pages/empresas-clientes/empresa-cliente-detail/empresa-cliente-detail').then(m => m.EmpresaClienteDetailComponent) },
      { path: 'reportes', loadComponent: () => import('./pages/reportes/reportes').then(m => m.ReportesComponent) },
      { path: 'estado-cuenta', loadComponent: () => import('./pages/estado-cuenta/estado-cuenta').then(m => m.EstadoCuentaComponent) },
      { path: 'prestamos', loadComponent: () => import('./pages/prestamos/listado/listado').then(m => m.PrestamosListadoComponent) },
      { path: 'prestamos/simulador', loadComponent: () => import('./pages/prestamos/simulador/simulador').then(m => m.SimuladorComponent) },
      {
        path: 'pagos-programados',
        loadComponent: () => import('./pages/pagos-programados/pagos-programados-list').then(m => m.PagosProgramadosListComponent),
        canActivate: [roleGuard('admin', 'tesoreria')],
      },
      {
        path: 'aprobaciones',
        loadComponent: () => import('./pages/aprobaciones/aprobaciones-list/aprobaciones-list').then(m => m.AprobacionesListComponent),
        canActivate: [roleGuard('admin', 'tesoreria')],
      },
      {
        path: 'admin/usuarios',
        loadComponent: () => import('./pages/admin/usuarios/usuarios').then(m => m.UsuariosComponent),
        canActivate: [roleGuard('admin')],
      },
      {
        path: 'admin/audit-logs',
        loadComponent: () => import('./pages/admin/audit-logs/audit-logs').then(m => m.AuditLogsComponent),
        canActivate: [roleGuard('admin')],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
