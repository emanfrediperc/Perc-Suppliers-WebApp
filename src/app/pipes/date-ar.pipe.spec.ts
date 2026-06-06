import { DateArPipe } from './date-ar.pipe';

describe('DateArPipe', () => {
  const pipe = new DateArPipe();

  it('formatea una fecha como dd/mm/yyyy (es-AR)', () => {
    // Date local (sin shift de timezone)
    expect(pipe.transform(new Date(2026, 5, 5))).toBe('05/06/2026');
  });

  it('respeta el patron dd/mm/yyyy para cualquier fecha', () => {
    expect(pipe.transform(new Date(2026, 0, 1))).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('devuelve "-" para null/undefined/vacio', () => {
    expect(pipe.transform(null)).toBe('-');
    expect(pipe.transform(undefined)).toBe('-');
    expect(pipe.transform('')).toBe('-');
  });
});
