import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';

import { AuthService } from '@core/auth.service';
import { MaturityModelService } from '@core/maturity-model.service';
import { TeamService } from '@core/team.service';
import { SessionService } from '@core/session.service';

import { MaturityModel } from '@models/maturity-model.model';
import { User } from '@models/user.model';
import { Team } from '@models/team.model';
import { Session } from '@models/session.model';

@Component({
  selector: 'app-team-member-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './member-dashboard.component.html',
  styleUrls: ['../../_dashboard.component.scss']
})
export class TeamMemberDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  teams: Team[] = [];
  models: MaturityModel[] = [];
  selectedModel: MaturityModel | null = null;

  // Mock évaluations — à remplacer par appel API
  evaluations = [
    { id: 1, modelTitle: 'Scrum Avancé', date: new Date(), level: 'Défini', score: 3 },
    { id: 2, modelTitle: 'Cybersécurité NIST', date: new Date(), level: 'Répétable', score: 2 },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private maturityModelService: MaturityModelService,
    private sessionService: SessionService,
    private teamService: TeamService,
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    if (!this.currentUser) return;

    this.teamService.getMyMemberships()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((teams: Team[]) => {
          this.teams = teams;

          if (!teams.length) {
            return of([]);
          }

          // Récupère toutes les sessions actives de toutes les équipes
          const sessionRequests = teams.map(team =>
            this.sessionService.getActiveSessionsByTeam(team.id)
          );

          return forkJoin(sessionRequests);
        }),
        switchMap((sessionsByTeam: Session[][]) => {
          const allSessions = sessionsByTeam.flat();

          if (!allSessions.length) {
            return of([]);
          }

          // Évite les doublons de modèles
          const uniqueModelIds = [...new Set(allSessions.map(session => session.modelId))];

          const modelRequests = uniqueModelIds.map(modelId =>
            this.maturityModelService.getModelById(modelId)
          );

          return forkJoin(modelRequests);
        })
      )
      .subscribe({
        next: (models: MaturityModel[]) => {
          this.models = models.filter(model => !!model);
        },
        error: (err) => {
          console.error('Erreur chargement dashboard membre :', err);
        }
      });
  }

  getActiveSession(teamId: number) {
    return this.sessionService.getActiveSessionsByTeam(teamId);
  }

  evaluer(modelId: number): void {
    this.router.navigate(['/member/evaluation', modelId]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}