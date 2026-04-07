import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface SearchResults {
  ordenes: any[];
  facturas: any[];
  proveedores: any[];
  clientes: any[];
}

@Injectable({ providedIn: 'root' })
export class BusquedaService {
  constructor(private http: HttpClient) {}

  search(query: string) {
    return this.http.get<SearchResults>(`${environment.apiUrl}/busqueda`, { params: { q: query } });
  }
}
