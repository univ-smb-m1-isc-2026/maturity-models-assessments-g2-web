import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, switchMap, map, catchError } from 'rxjs/operators';
import { AuthService } from '@core/auth.service';
import { MaturityModelService } from '@core/maturity-model.service';
import { SessionService } from '@core/session.service';
import { MaturityModel } from '@models/maturity-model.model';
import { User } from '@models/user.model';
import { TeamService } from '@core/team.service';
import { Team } from '@models/team.model';
import { UserService } from '@core/user.service';
import { Session } from '@models/session.model';
import { SessionStatus } from '@models/status.enum';

export interface TeamWithMembers extends Team {
  members: User[];
  pendingCount: number;
  activeCount: number;
}

@Component({
  selector: 'app-team-lead-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './team-lead-dashboard.component.html',
  styleUrls: ['../../_dashboard.component.scss']
})
export class TeamLeadDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  models: MaturityModel[] = [];
  teams: Team[] = [];
  teamsWithMembers: TeamWithMembers[] = [];
  teamMembers: User[] = [];
  sessions: Session[] = [];

  inviteForm!: FormGroup;
  sessionForm!: FormGroup;
  createTeamForm!: FormGroup;

  inviteSuccess: string = '';
  sessionSuccess: string = '';
  inviteError: string = '';
  sessionError: string = '';
  createTeamSuccess: string = '';
  createTeamError: string = '';

  isInviting: boolean = false;
  isSession: boolean = false;
  isCreatingTeam: boolean = false;
  isLoading: boolean = true;

  showInviteModal: boolean = false;
  showSessionModal: boolean = false;
  showCreateTeamModal: boolean = false;

  totalMembersCount: number = 0;
  pendingMembersCount: number = 0;
  activeMembersCount: number = 0;

  selectedTeam: TeamWithMembers | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private teamService: TeamService,
    private userService: UserService,
    private maturityModelService: MaturityModelService,
    private sessionService: SessionService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.inviteForm = this.fb.group({
      teamId: ['', Validators.required],
      email:  ['', [Validators.required, Validators.email]]
    });

    this.sessionForm = this.fb.group({
      teamId:   ['', Validators.required],
      modelId:  ['', Validators.required],
      name:     ['', [Validators.required, Validators.minLength(3)]],
      deadline: [null]
    });

    this.createTeamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.loadModels();
    this.loadTeamsAndMembers();
    this.loadSessions();
  }

  private loadModels(): void {
    this.maturityModelService.getModels().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (models) => {
        this.models = models;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement des modèles :', err)
    });
  }

  private loadTeamsAndMembers(): void {
    this.isLoading = true;

    this.teamService.getMyTeams().pipe(
      takeUntil(this.destroy$),
      switchMap((teams: Team[]) => {
        this.teams = teams;

        if (teams.length > 0) {
          this.inviteForm.patchValue({ teamId: teams[0].id });
          this.sessionForm.patchValue({ teamId: teams[0].id });
        }

        const memberIds = [...new Set(teams.flatMap(team => team.memberIds || []))];

        if (memberIds.length === 0) {
          return of({ teams, users: [] as User[] });
        }

        return forkJoin(
          memberIds.map(id =>
            this.userService.getUserById(id).pipe(
              catchError((err) => {
                console.error(`Erreur chargement user ${id}`, err);
                return of(null);
              })
            )
          )
        ).pipe(
          map(users => ({
            teams,
            users: users.filter((u): u is User => u !== null)
          }))
        );
      })
    ).subscribe({
      next: ({ teams, users }) => {
        this.teamMembers = users;

        this.teamsWithMembers = teams.map(team => {
          const members = (team.memberIds || [])
            .map(id => users.find(u => u.id === id))
            .filter((u): u is User => u !== undefined);

          const pendingCount = members.filter(u => u.status === 'En attente').length;
          const activeCount  = members.filter(u => u.status !== 'En attente').length;

          return { ...team, members, pendingCount, activeCount };
        });

        this.totalMembersCount   = users.length;
        this.pendingMembersCount = users.filter(u => u.status === 'En attente').length;
        this.activeMembersCount  = users.filter(u => u.status !== 'En attente').length;

        if (!this.selectedTeam && this.teamsWithMembers.length > 0) {
          this.selectedTeam = this.teamsWithMembers[0];
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement équipes/membres :', err);
        this.isLoading = false;
      }
    });
  }

  private loadSessions(): void {
    this.sessionService.getSessions().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement des sessions :', err)
    });
  }

  // --- Helpers template ---

  getTeamName(teamId: number): string {
    return this.teams.find(t => t.id === teamId)?.name ?? '—';
  }

  getModelName(modelId: number): string {
    return this.models.find(m => m.id === modelId)?.title ?? '—';
  }

  getStatusLabel(status: SessionStatus): string {
    const labels: Record<SessionStatus, string> = {
      [SessionStatus.ACTIVE]:  'Active',
      [SessionStatus.CLOSED]:  'Terminée',
      [SessionStatus.DRAFT]:   'Brouillon',
    };
    return labels[status] ?? status;
  }

  getStatusClass(status: SessionStatus): string {
    const classes: Record<SessionStatus, string> = {
      [SessionStatus.ACTIVE]:  'active',
      [SessionStatus.CLOSED]:  'closed',
      [SessionStatus.DRAFT]:   'draft',
    };
    return classes[status] ?? '';
  }

  isDeadlineSoon(deadline?: Date): boolean {
    if (!deadline) return false;
    const diff = deadline.getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000; // moins de 7 jours
  }

  isDeadlinePassed(deadline?: Date): boolean {
    if (!deadline) return false;
    return deadline.getTime() < Date.now();
  }

  selectTeam(team: TeamWithMembers): void {
    this.selectedTeam = team;
  }

  // --- Modals invite ---

  openInviteModal(): void {
    this.showInviteModal = true;
  }

  closeInviteModal(): void {
    this.showInviteModal = false;
    this.inviteForm.reset();
    if (this.teams.length > 0) {
      this.inviteForm.patchValue({ teamId: this.teams[0].id });
    }
    this.inviteSuccess = '';
    this.inviteError = '';
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) return;

    this.isInviting = true;
    this.inviteSuccess = '';
    this.inviteError = '';

    const { teamId, email } = this.inviteForm.value;

    this.teamService.inviteMember(teamId, email).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isInviting = false;
        this.inviteError = "";
        this.inviteSuccess = `Invitation envoyée à ${email}`;
        this.inviteForm.patchValue({ email: '' });
        this.cdr.detectChanges();
      },
      error: () => {
        this.isInviting = false;
        this.inviteError = "Erreur lors de l'envoi de l'invitation";
      }
    });
  }

  // --- Modals session ---

  openSessionModal(): void {
    this.showSessionModal = true;
    this.sessionForm.reset();
    this.sessionSuccess = '';
    this.sessionError = '';
    if (this.teams.length > 0) {
      this.sessionForm.patchValue({ teamId: this.teams[0].id });
    }
  }

  closeSessionModal(): void {
    this.showSessionModal = false;
    this.sessionForm.reset();
    this.sessionSuccess = '';
    this.sessionError = '';
  }

  startSession(): void {
    if (this.sessionForm.invalid) return;

    this.isSession = true;
    this.sessionSuccess = '';
    this.sessionError = '';

    const { teamId, modelId, name, deadline } = this.sessionForm.value;

    const session: Omit<Session, 'id' | 'createdAt'> = {
      teamId:   +teamId,
      modelId:  +modelId,
      name,
      status:   SessionStatus.DRAFT,
      deadline: deadline ? new Date(deadline) : undefined
    };

    this.sessionService.createSession(session).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (created) => {
        this.isSession = false;
        this.sessionSuccess = 'Session créée avec succès';
        this.sessions = [...this.sessions, created];
        this.closeSessionModal();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSession = false;
        this.sessionError = 'Erreur lors de la création de la session';
      }
    });
  }

  deleteSession(id: number): void {
    this.sessionService.deleteSession(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.sessions = this.sessions.filter(s => s.id !== id);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur suppression session :', err)
    });
  }

  // --- Modals création d'équipe ---

  openCreateTeamModal(): void {
    this.showCreateTeamModal = true;
  }

  closeCreateTeamModal(): void {
    this.showCreateTeamModal = false;
    this.createTeamForm.reset();
    this.createTeamSuccess = '';
    this.createTeamError = '';
  }

  createTeam(): void {
    if (this.createTeamForm.invalid) return;

    this.isCreatingTeam = true;
    this.createTeamSuccess = '';
    this.createTeamError = '';

    const name = this.createTeamForm.value;

    this.teamService.createTeam(name).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isCreatingTeam = false;
        this.createTeamSuccess = `Équipe "${name.name}" créée avec succès`;
        this.loadTeamsAndMembers();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isCreatingTeam = false;
        this.createTeamError = "Erreur lors de la création de l'équipe";
      }
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