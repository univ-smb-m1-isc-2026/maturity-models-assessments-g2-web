import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SessionResult } from '@models/session-result.model';

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {

  private apiUrl = 'http://localhost:8080/api/evaluations';

  constructor(private http: HttpClient) {}

  submit(payload: any): Observable<SessionResult> {
    return this.http.post<SessionResult>(this.apiUrl, payload);
  }
}