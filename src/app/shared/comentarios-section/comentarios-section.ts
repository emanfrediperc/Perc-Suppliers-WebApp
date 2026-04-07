import { Component, input, signal, OnInit, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComentarioService, Comentario } from '../../services/comentario.service';

@Component({
  selector: 'app-comentarios-section',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="comentarios-section">
      <h3 class="section-title">Notas Internas ({{ comentarios().length }})</h3>

      <div class="add-comment">
        <textarea
          [(ngModel)]="nuevoComentario"
          placeholder="Agregar una nota..."
          class="comment-input"
          rows="2"
        ></textarea>
        <button class="btn-primary btn-sm" (click)="agregar()" [disabled]="!nuevoComentario.trim() || enviando()">
          @if (enviando()) { <span class="spinner"></span> }
          Agregar
        </button>
      </div>

      @for (c of comentarios(); track c._id) {
        <div class="comment-item">
          <div class="comment-header">
            <span class="comment-author">{{ c.autorNombre }}</span>
            <span class="comment-date">{{ c.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <p class="comment-text">{{ c.texto }}</p>
        </div>
      } @empty {
        <p class="no-comments">Sin notas</p>
      }
    </div>
  `,
  styles: [`
    .comentarios-section { margin-top: 1.5rem; }
    .section-title { font-size: 1rem; font-weight: 600; color: var(--color-gray-900); margin-bottom: 0.75rem; }
    .add-comment { display: flex; gap: 0.5rem; margin-bottom: 1rem; align-items: flex-start; }
    .comment-input {
      flex: 1; padding: 0.5rem 0.75rem; border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-md); font-size: 0.875rem; font-family: inherit;
      background: var(--glass-bg); color: var(--color-gray-900); resize: vertical;
    }
    .comment-input:focus { outline: none; border-color: var(--color-primary, #6366f1); }
    .btn-sm { padding: 0.5rem 1rem !important; font-size: 0.875rem !important; white-space: nowrap; }
    .comment-item {
      padding: 0.75rem; border-left: 3px solid var(--color-primary, #6366f1);
      background: var(--glass-bg); border-radius: 0 var(--radius-md) var(--radius-md) 0;
      margin-bottom: 0.5rem;
    }
    .comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
    .comment-author { font-size: 0.8125rem; font-weight: 600; color: var(--color-gray-700); }
    .comment-date { font-size: 0.75rem; color: var(--color-gray-400); }
    .comment-text { font-size: 0.875rem; color: var(--color-gray-600); margin: 0; line-height: 1.5; white-space: pre-wrap; }
    .no-comments { font-size: 0.875rem; color: var(--color-gray-400); font-style: italic; }
    .spinner {
      display: inline-block; width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 0.25rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class ComentariosSectionComponent implements OnInit {
  entidad = input.required<string>();
  entidadId = input.required<string>();

  comentarios = signal<Comentario[]>([]);
  nuevoComentario = '';
  enviando = signal(false);

  constructor(private comentarioService: ComentarioService) {
    // Re-load comments when entidadId changes
    effect(() => {
      const id = this.entidadId();
      if (id) {
        this.loadComentarios();
      }
    });
  }

  ngOnInit() {
    if (this.entidadId()) {
      this.loadComentarios();
    }
  }

  loadComentarios() {
    const entidad = this.entidad();
    const entidadId = this.entidadId();
    if (!entidad || !entidadId) return;
    this.comentarioService.getByEntidad(entidad, entidadId).subscribe({
      next: (data) => this.comentarios.set(data),
    });
  }

  agregar() {
    const texto = this.nuevoComentario.trim();
    if (!texto || this.enviando()) return;
    this.enviando.set(true);
    this.comentarioService.create({
      entidad: this.entidad(),
      entidadId: this.entidadId(),
      texto,
    }).subscribe({
      next: (comentario) => {
        this.comentarios.update(list => [comentario, ...list]);
        this.nuevoComentario = '';
        this.enviando.set(false);
      },
      error: () => this.enviando.set(false),
    });
  }
}
