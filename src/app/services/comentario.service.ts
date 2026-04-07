import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Comentario {
  _id: string;
  entidad: string;
  entidadId: string;
  texto: string;
  autorEmail: string;
  autorNombre: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ComentarioService {
  private url = `${environment.apiUrl}/comentarios`;
  constructor(private http: HttpClient) {}

  getByEntidad(entidad: string, entidadId: string) {
    return this.http.get<Comentario[]>(this.url, {
      params: new HttpParams().set('entidad', entidad).set('entidadId', entidadId),
    });
  }

  create(data: { entidad: string; entidadId: string; texto: string }) {
    return this.http.post<Comentario>(this.url, data);
  }

  delete(id: string) {
    return this.http.delete(`${this.url}/${id}`);
  }
}
