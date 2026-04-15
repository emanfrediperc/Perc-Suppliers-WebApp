export type ModalidadCompra = 'CABLE' | 'USD_LOCAL';
export type EstadoCompraMonedaExtranjera = 'CONFIRMADA' | 'ANULADA';

export interface EmpresaClienteRef {
  empresaId: string;
  razonSocialCache: string;
}

export interface CompraMonedaExtranjera {
  _id: string;
  fecha: string;
  modalidad: ModalidadCompra;
  empresaCliente: EmpresaClienteRef;
  montoUSD: number;
  tipoCambio: number;
  montoARS: number;
  contraparte: string;
  comision: number;
  referencia?: string;
  estado: EstadoCompraMonedaExtranjera;
  observaciones?: string;
  motivoAnulacion?: string;
  creadoPor: string;
  anuladoPor?: string;
  anuladoAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompraMonedaExtranjeraDto {
  fecha: string;
  modalidad: ModalidadCompra;
  empresaClienteId: string;
  montoUSD: number;
  tipoCambio: number;
  montoARS: number;
  contraparte: string;
  comision?: number;
  referencia?: string;
  observaciones?: string;
}

export interface AnularCompraMonedaExtranjeraDto {
  motivo?: string;
}

export interface CompraMonedaExtranjeraFilters {
  modalidad?: ModalidadCompra;
  estado?: EstadoCompraMonedaExtranjera;
  empresaClienteId?: string;
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
