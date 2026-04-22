export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  role: string;
  mustChangePassword?: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmpresaProveedora {
  _id: string;
  cuit: string;
  razonSocial: string;
  nombreFantasia?: string;
  finnegansId?: string;
  condicionIva?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  convenios: Convenio[];
  activa: boolean;
  datosBancarios?: { banco: string; cbu: string; alias: string };
  createdAt: string;
}

export interface EmpresaCliente {
  _id: string;
  cuit: string;
  razonSocial: string;
  nombreFantasia?: string;
  finnegansId?: string;
  condicionIva?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activa: boolean;
  createdAt: string;
}

export interface Convenio {
  _id: string;
  nombre: string;
  descripcion?: string;
  comisionPorcentaje: number;
  descuentoPorcentaje: number;
  empresasProveedoras: EmpresaProveedora[];
  reglas?: { comisionMinima: number; comisionMaxima: number; aplicaIVASobreComision: boolean; diasPago: number };
  activo: boolean;
  fechaVigencia?: string;
  createdAt: string;
}

export interface OrdenPago {
  _id: string;
  numero: string;
  finnegansId?: string;
  fecha: string;
  empresaProveedora: EmpresaProveedora;
  montoTotal: number;
  montoPagado: number;
  saldoPendiente: number;
  moneda: string;
  estado: 'pendiente' | 'parcial' | 'pagada' | 'anulada' | 'esperando_aprobacion' | 'rechazado';
  facturas: Factura[];
  pagos: Pago[];
  createdAt: string;
}

export interface Factura {
  _id: string;
  numero: string;
  finnegansId?: string;
  tipo: 'A' | 'B' | 'C' | 'M' | 'E' | 'NC-A' | 'NC-B' | 'NC-C' | 'ND-A' | 'ND-B' | 'ND-C';
  fecha: string;
  fechaVencimiento?: string;
  montoNeto: number;
  montoIva: number;
  montoTotal: number;
  moneda: string;
  empresaProveedora: EmpresaProveedora;
  empresaCliente?: EmpresaCliente;
  ordenPago?: OrdenPago;
  facturaRelacionada?: Factura;
  estado: 'pendiente' | 'parcial' | 'pagada' | 'anulada';
  montoPagado: number;
  saldoPendiente: number;
  pagos: Pago[];
  archivoUrl?: string;
  archivoNombre?: string;
  createdAt: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  type?: 'exact' | 'partial';
  factura?: Factura;
}

export interface PagoProgramado {
  _id: string;
  ordenPago: OrdenPago;
  montoBase: number;
  medioPago: 'transferencia' | 'cheque' | 'efectivo' | 'compensacion' | 'otro';
  fechaProgramada: string;
  retencionIIBB?: number;
  retencionGanancias?: number;
  retencionIVA?: number;
  retencionSUSS?: number;
  otrasRetenciones?: number;
  referenciaPago?: string;
  observaciones?: string;
  estado: 'programado' | 'ejecutado' | 'cancelado' | 'fallido';
  errorMensaje?: string;
  pagoGenerado?: Pago;
  createdByEmail?: string;
  createdAt: string;
}

export interface PagoLoteResultado {
  resultados: Array<{ ordenId: string; exito: boolean; pagoId?: string; error?: string }>;
}

export interface OcrExtractedData {
  numero?: string;
  tipo?: string;
  fecha?: string;
  fechaVencimiento?: string;
  montoNeto?: number;
  montoIva?: number;
  montoTotal?: number;
  cuitProveedor?: string;
  razonSocialProveedor?: string;
  cuitCliente?: string;
  razonSocialCliente?: string;
}

export interface Pago {
  _id: string;
  ordenPago?: OrdenPago;
  factura?: Factura;
  fechaPago: string;
  montoBase: number;
  retencionIIBB: number;
  retencionGanancias: number;
  retencionIVA: number;
  retencionSUSS: number;
  otrasRetenciones: number;
  comision: number;
  porcentajeComision: number;
  descuento: number;
  porcentajeDescuento: number;
  montoNeto: number;
  medioPago: 'transferencia' | 'cheque' | 'efectivo' | 'compensacion' | 'otro';
  referenciaPago?: string;
  observaciones?: string;
  convenioAplicado?: Convenio;
  estado: 'confirmado' | 'pendiente' | 'rechazado' | 'anulado' | 'esperando_aprobacion';
  createdAt: string;
}

export interface DashboardSummary {
  totalOrdenes: number;
  ordenesPendientes: number;
  totalFacturas: number;
  facturasPendientes: number;
  totalPagos: number;
  totalProveedores: number;
  montoPagado: number;
  saldoPendiente: number;
  trends: DashboardTrends;
}

export interface DashboardActivity {
  recentPagos: Pago[];
  recentOrdenes: OrdenPago[];
  recentFacturas: Factura[];
}

// Dashboard mejorado
export interface DashboardTrends {
  ordenes: number;
  facturas: number;
  montoPagado: number;
  saldoPendiente: number;
}

export interface DashboardPagosPorMes {
  periodo: string;
  montoTotal: number;
  cantidad: number;
}

export interface DashboardFacturasPorEstado {
  estado: string;
  cantidad: number;
  montoTotal: number;
}

export interface DashboardTopProveedor {
  proveedor: { _id: string; razonSocial: string };
  montoTotal: number;
  cantidadPagos: number;
}

export interface DashboardFacturaPorVencer {
  _id: string;
  numero: string;
  fechaVencimiento: string;
  montoTotal: number;
  saldoPendiente: number;
  empresaProveedora: EmpresaProveedora;
}

// Reportes
export interface ReportePagosPorPeriodo {
  periodos: {
    anio: number; mes: number; periodo: string;
    montoBase: number; montoNeto: number;
    retencionIIBB: number; retencionGanancias: number; retencionIVA: number; retencionSUSS: number; otrasRetenciones: number;
    comision: number; descuento: number; cantidad: number;
  }[];
  totales: { montoBase: number; montoNeto: number; retenciones: number; comision: number; descuento: number; cantidad: number };
}

export interface ReportePagosPorProveedor {
  proveedores: { proveedorId: string; razonSocial: string; montoBase: number; montoNeto: number; cantidadPagos: number }[];
}

export interface ReporteFacturasVencimiento {
  vencidas: { bucket: string; cantidad: number; montoTotal: number; saldoPendiente: number }[];
  porVencer: { bucket: string; cantidad: number; montoTotal: number; saldoPendiente: number }[];
}

export interface ReporteRetencionesAcumuladas {
  periodos: {
    anio: number; mes: number; periodo: string;
    retencionIIBB: number; retencionGanancias: number; retencionIVA: number; retencionSUSS: number; otrasRetenciones: number;
    total: number;
  }[];
  totales: { retencionIIBB: number; retencionGanancias: number; retencionIVA: number; retencionSUSS: number; otrasRetenciones: number; total: number };
}

export interface ReporteComisionesDescuentos {
  porConvenio: { convenioId: string; nombre: string; comision: number; descuento: number; montoBase: number; cantidad: number }[];
  porProveedor: { proveedorId: string; razonSocial: string; comision: number; descuento: number; montoBase: number }[];
}

export interface ReporteEstadoCuenta {
  proveedor: EmpresaProveedora | null;
  facturas: Factura[];
  totales: { facturado: number; pagado: number; saldoPendiente: number };
}

export interface ReporteFacturasPorTipo {
  tipos: { tipo: string; cantidad: number; montoTotal: number; montoNeto: number; montoIva: number }[];
}
