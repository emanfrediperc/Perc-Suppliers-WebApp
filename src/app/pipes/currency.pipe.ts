import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'arsCurrency', standalone: true })
export class ArsCurrencyPipe implements PipeTransform {
  transform(value: number | undefined | null, currency: string = 'ARS'): string {
    if (value == null) return '-';
    return `$ ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
