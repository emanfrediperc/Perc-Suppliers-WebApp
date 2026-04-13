import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fmtN', standalone: true })
export class FormatNumberPipe implements PipeTransform {
  transform(value: number | null | undefined, decimals = 0): string {
    if (value == null) return '—';
    const parts = Math.abs(value).toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (value < 0 ? '-' : '') + parts.join(',');
  }
}
