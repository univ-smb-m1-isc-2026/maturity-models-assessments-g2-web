import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Session } from '@models/session.model';
import { SessionStatus } from '@models/status.enum';

@Injectable({ providedIn: 'root' })
export class SessionService {

  private mockSessions: Session[] = [
    {
      id: 1,
      modelId: 1,
      teamId: 1,
      name: 'Évaluation Scrum Q1 2025',
      status: SessionStatus.ACTIVE,
      deadline: new Date('2025-03-31'),
      createdAt: new Date('2025-01-15')
    },
    {
      id: 2,
      modelId: 2,
      teamId: 2,
      name: 'Audit Cybersécurité NIST',
      status: SessionStatus.ACTIVE,
      deadline: new Date('2025-02-28'),
      createdAt: new Date('2025-01-10')
    },
    {
      id: 3,
      modelId: 3,
      teamId: 2,
      name: 'Évaluation DevOps T2',
      status: SessionStatus.CLOSED,
      deadline: new Date('2025-06-30'),
      createdAt: new Date('2025-03-01')
    },
    {
      id: 4,
      modelId: 1,
      teamId: 2,
      name: 'Scrum Avancé - Équipe B',
      status: SessionStatus.DRAFT,
      deadline: new Date('2025-04-15'),
      createdAt: new Date('2025-02-20')
    }
  ];

  getSessionById(id: number): Observable<Session | undefined> {
    // 🔌 API : return this.http.get<Session>(`/api/sessions/${id}`);
    const session = this.mockSessions.find(s => s.id === id);
    return of(session);
  }

  getSessionsByTeam(idTeam: number): Observable<Session[]> {
    // 🔌 API : return this.http.get<Session[]>(`/api/sessions?teamId=${idTeam}`);
    const sessions = this.mockSessions.filter(s => s.teamId === idTeam);
    return of(sessions);
  }

  getActiveSessionsByTeam(idTeam: number): Observable<Session[]> {
    // 🔌 API : return this.http.get<Session[]>(`/api/sessions?teamId=${idTeam}&status=ACTIVE`);
    const sessions = this.mockSessions.filter(
      s => s.teamId === idTeam && s.status === SessionStatus.ACTIVE
    );
    return of(sessions);
  }

  createSession(session: Omit<Session, 'id' | 'createdAt'>): Observable<Session> {
    // 🔌 API : return this.http.post<Session>('/api/sessions', session);
    const newSession: Session = {
      ...session,
      id: Date.now(),
      createdAt: new Date()
    };
    this.mockSessions.push(newSession);
    return of(newSession);
  }

  updateSession(id: number, changes: Partial<Session>): Observable<Session | undefined> {
    // 🔌 API : return this.http.patch<Session>(`/api/sessions/${id}`, changes);
    const index = this.mockSessions.findIndex(s => s.id === id);
    if (index === -1) return of(undefined);

    this.mockSessions[index] = { ...this.mockSessions[index], ...changes };
    return of(this.mockSessions[index]);
  }

  deleteSession(id: number): Observable<void> {
    // 🔌 API : return this.http.delete<void>(`/api/sessions/${id}`);
    this.mockSessions = this.mockSessions.filter(s => s.id !== id);
    return of(void 0);
  }
}