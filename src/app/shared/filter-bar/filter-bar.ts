import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="filter-bar card-glass">
      <div class="search-wrapper">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gray-400)" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" [placeholder]="placeholder()" [ngModel]="searchValue()" (ngModelChange)="onSearch($event)" class="search-input" />
      </div>
      <ng-content />
    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem;
      margin-bottom: 1rem; flex-wrap: wrap;
    }
    .search-wrapper {
      display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 200px;
    }
    .search-input {
      flex: 1; background: transparent; border: none; outline: none;
      font-size: 1rem; color: var(--color-gray-700); padding: 0.25rem 0;
    }
    .search-input::placeholder { color: var(--color-gray-400); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBarComponent {
  placeholder = input('Buscar...');
  searchValue = signal('');
  search = output<string>();

  onSearch(value: string) {
    this.searchValue.set(value);
    this.search.emit(value);
  }
}
