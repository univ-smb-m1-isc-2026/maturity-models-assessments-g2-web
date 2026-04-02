import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Session } from '@models/session.model';
import { SessionStatus } from '@models/status.enum';
import { environment } from '../../environments/environment';;



@Injectable({ providedIn: 'root' })
export class SessionService {

  private readonly baseUrl = `${environment.apiUrl}/api/sessions`;

  constructor(private http: HttpClient) {}
  getSessionById(id: number): Observable<Session> {
    return this.http.get<Session>(`${this.baseUrl}/${id}`);
  }

  getSessionsByTeam(teamId: number): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.baseUrl}/by-team/${teamId}`);
  }

  getActiveSessionsByTeam(teamId: number): Observable<Session[]> {
    return new Observable(observer => {
      this.getSessionsByTeam(teamId).subscribe({
        next: sessions => {
          observer.next(sessions.filter(s => s.status === SessionStatus.OPEN));
          observer.complete();
        },
        error: err => observer.error(err)
      });
    });
  }

  getSessionsByModel(modelId: number): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.baseUrl}/by-model/${modelId}`);
  }

  getSessions(): Observable<Session[]> {
    return this.http.get<Session[]>(this.baseUrl);
  }

  createSession(session: Omit<Session, 'id' | 'createdAt'>): Observable<Session> {
    return this.http.post<Session>(this.baseUrl, session);
  }

  deleteSession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}