import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, CurrencyPipe, UpperCasePipe } from '@angular/common';
import { AprobacionService, Aprobacion } from '../../../services/aprobacion.service';

@Component({
  selector: 'app-aprobaciones-list',
  standalone: true,
  imports: [DatePipe, CurrencyPipe, UpperCasePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Aprobaciones</h1>
        <div class="tabs">
          <button class="tab" [class.active]="tab() === 'pendientes'" (click)="setTab('pendientes')">
            Pendientes
            @if (pendientes().length > 0) { <span class="tab-badge">{{ pendientes().length }}</span> }
          </button>
          <button class="tab" [class.active]="tab() === 'historial'" (click)="setTab('historial')">Historial</button>
        </div>
      </div>

      <div class="card-list">
        @for (a of displayList(); track a._id) {
          <div class="approval-card" [class]="'status-' + a.estado">
            <div class="card-top">
              <div class="card-info">
                <span class="card-type">{{ a.tipo | uppercase }}</span>
                <span class="card-entity">{{ a.entidad }}</span>
              </div>
              <span class="status-pill" [class]="a.estado">{{ a.estado }}</span>
            </div>
            <p class="card-desc">{{ a.descripcion }}</p>
            <div class="card-meta">
              <span>Monto: {{ a.monto | currency:'ARS':'ARS ':'1.0-0' }}</span>
              <span>Solicitado por: {{ a.createdByEmail }}</span>
              <span>{{ a.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="card-progress">
              <span>{{ countAprobadas(a) }} / {{ a.aprobacionesRequeridas }} aprobaciones</span>
            </div>
            @if (a.estado === 'pendiente') {
              <div class="card-actions">
                <input type="text" class="comment-input" placeholder="Comentario (opcional)" #comentario>
                <button class="btn-approve" (click)="decidir(a._id, 'aprobada', comentario.value)">Aprobar</button>
                <button class="btn-reject" (click)="decidir(a._id, 'rechazada', comentario.value)">Rechazar</button>
              </div>
            }
            @if (a.aprobadores.length > 0) {
              <div class="card-approvers">
                @for (ap of a.aprobadores; track ap.userId) {
                  <div class="approver">
                    <span class="approver-decision" [class]="ap.decision">{{ ap.decision === 'aprobada' ? 'V' : 'X' }}</span>
                    <span>{{ ap.nombre }} - {{ ap.fecha | date:'dd/MM HH:mm' }}</span>
                    @if (ap.comentario) { <span class="approver-comment">{{ ap.comentario }}</span> }
                  </div>
                }
              </div>
            }
          </div>
        } @empty {
          <div class="empty">No hay aprobaciones {{ tab() === 'pendientes' ? 'pendientes' : 'en el historial' }}</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; }
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem; }
    .tabs { display: flex; gap: 0.5rem; }
    .tab {
      padding: 0.5rem 1rem;
      border: 1px solid var(--glass-border);
      background: var(--glass-bg);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--text-secondary);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .tab.active { background: var(--primary); color: white; border-color: var(--primary); }
    .tab-badge { background: #ef4444; color: white; font-size: 0.6875rem; padding: 0 6px; border-radius: 8px; font-weight: 700; }
    .card-list { display: flex; flex-direction: column; gap: 1rem; }
    .approval-card {
      background: var(--card-bg);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      padding: 1.25rem;
    }
    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .card-info { display: flex; gap: 0.5rem; }
    .card-type { font-size: 0.75rem; font-weight: 700; background: var(--glass-bg); padding: 0.25rem 0.5rem; border-radius: 6px; color: var(--primary); }
    .card-entity { font-size: 0.75rem; color: var(--text-muted); padding: 0.25rem 0.5rem; }
    .status-pill { font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.75rem; border-radius: 12px; }
    .status-pill.pendiente { background: #fef3c7; color: #92400e; }
    .status-pill.aprobada { background: #d1fae5; color: #065f46; }
    .status-pill.rechazada { background: #fee2e2; color: #991b1b; }
    .card-desc { font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.75rem; }
    .card-meta { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.75rem; }
    .card-progress { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.75rem; }
    .card-actions { display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem; }
    .comment-input {
      flex: 1;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      background: var(--glass-bg);
      color: var(--text-primary);
      font-size: 0.8125rem;
    }
    .btn-approve {
      padding: 0.5rem 1.25rem;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.8125rem;
    }
    .btn-reject {
      padding: 0.5rem 1.25rem;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.8125rem;
    }
    .card-approvers { margin-top: 0.75rem; border-top: 1px solid var(--glass-border); padding-top: 0.75rem; }
    .approver { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; }
    .approver-decision { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.625rem; font-weight: 700; }
    .approver-decision.aprobada { background: #d1fae5; color: #065f46; }
    .approver-decision.rechazada { background: #fee2e2; color: #991b1b; }
    .approver-comment { color: var(--text-muted); font-style: italic; }
    .empty { text-align: center; padding: 3rem; color: var(--text-muted); }
  `],
})
export class AprobacionesListComponent implements OnInit {
  tab = signal<'pendientes' | 'historial'>('pendientes');
  pendientes = signal<Aprobacion[]>([]);
  historial = signal<Aprobacion[]>([]);
  displayList = signal<Aprobacion[]>([]);

  constructor(private aprobacionService: AprobacionService, private router: Router) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.aprobacionService.getPendientes().subscribe(data => {
      this.pendientes.set(data);
      if (this.tab() === 'pendientes') this.displayList.set(data);
    });
    this.aprobacionService.getAll().subscribe(data => {
      this.historial.set(data.filter(a => a.estado !== 'pendiente'));
      if (this.tab() === 'historial') this.displayList.set(this.historial());
    });
  }

  setTab(t: 'pendientes' | 'historial') {
    this.tab.set(t);
    this.displayList.set(t === 'pendientes' ? this.pendientes() : this.historial());
  }

  countAprobadas(a: Aprobacion): number {
    return a.aprobadores.filter(ap => ap.decision === 'aprobada').length;
  }

  decidir(id: string, decision: string, comentario: string) {
    this.aprobacionService.decidir(id, decision, comentario || undefined).subscribe(() => this.load());
  }
}
