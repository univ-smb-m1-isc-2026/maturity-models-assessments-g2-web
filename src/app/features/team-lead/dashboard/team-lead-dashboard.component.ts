import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';

import { AuthService } from '@core/auth.service';
import { MaturityModelService } from '@core/maturity-model.service';
import { SessionService } from '@core/session.service';
import { TeamService } from '@core/team.service';

import { MaturityModel } from '@models/maturity-model.model';
import { User } from '@models/user.model';
import { Session } from '@models/session.model';
import { SessionStatus } from '@models/status.enum';
import { TeamResponse } from '@models/team-response.model';
import { SessionResult } from '@models/session-result.model';
import { Team } from '@models/team.model';

import { AbstractControl, ValidationErrors } from '@angular/forms';

import { SessionResultsPopupComponent } from '@features/team-member/result/session-result-popup.component';


// ── Interface locale enrichie ────────────────────────────────────────────────
export interface TeamWithMembers {
  id: number;
  name: string;
  lead: User;
  members: User[];
  createdAt: string;
  totalCount: number;
}

export interface EvaluationItem {
  session: Session;
  model: MaturityModel;
  team: Team;
  isDone: boolean;
}

@Component({
  selector: 'app-team-lead-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule,SessionResultsPopupComponent],
  templateUrl: './team-lead-dashboard.component.html',
  styleUrls: ['../../_dashboard.component.scss']
})
export class TeamLeadDashboardComponent implements OnInit, OnDestroy {

  // ── Données ──────────────────────────────────────────────────────────────
  currentUser: User | null = null;
  models: MaturityModel[] = [];
  teamsWithMembers: TeamWithMembers[] = [];
  sessions: Session[] = [];
  selectedTeam: TeamWithMembers | null = null;

  // ── Formulaires ──────────────────────────────────────────────────────────
  inviteForm!: FormGroup;
  sessionForm!: FormGroup;
  createTeamForm!: FormGroup;

  // ── Feedback ─────────────────────────────────────────────────────────────
  inviteSuccess  = '';
  inviteError    = '';
  sessionSuccess = '';
  sessionError   = '';
  createTeamSuccess = '';
  createTeamError   = '';

  // ── UI ────────────────────────────────────────────────────────────────────
  isInviting     = false;
  isSession      = false;
  isCreatingTeam = false;
  isLoading      = true;

  showInviteModal     = false;
  showSessionModal    = false;
  showCreateTeamModal = false;

