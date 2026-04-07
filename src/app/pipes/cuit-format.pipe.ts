import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'cuitFormat', standalone: true })
export class CuitFormatPipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value) return '-';
    const clean = value.replace(/\D/g, '');
    if (clean.length === 11) return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
    return value;
  }
}
