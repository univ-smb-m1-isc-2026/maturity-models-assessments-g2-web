import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';              
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';               
import { User } from '@models/user.model';
import { Role } from '@models/role.enum';

/**
 * Service central d'authentification de l'application.
 *
 * Responsabilités :
 * - Gérer la session utilisateur via un BehaviorSubject (état réactif)
 * - Authentifier et déconnecter l'utilisateur
 * - Persister le token JWT dans le localStorage
 * - Exposer l'état de connexion sous forme d'Observable pour les composants et guards
 * - Gérer l'inscription et les invitations de membres
 *
 * Note : les méthodes `login` et `register` utilisent actuellement des mocks locaux.
 * Les appels API réels sont préparés en commentaire et prêts à être activés.
 */


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject = new BehaviorSubject<User | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router 
  ) {}

login(email: string, password: string): Observable<User> {

  // mock - à supprimer 
  const mockUsers: Record<string, User> = {
    'pmo@test.com': {
      id: 1,
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'pmo@test.com',
      password: 'password123',
      role: Role.PMO
    },
    'teamlead@test.com': {
      id: 2,
      firstName: 'Bob',
      lastName: 'Dupont',
      email: 'teamlead@test.com',
      password: 'password123',
      role: Role.TEAM_LEAD
    },
    'member@test.com': {
      id: 3,
      firstName: 'Charlie',
      lastName: 'Durand',
      email: 'member@test.com',
      password: 'password123',
      role: Role.TEAM_MEMBER
    }
  };

  const user = mockUsers[email];

  if (!user) {
    return throwError(() => new Error('Utilisateur introuvable'));
  }

  if (user.password !== password) {
    return throwError(() => new Error('Mot de passe incorrect'));
  }

  const mockToken = `mock-token-${user.role}-${Date.now()}`;

  return of({ user, token: mockToken }).pipe(
    delay(500), 
    tap(response => {
      this.currentUserSubject.next(response.user);
      localStorage.setItem('token', response.token);
    }),
    map(response => response.user)
  );

  // Appel API réel :
  // return this.http.post<{ user: User; token: string }>('/api/auth/login', { email, password }).pipe(
  //   tap(response => {
  //     this.currentUserSubject.next(response.user);
  //     localStorage.setItem('token', response.token);
  //   }),
  //   map(response => response.user)
  // );
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

  isLoggedIn$(): Observable<boolean> {
    return this.currentUserSubject.asObservable().pipe(
      map(user => !!user)
    );
  }

  
  register(payload: Partial<User>): Observable<User> {
    //  Mock temporaire — à remplacer par l'appel API
    const mockUser: User = {
      id: 1,
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@email.com',
      password: 'password123',
      role: Role.TEAM_MEMBER
    };
    return of(mockUser);

    // Appel API réel :
    // return this.http.post<User>('/api/auth/register', payload);
  }

  inviteTeamMember(email: string): Observable<void> {
    return this.http.post<void>('/api/auth/invite', { email }); // TODO : url à changer
  }

  getInvitationEmail(token: string): Observable<string> {
    return this.http.get<string>(`/api/auth/invite/${token}`); // TODO : url à changer
  }
}