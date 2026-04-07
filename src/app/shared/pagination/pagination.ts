import { Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (totalPages() > 1) {
      <div class="pagination">
        <button class="page-btn" [disabled]="currentPage() <= 1" (click)="pageChange.emit(currentPage() - 1)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        @for (p of pages(); track p) {
          <button class="page-btn" [class.active]="p === currentPage()" (click)="pageChange.emit(p)">{{ p }}</button>
        }
        <button class="page-btn" [disabled]="currentPage() >= totalPages()" (click)="pageChange.emit(currentPage() + 1)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <span class="page-info">{{ currentPage() }} de {{ totalPages() }}</span>
      </div>
    }
  `,
  styles: [`
    .pagination { display: flex; align-items: center; gap: 0.25rem; justify-content: center; margin-top: 1rem; }
    .page-btn {
      display: flex; align-items: center; justify-content: center;
      min-width: 36px; height: 36px; padding: 0 0.5rem;
      border: 1px solid var(--color-gray-200); border-radius: var(--radius-md);
      background: var(--glass-bg); color: var(--color-gray-700);
      font-size: 0.875rem; cursor: pointer; transition: all var(--transition-fast);
      backdrop-filter: blur(10px);
    }
    .page-btn:hover:not(:disabled) { background: var(--glass-hover-bg); border-color: var(--color-gray-300); }
    .page-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-info { font-size: 0.75rem; color: var(--color-gray-500); margin-left: 0.5rem; }
  `],
})
export class PaginationComponent {
  currentPage = input(1);
  totalPages = input(1);
  pageChange = output<number>();

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });
}
