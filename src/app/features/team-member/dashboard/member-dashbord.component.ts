import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, switchMap, map, catchError } from 'rxjs/operators';

import { AuthService } from '@core/auth.service';
import { MaturityModelService } from '@core/maturity-model.service';
import { TeamService } from '@core/team.service';
import { SessionService } from '@core/session.service';
import { SessionResultService } from '@core/session-result.service';

import { MaturityModel } from '@models/maturity-model.model';
import { User } from '@models/user.model';
import { Team } from '@models/team.model';
import { Session } from '@models/session.model';
import { SessionResult } from '@models/session-result.model';
import { TeamResponse } from '@models/team-response.model';

export interface EvaluationItem {
  session: Session;
  model: MaturityModel;
  team: Team;
  isDone: boolean;
}

@Component({
  selector: 'app-team-member-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './member-dashboard.component.html',
  styleUrls: ['../../_dashboard.component.scss']
})
export class TeamMemberDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;

  teams: TeamResponse[] = [];
  sessions: Session[] = [];
  myResults: SessionResult[] = [];

  pendingEvaluations: EvaluationItem[] = [];
  completedEvaluations: EvaluationItem[] = [];

  isLoading = true;
  hasError = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private maturityModelService: MaturityModelService,
    private sessionService: SessionService,
    private sessionResultService: SessionResultService,
    private teamService: TeamService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    if (!this.currentUser) {
      this.hasError = true;
      this.isLoading = false;
      return;
    }

    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading = true;
    this.hasError = false;

    this.teamService.getMyMemberships()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((teams: TeamResponse[]) => {
          this.teams = teams;

          if (!teams.length) {
            return of({
              sessions: [] as Session[],
              results: [] as SessionResult[]
            });
          }

          const mappedTeams: Team[] = teams.map(team =>
            this.mapTeamResponseToTeam(team)
          );

          return this.loadSessionsAndResults(mappedTeams);
        })
      )
      .subscribe({
        next: ({ sessions, results }) => {
          this.sessions = sessions;
          this.myResults = results;
        this.buildEvaluationItems();

          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: err => {
          console.error('Erreur chargement dashboard membre :', err);
          this.hasError = true;
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  private loadSessionsAndResults(teams: Team[]) {
      const sessions$ = forkJoin(
      teams.map(team =>
        this.sessionService.getSessionsByTeam(team.id).pipe(
          catchError(() => of([] as Session[]))
        )
      )
    ).pipe(
      map((sessionsByTeam: Session[][]) => sessionsByTeam.flat()),
      map((sessions: Session[]) => {
        // évite les doublons éventuels
        const uniqueSessions = sessions.filter(
          (session, index, self) =>
            index === self.findIndex(s => s.id === session.id)
        );
        return uniqueSessions;
      })
    );

    return sessions$.pipe(
      switchMap((sessions: Session[]) => {
        if (!sessions.length) {
          return of({
            sessions: [] as Session[],
            results: [] as SessionResult[]
          });
        }

        const results$ = forkJoin(
          sessions.map(session =>
            this.sessionResultService.getMyResult(session.id).pipe(
              catchError(() => of(null))
            )
          )
        ).pipe(
          map(results =>
            results.filter((r): r is SessionResult => r !== null)
          )
        );

        return results$.pipe(
          map((results: SessionResult[]) => ({ sessions, results }))
        );
      })
    );
  }

  private buildEvaluationItems(): void {
    if (!this.sessions.length) {
      this.pendingEvaluations = [];
      this.completedEvaluations = [];
      return;
    }
   

    const items$ = forkJoin(
      this.sessions.map(session => {
        const teamResponse = this.teams.find(t => t.id === session.teamId);
        if (!teamResponse) return of(null);
        const team: Team = this.mapTeamResponseToTeam(teamResponse);
        const isDone = this.myResults.some(result => result.idSession === session.id);

        return this.maturityModelService.getModelById(session.modelId).pipe(
          catchError(() => of(null)),
          map(model => {
            if (!model) return null;

            return {
              session,
              model,
              team,
              isDone
            } as EvaluationItem;
          })
        );
      })
    );

    items$
      .pipe(
        map(items =>
          items
            .filter((item): item is EvaluationItem => item !== null)
            .sort(
              (a, b) =>
                new Date(a.session.deadline).getTime() -
                new Date(b.session.deadline).getTime()
            )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(items => {
        this.pendingEvaluations = items.filter(item => !item.isDone);
        this.completedEvaluations = items.filter(item => item.isDone);

        this.cdr.detectChanges();
      });
  }

  private mapTeamResponseToTeam(team: TeamResponse): Team {
    return {
      id: team.id,
      name: team.name,
      leadId: team.lead.id,
      memberIds: team.members.map(member => member.id),
      createdAt: team.createdAt ? new Date(team.createdAt) : undefined
    };
  }

  get overdueCount(): number {
    return this.pendingEvaluations.filter(item => this.isOverdue(item)).length;
  }

  isOverdue(item: EvaluationItem): boolean {
    return !item.isDone && new Date(item.session.deadline) < new Date();
  }

  goToEvaluation(item: EvaluationItem): void {
    this.router.navigate(['/member/evaluation', item.model.id], {
      queryParams: { sessionId: item.session.id }
    });
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