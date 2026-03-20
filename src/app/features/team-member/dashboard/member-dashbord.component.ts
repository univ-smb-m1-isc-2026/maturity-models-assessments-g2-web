import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, of, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '@core/auth.service';
import { MaturityModelService } from '@core/maturity-model.service';
import { TeamService } from '@core/team.service';
import { SessionService } from '@core/session.service';
import { MaturityModel } from '@models/maturity-model.model';
import { User } from '@models/user.model';
import { Team } from '@models/team.model';
import { Session } from '@models/session.model';
import { SessionStatus } from '@models/status.enum';

@Component({
  selector: 'app-team-member-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './member-dashboard.component.html',
  styleUrls: ['../../_dashboard.component.scss']
})
export class TeamMemberDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  currentTeam: Team | null = null;
  models: MaturityModel[] = [];
  selectedModel: MaturityModel | null = null;

  // 🔧 Mock évaluations — à remplacer par appel API
  evaluations = [
    { id: 1, modelTitle: 'Scrum Avancé',      date: new Date(), level: 'Défini',    score: 3 },
    { id: 2, modelTitle: 'Cybersécurité NIST', date: new Date(), level: 'Répétable', score: 2 },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private maturityModelService: MaturityModelService,
    private sessionService : SessionService,
    private teamService: TeamService, 
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    if (this.currentUser) {
      this.teamService.getTeamByUserid(this.currentUser.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (team) => this.currentTeam = team ?? null,
        error: () => console.error('Erreur chargement de l\'équipe')
      });
    }
      this.getModelBySession()
  }

  getActiveSession(): Observable<Session[]> {
  if (!this.currentTeam) return of([]);
  return this.sessionService.getActiveSessionsByTeam(this.currentTeam.id);
}

 getModelBySession(): void {
  this.sessionService.getActiveSessionsByTeam(this.currentTeam!.id).pipe(
    takeUntil(this.destroy$)
  ).subscribe({
    next: (sessions) => {
      sessions.forEach(session => {
        this.maturityModelService.getModelById(session.modelId).pipe( 
          takeUntil(this.destroy$)
        ).subscribe({
          next: (model) => { if (model) this.models.push(model) },
          error: () => console.error(`Erreur chargement modèle ${session.modelId}`)
        });
      });
    },
    error: () => console.error('Erreur chargement des sessions')
  });
}
  evaluer(): void {
    // TODO: récupère le model et dirige vers la page d'évaluation
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}