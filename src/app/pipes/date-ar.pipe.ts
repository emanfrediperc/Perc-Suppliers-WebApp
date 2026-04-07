import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateAr', standalone: true })
export class DateArPipe implements PipeTransform {
  transform(value: string | Date | undefined | null): string {
    if (!value) return '-';
    const d = new Date(value);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
