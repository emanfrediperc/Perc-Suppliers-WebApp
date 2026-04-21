export type Currency = 'ARS' | 'USD' | 'USDC';
export type Vehicle = 'PAGARE' | 'TITULOS_ON' | 'CVU_TITULOS' | 'CRYPTO_UY';
export type PrestamoStatus = 'ACTIVE' | 'CLEARED' | 'RENEWED';
export type BalanceCut = '12-31' | '06-30';
export type EmpresaKind = 'cliente' | 'proveedora';

export interface EmpresaRef {
  empresaId: string;
  empresaKind: EmpresaKind;
  razonSocialCache: string;
}

export interface PrestamoHistoryEntry {
  date: string | Date;
  action: string;
  detail: string;
}

export interface Prestamo {
  _id: string;
  lender: EmpresaRef;
  borrower: EmpresaRef;
  currency: Currency;
  capital: number;
  rate: number;
  startDate: string;
  dueDate: string;
  vehicle: Vehicle;
  status: PrestamoStatus;
  balanceCut: BalanceCut;
  renewedFrom: string | null;
  history: PrestamoHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface PrestamoComputed {
  days: number;
  interest: number;
  total: number;
  daysToMaturity: number;
}

export interface PrestamoWithComputed extends Prestamo {
  computed: PrestamoComputed;
}

export interface CreatePrestamoDto {
  lender: { empresaId: string; empresaKind: EmpresaKind };
  borrower: { empresaId: string; empresaKind: EmpresaKind };
  currency: Currency;
  capital: number;
  rate: number;
  startDate: string;
  dueDate: string;
  vehicle: Vehicle;
  balanceCut: BalanceCut;
}

export interface UpdatePrestamoDto {
  capital?: number;
  rate?: number;
  dueDate?: string;
  vehicle?: Vehicle;
  reason: string;
}

export interface RenewPrestamoDto {
  capital?: number;
  rate?: number;
  startDate?: string;
  dueDate: string;
  vehicle?: Vehicle;
}

export interface PrestamoFilters {
  status?: PrestamoStatus;
  currency?: Currency;
  lenderId?: string;
  borrowerId?: string;
  empresaId?: string;
  vehicle?: Vehicle;
  balanceCut?: BalanceCut;
}

export interface EmpresaSearchResult {
  id: string;
  kind: EmpresaKind;
  razonSocial: string;
  cuit: string;
}

export interface CurrencyCard {
  currency: Currency;
  count: number;
  totalCapital: number;
  totalInterest: number;
  totalAmount: number;
}

export interface EntityPosition {
  empresaId: string;
  empresaKind: EmpresaKind;
  name: string;
  lent: number;
  borrowed: number;
  net: number;
}

export interface CurrencyPosition {
  currency: Currency;
  entities: EntityPosition[];
}
