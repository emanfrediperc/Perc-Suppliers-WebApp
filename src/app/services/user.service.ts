import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface UserAdmin {
  _id: string;
  email: string;
  nombre: string;
  apellido: string;
  role: string;
  activo: boolean;
  createdAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private url = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<UserAdmin[]>(`${this.url}/users`);
  }

  create(dto: CreateUserDto) {
    return this.http.post<{ user: UserAdmin; access_token?: string }>(`${this.url}/register`, dto);
  }

  update(id: string, data: { role?: string; activo?: boolean; nombre?: string; apellido?: string }) {
    return this.http.patch<UserAdmin>(`${this.url}/users/${id}`, data);
  }

  resetPassword(id: string) {
    return this.http.patch<{ temporaryPassword: string }>(`${this.url}/users/${id}/reset-password`, {});
  }
}
