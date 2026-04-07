import { Injectable, signal, computed, OnDestroy } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  themeMode = signal<ThemeMode>(this.loadThemeMode());

  isDark = computed(() => {
    const mode = this.themeMode();
    if (mode === 'system') return this.systemPrefersDark();
    return mode === 'dark';
  });

  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private mediaListener = (e: MediaQueryListEvent) => {
    if (this.themeMode() === 'system') {
      this.applyTheme(e.matches);
    }
  };

  constructor() {
    this.mediaQuery.addEventListener('change', this.mediaListener);
  }

  ngOnDestroy() {
    this.mediaQuery.removeEventListener('change', this.mediaListener);
  }

  setTheme(mode: ThemeMode) {
    this.themeMode.set(mode);
    localStorage.setItem('suppliers_theme', mode);
    this.applyTheme(this.isDark());
  }

  init() {
    this.applyTheme(this.isDark());
  }

  private applyTheme(dark: boolean) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }

  private systemPrefersDark(): boolean {
    return this.mediaQuery.matches;
  }

  private loadThemeMode(): ThemeMode {
    if (typeof localStorage === 'undefined') return 'system';
    const saved = localStorage.getItem('suppliers_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
  }
}
