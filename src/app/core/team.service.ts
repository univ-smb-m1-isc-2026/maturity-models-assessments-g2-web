import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TeamResponse } from '@models/team-response.model';
import { environment } from 'src/environments/environment';



@Injectable({ providedIn: 'root' })
export class TeamService {

  private readonly baseUrl = `${environment.apiUrl}/api/teams`;

  constructor(private http: HttpClient) {}

  // GET /api/teams — accessible à tous les utilisateurs authentifiés
  getTeams(): Observable<TeamResponse[]> {
    return this.http.get<TeamResponse[]>(this.baseUrl);
  }

  // GET /api/teams/:id
  getTeamById(id: number): Observable<TeamResponse> {
    return this.http.get<TeamResponse>(`${this.baseUrl}/${id}`);
  }

  // GET /api/teams/my-teams — TEAM_LEAD uniquement
  getMyTeams(): Observable<TeamResponse[]> {
    return this.http.get<TeamResponse[]>(`${this.baseUrl}/my-teams`);
  }

  // GET /api/teams/my-memberships — TEAM_MEMBER uniquement
  getMyMemberships(): Observable<TeamResponse[]> {
    return this.http.get<TeamResponse[]>(`${this.baseUrl}/my-memberships`);
  }

    // POST /api/teams — TEAM_LEAD uniquement
    createTeam(model: Pick<TeamResponse, 'name'>): Observable<TeamResponse> {
      console.log(model)
      return this.http.post<TeamResponse>(this.baseUrl, model);
    }

  // PUT /api/teams/:id — TEAM_LEAD uniquement (lead de l'équipe)
  updateTeam(id: number, model: Pick<TeamResponse, 'name'>): Observable<TeamResponse> {
    return this.http.put<TeamResponse>(`${this.baseUrl}/${id}`, model);
  }

  // DELETE /api/teams/:id — TEAM_LEAD uniquement (lead de l'équipe)
  deleteTeam(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // POST /api/teams/:id/invitations — TEAM_LEAD uniquement
  inviteMember(teamId: number, email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${teamId}/invitations`, { email });
  }
}