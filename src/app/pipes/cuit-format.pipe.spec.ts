import { CuitFormatPipe } from './cuit-format.pipe';

describe('CuitFormatPipe', () => {
  const pipe = new CuitFormatPipe();

  it('formatea 11 digitos a XX-XXXXXXXX-X', () => {
    expect(pipe.transform('20000000001')).toBe('20-00000000-1');
  });

  it('limpia no-digitos y reformatea', () => {
    expect(pipe.transform('20-00000000-1')).toBe('20-00000000-1');
  });

  it('devuelve "-" para null/undefined/vacio', () => {
    expect(pipe.transform(null)).toBe('-');
    expect(pipe.transform(undefined)).toBe('-');
    expect(pipe.transform('')).toBe('-');
  });

  it('devuelve el valor original si no son 11 digitos', () => {
    expect(pipe.transform('123')).toBe('123');
  });
});
