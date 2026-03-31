import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Team } from '@models/team.model';
import { environment } from 'src/environments/environment.development';


@Injectable({ providedIn: 'root' })
export class TeamService {

  private readonly baseUrl = `${environment.apiUrl}/api/teams`;

  constructor(private http: HttpClient) {}

  // GET /api/teams — accessible à tous les utilisateurs authentifiés
  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(this.baseUrl);
  }

  // GET /api/teams/:id
  getTeamById(id: number): Observable<Team> {
    return this.http.get<Team>(`${this.baseUrl}/${id}`);
  }

  // GET /api/teams/my-teams — TEAM_LEAD uniquement
  getMyTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.baseUrl}/my-teams`);
  }

  // GET /api/teams/my-memberships — TEAM_MEMBER uniquement
  getMyMemberships(): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.baseUrl}/my-memberships`);
  }

    // POST /api/teams — TEAM_LEAD uniquement
    createTeam(model: Pick<Team, 'name'>): Observable<Team> {
      console.log(model)
      return this.http.post<Team>(this.baseUrl, model);
    }

  // PUT /api/teams/:id — TEAM_LEAD uniquement (lead de l'équipe)
  updateTeam(id: number, model: Pick<Team, 'name'>): Observable<Team> {
    return this.http.put<Team>(`${this.baseUrl}/${id}`, model);
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