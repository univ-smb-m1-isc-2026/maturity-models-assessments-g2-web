import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Team } from '@models/team.model';

@Injectable({ providedIn: 'root' })
export class TeamService {

  // 🔧 Mock — à remplacer par appels HTTP
private mockTeam: Team[] = [
  {
    id: 1,
    name: 'Équipe Alpha',
    leadId: 1,
    memberIds: [2, 3, 4],
    createdAt: new Date('2024-09-01')
  },
  {
    id: 2,
    name: 'Équipe Beta',
    leadId: 5,
    memberIds: [6, 7, 8],
    createdAt: new Date('2024-10-15')
  },
  {
    id: 3,
    name: 'Équipe Gamma',
    leadId: 9,
    memberIds: [10, 11, 12],
    createdAt: new Date('2025-01-20')
  }
];

  // Récupère toutes les teams
  getTeams(): Observable<Team[]> {
    return of(this.mockTeam);
    // return this.http.get<Team[]>('/api/teams');
  }

  getTeamById(id: number): Observable<Team> {
    return of(this.mockTeam.find(m => m.id === id)!);
  }

  getTeamByUserid(id: number): Observable<Team | undefined> {
    const team = this.mockTeam.find(m => m.memberIds.includes(id));
    return of(team);
  }

  createTeam(model: Omit<Team, 'id' | 'createdAt'>): Observable<Team> {
    const newTeam: Team = {
      ...model,
      id:        Date.now(),
      createdAt: new Date()
    };
    this.mockTeam.push(newTeam);
    return of(newTeam);
  }

  updateTeam(id: number, model: Partial<Team>): Observable<Team> {
    const index = this.mockTeam.findIndex(m => m.id === id);
    this.mockTeam[index] = { ...this.mockTeam[index], ...model };
    return of(this.mockTeam[index]);
  }

  deleteTeam(id: number): Observable<void> {
    this.mockTeam = this.mockTeam.filter(m => m.id !== id);
    return of(void 0);
  }
}