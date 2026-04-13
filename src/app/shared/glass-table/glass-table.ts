import { Component, input, output, contentChild, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
}

@Component({
  selector: 'app-glass-table',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div class="table-wrapper card-glass">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              @for (col of columns(); track col.key) {
                <th [style.width]="col.width || 'auto'">{{ col.label }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of data(); track row) {
              <tr (click)="rowClick.emit(row)" [class.clickable]="clickable()">
                @if (rowTemplate()) {
                  <ng-container *ngTemplateOutlet="rowTemplate()!; context: { $implicit: row, index: $index }" />
                } @else {
                  @for (col of columns(); track col.key) {
                    <td>{{ row[col.key] }}</td>
                  }
                }
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="columns().length" class="empty-row">
                  Sin datos disponibles
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .table-wrapper {
      overflow: hidden;
    }

    .table-scroll {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      padding: 1rem 1.25rem;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-gray-500);
      border-bottom: 2px solid var(--color-gray-200);
      white-space: nowrap;
      background: rgba(99, 102, 241, 0.02);
    }

    /* ::ng-deep needed because <td> from projected ng-template gets parent's encapsulation */
    :host ::ng-deep td {
      padding: 1rem 1.25rem;
      font-size: 0.8125rem;
      color: var(--color-gray-700);
      border-bottom: 1px solid var(--color-gray-200);
      line-height: 1.6;
      vertical-align: middle;
    }

    :host ::ng-deep tbody tr:last-child td {
      border-bottom: none;
    }

    :host ::ng-deep tbody tr {
      transition: background 0.15s ease;
    }

    :host ::ng-deep tbody tr:hover {
      background: rgba(99, 102, 241, 0.04);
    }

    :host ::ng-deep tbody tr.clickable {
      cursor: pointer;
    }

    :host ::ng-deep tbody tr.clickable:hover {
      background: rgba(99, 102, 241, 0.07);
    }

    .empty-row {
      text-align: center;
      color: var(--color-gray-400);
      padding: 3rem 1.25rem;
      font-size: 0.875rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlassTableComponent {
  columns = input<TableColumn[]>([]);
  data = input<any[]>([]);
  clickable = input(false);
  rowClick = output<any>();
  rowTemplate = contentChild<TemplateRef<any>>('row');
}
