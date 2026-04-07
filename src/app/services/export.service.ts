import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExportService {
  constructor(private http: HttpClient) {}

  download(endpoint: string, formato: string = 'xlsx', params: Record<string, any> = {}) {
    const url = `${environment.apiUrl}/${endpoint}`;
    const clean: Record<string, string> = { formato };
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== '') clean[k] = String(v);
    }
    const queryParams = new URLSearchParams(clean);
    this.http.get(`${url}?${queryParams.toString()}`, { responseType: 'blob' }).subscribe(blob => {
      const ext = formato === 'csv' ? 'csv' : 'xlsx';
      const filename = `${endpoint.replace(/\//g, '-')}.${ext}`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }
}
