import { Pipe, PipeTransform } from '@angular/core';
import { FormatNumberPipe } from './format-number.pipe';

@Pipe({ name: 'fmtC', standalone: true })
export class FormatCurrencyPipe implements PipeTransform {
  private fmtN = new FormatNumberPipe();

  transform(value: number | null | undefined, currency = 'USD', decimals = 0): string {
    if (value == null) return '—';
    const formatted = this.fmtN.transform(value, decimals);
    switch (currency) {
      case 'ARS':
        return `$${formatted}`;
      case 'USDC':
        return `${formatted} USDC`;
      default:
        return `USD ${formatted}`;
    }
  }
}
