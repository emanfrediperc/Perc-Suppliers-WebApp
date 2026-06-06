import { vi } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    // jsdom no implementa matchMedia → lo stubeamos
    (window as any).matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('arranca en "system" si no hay nada guardado', () => {
    const s = new ThemeService();
    expect(s.themeMode()).toBe('system');
  });

  it('carga el theme guardado en localStorage', () => {
    localStorage.setItem('suppliers_theme', 'light');
    const s = new ThemeService();
    expect(s.themeMode()).toBe('light');
    expect(s.isDark()).toBe(false);
  });

  it('setTheme(dark) actualiza signal, localStorage y el atributo data-theme', () => {
    const s = new ThemeService();
    s.setTheme('dark');
    expect(s.themeMode()).toBe('dark');
    expect(s.isDark()).toBe(true);
    expect(localStorage.getItem('suppliers_theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
