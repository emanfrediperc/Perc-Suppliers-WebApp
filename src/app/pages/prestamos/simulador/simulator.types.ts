export interface InstrumentResult {
  name: string;
  color: string;
  pct: number;
  perOp: number;
  monthly: number;
  annual: number;
  speed: string;
  risk: string;
}

export const INSTRUMENT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'] as const;
export const INSTRUMENT_NAMES = ['Pagaré', 'Títulos ON', 'CVU→Títulos', 'Crypto UY'] as const;
