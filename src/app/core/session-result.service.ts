import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { SessionResult } from '@models/session-result.model';
import { environment } from 'src/environments/environment';

export interface SessionResultPayload {
  values: number[]; // une valeur (1-5) par question, dans l'ordre du modèle
}

@Injectable({ providedIn: 'root' })
export class SessionResultService {

  private readonly baseUrl = `${environment.apiUrl}/api/sessions`;

  constructor(private http: HttpClient) {}

  /**
   * Soumet les réponses de l'utilisateur connecté pour une session.
   * POST /api/sessions/{sessionId}/results
   */
  submit(sessionId: number, payload: SessionResultPayload): Observable<SessionResult> {
    return this.http.post<SessionResult>(
      `${this.baseUrl}/${sessionId}/results`,
      payload
    );
  }

  /**
   * Tous les résultats agrégés d'une session (averages + participants).
   * GET /api/sessions/{sessionId}/results
   */
  getBySession(sessionId: number): Observable<SessionResult> {
    return this.http.get<SessionResult>(
      `${this.baseUrl}/${sessionId}/results`
    );
  }

  /**
   * Vérifie si l'utilisateur connecté a déjà soumis pour cette session
   * en cherchant son userId dans la liste des participants.
   * Retourne null si aucune soumission (404 → null).
   * GET /api/sessions/{sessionId}/results/me
   */
 getMyResult(sessionId: number): Observable<SessionResult | null> {
  return this.http.get<SessionResult>(
    `${this.baseUrl}/${sessionId}/results/me`
  ).pipe(
    catchError(err => {
      if (err.status === 404) return of(null);
      throw err;
    })
  );
}

  /**
   * Raccourci booléen pour le dashboard : a-t-on déjà soumis ?
   * GET /api/sessions/{sessionId}/results/me → true/false
   */
  hasSubmitted(sessionId: number): Observable<boolean> {
    return this.getMyResult(sessionId).pipe(
      map(result => result !== null)
    );
  }
}