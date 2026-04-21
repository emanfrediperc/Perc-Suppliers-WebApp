export type ModalidadCompra = 'CABLE' | 'USD_LOCAL' | 'MEP';
export type EstadoCompraMonedaExtranjera = 'SOLICITADA' | 'EJECUTADA' | 'ANULADA';
export type EmpresaKind = 'cliente' | 'proveedora';

export interface EmpresaRef {
  empresaId: string;
  empresaKind: EmpresaKind;
  razonSocialCache: string;
}

export interface CreadoPorRef {
  _id: string;
  nombre: string;
  email: string;
}

export interface CompraMonedaExtranjera {
  _id: string;
  fechaSolicitada: string;
  fechaEstimadaEjecucion?: string;
  fechaEjecutada?: string;
  modalidad: ModalidadCompra;
  empresa: EmpresaRef;
  montoUSD: number;
  tipoCambio?: number;
  montoARS?: number;
  contraparte?: string;
  comision: number;
  referencia?: string;
  estado: EstadoCompraMonedaExtranjera;
  observaciones?: string;
  motivoAnulacion?: string;
  creadoPor: string | CreadoPorRef;
  ejecutadoPor?: string | CreadoPorRef;
  ejecutadoAt?: string;
  anuladoPor?: string;
  anuladoAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompraMonedaExtranjeraDto {
  fechaSolicitada: string;
  modalidad: ModalidadCompra;
  empresaId: string;
  empresaKind: EmpresaKind;
  montoUSD: number;
  tipoCambio?: number;
  montoARS?: number;
  contraparte?: string;
  comision?: number;
  referencia?: string;
  observaciones?: string;
}

export interface AnularCompraMonedaExtranjeraDto {
  motivo?: string;
}

export interface EjecutarCompraMonedaExtranjeraDto {
  fechaEjecutada: string;
  observaciones?: string;
}

export interface EstimarEjecucionCompraMonedaExtranjeraDto {
  fechaEstimadaEjecucion: string;
}

export interface CompraMonedaExtranjeraFilters {
  modalidad?: ModalidadCompra;
  estado?: EstadoCompraMonedaExtranjera;
  empresaId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedCompras {
  data: CompraMonedaExtranjera[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