  isResultsOpen = false;
  selectedSession: Session | null = null;
  selectedModel: MaturityModel | null = null;
  selectedResult: SessionResult | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private teamService: TeamService,
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
      deadline: [null, this.deadlineNotPast.bind(this)]
    });

    this.createTeamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.loadModels();
    this.loadTeams();
    this.loadSessions();
  }

  // ── Chargement ────────────────────────────────────────────────────────────

  private loadModels(): void {
    this.maturityModelService.getModels()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: models => { this.models = models; this.cdr.detectChanges(); },
        error: err => console.error('Erreur chargement des modèles :', err)
      });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Récupère les équipes du lead — TeamResponse contient déjà les membres
  // GET /api/teams/mine → TeamResponse[]
  // ─────────────────────────────────────────────────────────────────────────
  private loadTeams(): void {
    this.isLoading = true;

    this.teamService.getMyTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (teams: TeamResponse[]) => {
          // Construit TeamWithMembers directement depuis la réponse backend
          this.teamsWithMembers = teams.map(team => ({
            ...team,
            totalCount: team.members.length
          }));

          // Pré-sélections formulaires
          if (teams.length > 0) {
            this.inviteForm.patchValue({ teamId: teams[0].id });
            this.sessionForm.patchValue({ teamId: teams[0].id });
            this.selectedTeam = this.teamsWithMembers[0];
          }

          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: err => {
          console.error('Erreur chargement équipes :', err);
          this.isLoading = false;
        }
      });
  }

  private loadSessions(): void {
    this.sessionService.getSessions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: sessions => { this.sessions = sessions; this.cdr.detectChanges(); },
        error: err => console.error('Erreur chargement des sessions :', err)
      });
  }

  // ── Getters template ──────────────────────────────────────────────────────

  get totalMembersCount(): number {
    return this.teamsWithMembers.reduce((sum, t) => sum + t.totalCount, 0);
  }

  getTeamName(teamId: number): string {
    return this.teamsWithMembers.find(t => t.id === teamId)?.name ?? '—';
  }

  getModelName(modelId: number): string {
    return this.models.find(m => m.id === modelId)?.title ?? '—';
  }

  getMemberFullName(member: User): string {
    return `${member.firstName} ${member.lastName}`;
  }

  getStatusLabel(status: SessionStatus): string {
    const labels: Record<SessionStatus, string> = {
      [SessionStatus.OPEN]: 'Active',
      [SessionStatus.CLOSED]:  'Terminée',
    };
    return labels[status] ?? status;
  }

  getStatusClass(status: SessionStatus): string {
    const classes: Record<SessionStatus, string> = {
      [SessionStatus.OPEN]: 'Active',
      [SessionStatus.CLOSED]:  'Terminée',
    };
    return classes[status] ?? '';
  }

  isDeadlineSoon(deadline?: Date): boolean {
    if (!deadline) return false;
    const diff = new Date(deadline).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  }

  isDeadlinePassed(deadline?: Date): boolean {
    if (!deadline) return false;
    return new Date(deadline).getTime() < Date.now();
  }

  selectTeam(team: TeamWithMembers): void {
    this.selectedTeam = team;
  }

  // ── Invite modal ──────────────────────────────────────────────────────────

  openInviteModal(): void {
    this.showInviteModal = true;
  }

  closeInviteModal(): void {
    this.showInviteModal = false;
    this.inviteForm.reset();
    if (this.teamsWithMembers.length > 0) {
      this.inviteForm.patchValue({ teamId: this.teamsWithMembers[0].id });
    }
    this.inviteSuccess = '';
    this.inviteError   = '';
    this.cdr.detectChanges();
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) return;

    this.isInviting    = true;
    this.inviteSuccess = '';
    this.inviteError   = '';

    const { teamId, email } = this.inviteForm.value;

    this.teamService.inviteMember(teamId, email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isInviting    = false;
          this.inviteError   = '';
          this.inviteSuccess = `Invitation envoyée à ${email}`;
          this.inviteForm.patchValue({ email: '' });
          this.cdr.detectChanges();
        },
        error: () => {
          this.isInviting  = false;
          this.inviteError = "Erreur lors de l'envoi de l'invitation";
          this.cdr.detectChanges();
        }
      });
  }

  // ── Session modal ─────────────────────────────────────────────────────────

  openSessionModal(): void {
    this.showSessionModal = true;
    this.sessionForm.reset();
    this.sessionSuccess   = '';
    this.sessionError     = '';
    if (this.teamsWithMembers.length > 0) {
      this.sessionForm.patchValue({ teamId: this.teamsWithMembers[0].id });
    }
  }

  closeSessionModal(): void {
    this.showSessionModal = false;
    this.sessionForm.reset();
    this.sessionSuccess   = '';
    this.sessionError     = '';
  }

  startSession(): void {
    if (this.sessionForm.invalid) return;

    this.isSession     = true;
    this.sessionSuccess = '';
    this.sessionError   = '';

    const { teamId, modelId, name, deadline } = this.sessionForm.value;

    const payload: Omit<Session, 'id' | 'createdAt'> = {
      teamId:   +teamId,
      modelId:  +modelId,
      name,
      status:   SessionStatus.OPEN,
      deadline: new Date(deadline) 
    };

    this.sessionService.createSession(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: created => {
          this.isSession    = false;
          this.sessionSuccess = 'Session créée avec succès';
          this.sessions       = [...this.sessions, created];
          this.closeSessionModal();
          this.cdr.detectChanges();
        },
        error: () => {
          this.isSession  = false;
          this.sessionError = 'Erreur lors de la création de la session';
        }
      });
  }

  deleteSession(id: number): void {
    this.sessionService.deleteSession(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.sessions = this.sessions.filter(s => s.id !== id);
          this.cdr.detectChanges();
        },
        error: err => console.error('Erreur suppression session :', err)
      });
  }

  private deadlineNotPast(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) {
    return null; // deadline facultative → pas d'erreur si vide
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // on se place au début de la journée

  const selected = new Date(value);
  selected.setHours(0, 0, 0, 0);

  return selected < today ? { pastDeadline: true } : null;
}

  // ── Création équipe modal ─────────────────────────────────────────────────

  openCreateTeamModal(): void {
    this.showCreateTeamModal = true;
  }

  closeCreateTeamModal(): void {
    this.showCreateTeamModal = false;
    this.createTeamForm.reset();
    this.createTeamSuccess = '';
    this.createTeamError   = '';
  }

  createTeam(): void {
    if (this.createTeamForm.invalid) return;

    this.isCreatingTeam    = true;
    this.createTeamSuccess = '';
    this.createTeamError   = '';

    const { name } = this.createTeamForm.value;

    this.teamService.createTeam({ name })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isCreatingTeam    = false;
          this.createTeamSuccess = `Équipe "${name}" créée avec succès`;
          this.loadTeams();
          this.cdr.detectChanges();
        },
        error: () => {
          this.isCreatingTeam  = false;
          this.createTeamError = "Erreur lors de la création de l'équipe";
        }
      });
  }

openResults(session: Session): void {
  const model = this.models.find(m => m.id === session.modelId) ?? null;
  if (!model) return;

  const team = this.teamsWithMembers.find(t => t.id === session.teamId) ?? null;
  if (!team) return;

  this.selectedSession = session;
  this.selectedModel = model;
  this.isResultsOpen = true;
  this.cdr.detectChanges();
}
  // ── Lifecycle ─────────────────────────────────────────────────────────────

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}