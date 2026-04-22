export type Moneda = 'ARS' | 'USD_CABLE' | 'USD_LOCAL' | 'USD_MEP';
export type EstadoCompraMonedaExtranjera = 'SOLICITADA' | 'EJECUTADA' | 'ANULADA';
export type EmpresaKind = 'cliente' | 'proveedora';

export const MONEDAS: Moneda[] = ['ARS', 'USD_CABLE', 'USD_LOCAL', 'USD_MEP'];

export const MONEDA_LABEL: Record<Moneda, string> = {
  ARS: 'ARS',
  USD_CABLE: 'USD Cable',
  USD_LOCAL: 'USD Local',
  USD_MEP: 'USD MEP',
};

export function monedaLabel(m: Moneda | null | undefined): string {
  return m ? MONEDA_LABEL[m] : '';
}

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
  monedaOrigen: Moneda;
  monedaDestino: Moneda;
  empresa: EmpresaRef;
  montoOrigen: number;
  tipoCambio?: number;
  montoDestino?: number;
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
  monedaOrigen: Moneda;
  monedaDestino: Moneda;
  empresaId: string;
  empresaKind: EmpresaKind;
  montoOrigen: number;
  tipoCambio?: number;
  montoDestino?: number;
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
  monedaOrigen?: Moneda;
  monedaDestino?: Moneda;
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
