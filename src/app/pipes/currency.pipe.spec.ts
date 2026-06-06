import { ArsCurrencyPipe } from './currency.pipe';

describe('ArsCurrencyPipe', () => {
  const pipe = new ArsCurrencyPipe();

  it('formatea con separador de miles y 2 decimales (es-AR)', () => {
    expect(pipe.transform(1234567.89)).toBe('$ 1.234.567,89');
  });

  it('formatea cero', () => {
    expect(pipe.transform(0)).toBe('$ 0,00');
  });

  it('devuelve "-" para null/undefined', () => {
    expect(pipe.transform(null)).toBe('-');
    expect(pipe.transform(undefined)).toBe('-');
  });
});
