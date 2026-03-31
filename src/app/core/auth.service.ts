import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, map, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { User } from '@models/user.model';
import { Role } from '@models/role.enum';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly API_URL = `${environment.apiUrl}/api/users`;
  private readonly AUTH_URL = `${environment.apiUrl}/api/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.restoreSession(); 
  }

  // Restaure l'utilisateur depuis le token au reload de la page
  private restoreSession(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.getMe().subscribe({
        next: (user) => this.currentUserSubject.next(user),
        error: () => this.logout()
      });
    }
  }

  // POST /auth/login
  login(email: string, password: string): Observable<User> {
    return this.http.post<{ token: string }>(`${this.AUTH_URL}/login`, { email, password }).pipe(
      tap(response =>{
        console.log("token stocké", response.token,)
        localStorage.setItem('token', response.token)
      } ),
      switchMap(() => this.getMe())
    );
  }

  // GET /users/me — récupère l'utilisateur courant via le token
  getMe(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/me`).pipe(
      tap(user => this.currentUserSubject.next(user))    
    );
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get currentUser$(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  isLoggedIn$(): Observable<boolean> {
    return this.currentUserSubject.asObservable().pipe(
      map(user => !!user)
    );
  }

  // POST /auth/register
  register(payload: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.AUTH_URL}/register`, payload); // 👈 Utilise AUTH_URL
  }

  // GET /users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.API_URL);
  }

  // GET /users/{id}
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${id}`);
  }

  // GET /users?role=ROLE
  getUsersByRole(role: Role): Observable<User[]> {
    return this.http.get<User[]>(this.API_URL, { params: { role } });
  }

  // POST /users/batch
  getUsersByIds(ids: number[]): Observable<User[]> {
    return this.http.post<User[]>(`${this.API_URL}/batch`, ids);
  }

  // PUT /users/{id}
  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/${id}`, user);
  }

  // DELETE /users/{id}
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  // POST /auth/invite
  inviteTeamMember(email: string): Observable<void> {
    return this.http.post<void>(`${this.AUTH_URL}/invite`, { email });
  }

  // GET /auth/invite/{token}
  getInvitationEmail(token: string): Observable<string> {
    return this.http.get<string>(`${this.AUTH_URL}/invite/${token}`);
  }
}