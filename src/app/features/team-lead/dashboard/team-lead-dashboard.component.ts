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

// Structure enrichie d'une équipe avec les données complètes des membres
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
  teamsWithMembers: TeamWithMembers[] = [];   // Équipes enrichies pour l'affichage
  teamMembers: User[] = [];                   // Tous les membres (toutes équipes confondues)

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

  // Compteurs globaux (toutes équipes confondues)
  totalMembersCount: number = 0;
  pendingMembersCount: number = 0;
  activeMembersCount: number = 0;

  // Équipe sélectionnée pour afficher le détail de ses membres
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
      email: ['', [Validators.required, Validators.email]]
    });

    this.sessionForm = this.fb.group({
      teamId: ['', Validators.required],
      modelId: ['', Validators.required]
    });

    this.createTeamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.loadModels();
    this.loadTeamsAndMembers();
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

        // Collecte tous les ids uniques de membres sur toutes les équipes
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

        // Construit chaque TeamWithMembers en croisant les ids avec les users chargés
        this.teamsWithMembers = teams.map(team => {
          const members = (team.memberIds || [])
            .map(id => users.find(u => u.id === id))
            .filter((u): u is User => u !== undefined);

          const pendingCount = members.filter(u => u.status === 'En attente').length;
          const activeCount = members.filter(u => u.status !== 'En attente').length;

          return { ...team, members, pendingCount, activeCount };
        });

        // Compteurs globaux
        this.totalMembersCount = users.length;
        this.pendingMembersCount = users.filter(u => u.status === 'En attente').length;
        this.activeMembersCount = users.filter(u => u.status !== 'En attente').length;

        // Sélectionne la première équipe par défaut si aucune n'est choisie
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

  // --- Sélection d'équipe pour afficher ses membres ---

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

    const { modelId, teamId } = this.sessionForm.value;

    this.sessionService.createSession(modelId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isSession = false;
        this.sessionSuccess = 'Session créée avec succès';
      },
      error: () => {
        this.isSession = false;
        this.sessionError = 'Erreur lors de la création de la session';
      }
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
        console.log();
        this.isCreatingTeam = false;
        this.createTeamSuccess = `Équipe "${name.name}" créée avec succès`;
        this.cdr.detectChanges()
      },
      error: () => {
        console.log();
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