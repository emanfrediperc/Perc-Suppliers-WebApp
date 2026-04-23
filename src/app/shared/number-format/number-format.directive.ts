import { Directive, ElementRef, HostListener, input, forwardRef, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

/**
 * Directive that formats numeric inputs with es-AR locale (dot = thousands, comma = decimal).
 *
 * Usage:
 *   <input appNumberFormat />                     → integers (0 decimals)
 *   <input appNumberFormat [decimals]="2" />      → up to 2 decimal places
 *
 * Integrates with ngModel / ReactiveForms via ControlValueAccessor.
 * The model value is always a raw number; the display is formatted.
 */
@Directive({
  selector: 'input[appNumberFormat]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberFormatDirective),
      multi: true,
    },
  ],
})
export class NumberFormatDirective implements ControlValueAccessor, OnInit {
  decimals = input(0);

  private el: HTMLInputElement;
  private onChange: (val: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elRef: ElementRef<HTMLInputElement>) {
    this.el = this.elRef.nativeElement;
    this.el.type = 'text';
    this.el.inputMode = 'decimal';
  }

  ngOnInit() {
    this.el.type = 'text';
    this.el.inputMode = 'decimal';
  }

  writeValue(value: number | null): void {
    this.el.value = value != null ? this.format(value) : '';
  }

  registerOnChange(fn: (val: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.el.disabled = disabled;
  }

  @HostListener('input')
  onInput(): void {
    const raw = this.el.value;
    const cursor = this.el.selectionStart ?? 0;

    // Live-format: add thousand dots to integer part, leave decimal part as-is
    const liveFormatted = this.liveFormat(raw);
    const diff = liveFormatted.length - raw.length;
    this.el.value = liveFormatted;
    this.el.setSelectionRange(cursor + diff, cursor + diff);

    const parsed = this.parse(liveFormatted);
    this.onChange(parsed);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
    const parsed = this.parse(this.el.value);
    this.el.value = parsed != null ? this.format(parsed) : '';
    this.onChange(parsed);
  }

  @HostListener('keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    const allowed = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'Home', 'End',
    ];
    if (allowed.includes(e.key)) return;
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key)) return;

    // Allow digits
    if (e.key >= '0' && e.key <= '9') return;

    // Allow minus at start
    if (e.key === '-' && this.el.selectionStart === 0 && !this.el.value.includes('-')) return;

    // Allow comma as decimal separator
    if (e.key === ',' && this.decimals() > 0 && !this.el.value.replace(/\./g, '').includes(',')) return;

    // Accept dot as decimal separator too — insert it as comma
    if (e.key === '.' && this.decimals() > 0 && !this.el.value.replace(/\./g, '').includes(',')) {
      e.preventDefault();
      const start = this.el.selectionStart ?? this.el.value.length;
      const end = this.el.selectionEnd ?? start;
      const before = this.el.value.slice(0, start);
      const after = this.el.value.slice(end);
      this.el.value = before + ',' + after;
      this.el.setSelectionRange(start + 1, start + 1);
      this.onInput();
      return;
    }

    e.preventDefault();
  }

  /**
   * Live format: only adds thousand-separator dots to the integer part.
   * Leaves the decimal part (after comma) untouched so the user can type freely.
   */
  private liveFormat(raw: string): string {
    // Preserve sign
    const sign = raw.startsWith('-') ? '-' : '';
    let rest = sign ? raw.slice(1) : raw;

    // Split by comma (decimal separator)
    const commaIdx = rest.indexOf(',');
    let intPart = commaIdx >= 0 ? rest.slice(0, commaIdx) : rest;
    const decPart = commaIdx >= 0 ? rest.slice(commaIdx) : ''; // includes comma

    // Strip existing dots from integer part, then re-add them
    intPart = intPart.replace(/\./g, '');
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return sign + intPart + decPart;
  }

  private parse(value: string): number | null {
    if (!value || value === '-') return null;
    // Remove thousand separators (dots), replace decimal comma with dot
    const clean = value.replace(/\./g, '').replace(',', '.');
    const num = Number(clean);
    return isNaN(num) ? null : num;
  }

  private format(value: number): string {
    const dec = this.decimals();
    const parts = Math.abs(value).toFixed(dec).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const sign = value < 0 ? '-' : '';
    return sign + (dec > 0 ? parts.join(',') : parts[0]);
  }
}
