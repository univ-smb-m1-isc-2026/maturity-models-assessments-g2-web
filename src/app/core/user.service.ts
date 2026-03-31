import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '@models/user.model';
import { Role } from '@models/role.enum';

@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly apiUrl = '/api/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUsersByRole(role: Role): Observable<User[]> {
    const params = new HttpParams().set('role', role);
    return this.http.get<User[]>(this.apiUrl, { params });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  getUsersByIds(ids: number[]): Observable<User[]> {
    return this.http.post<User[]>(`${this.apiUrl}/batch`, ids);
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}