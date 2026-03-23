import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User, Status } from '@models/user.model';
import { Role } from '@models/role.enum';

@Injectable({ providedIn: 'root' })
export class UserService {

  // 🔧 Mock — à remplacer par appels HTTP
  private mockUsers: User[] = [
    // ---- PMO ----
    {
      id: 1,
      firstName: 'Sophie',
      lastName:  'Lambert',
      email:     'sophie.lambert@test.com',
      password:  'password123',
      role:       Role.PMO,
      status:     Status.ACTIF
    },

    // ---- TEAM LEADS ----
    {
      id: 2,
      firstName: 'Bob',
      lastName:  'Dupont',
      email:     'bob.dupont@test.com',
      password:  'password123',
      role:       Role.TEAM_LEAD,
      status:     Status.ACTIF
    },
    {
      id: 3,
      firstName: 'Emma',
      lastName:  'Bernard',
      email:     'emma.bernard@test.com',
      password:  'password123',
      role:       Role.TEAM_LEAD,
      status:     Status.ACTIF
    },

    // ---- TEAM MEMBERS ----
    {
      id: 4,
      firstName: 'Alice',
      lastName:  'Martin',
      email:     'alice.martin@test.com',
      password:  'password123',
      role:       Role.TEAM_MEMBER,
      status:     Status.ACTIF
    },
    {
      id: 5,
      firstName: 'Charlie',
      lastName:  'Durand',
      email:     'charlie.durand@test.com',
      password:  'password123',
      role:       Role.TEAM_MEMBER,
      status:     Status.ATTENTE
    },
    {
      id: 6,
      firstName: 'David',
      lastName:  'Petit',
      email:     'david.petit@test.com',
      password:  'password123',
      role:       Role.TEAM_MEMBER,
      status:     Status.ACTIF
    },
    {
      id: 7,
      firstName: 'Lucie',
      lastName:  'Moreau',
      email:     'lucie.moreau@test.com',
      password:  'password123',
      role:       Role.TEAM_MEMBER,
      status:     Status.ACTIF
    },
    {
      id: 8,
      firstName: 'Marc',
      lastName:  'Leroy',
      email:     'marc.leroy@test.com',
      password:  'password123',
      role:       Role.TEAM_MEMBER,
      status:     Status.ATTENTE
    },
  ];

  // ✅ Récupère tous les users
  getUsers(): Observable<User[]> {
    return of(this.mockUsers);
    // return this.http.get<User[]>('/api/users');
  }

  // ✅ Récupère les users par rôle
  getUsersByRole(role: Role): Observable<User[]> {
    return of(this.mockUsers.filter(u => u.role === role));
    // return this.http.get<User[]>(`/api/users?role=${role}`);
  }

  // ✅ Récupère un user par id
  getUserById(id: number): Observable<User | undefined> {
    return of(this.mockUsers.find(u => u.id === id));
    // return this.http.get<User>(`/api/users/${id}`);
  }

  // ✅ Récupère les users par liste d'ids
  getUsersByIds(ids: number[]): Observable<User[]> {
    return of(this.mockUsers.filter(u => ids.includes(u.id)));
    // return this.http.post<User[]>('/api/users/batch', { ids });
  }
}