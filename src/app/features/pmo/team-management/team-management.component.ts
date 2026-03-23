import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '@core/auth.service';
import { User, Status } from '@models/user.model';
import { Team } from '@models/team.model';
import { Role } from '@models/role.enum';
import { UserService } from '@core/user.service';
import { TeamService } from '@core/team.service';

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './team-management.component.html',
  styleUrls: ['./team-management.component.scss']
})
export class TeamManagementComponent implements OnInit, OnDestroy {
  teams: Team[] = [];
  selectedTeam: Team | null = null;

  availableTeamLeads: User[] = [];
  availableTeamMembers: User[] = [];

  showCreateTeamModal: boolean = false;
  showAddMemberModal: boolean = false;
  showDeleteConfirm: boolean = false;
  teamToDelete: number | null = null;

  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  createTeamForm!: FormGroup;
  addMemberForm!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private teamService: TeamService // ✅ injection
  ) {}

  ngOnInit(): void {
    this.createTeamForm = this.fb.group({
      name:   ['', [Validators.required, Validators.minLength(3)]],
      leadId: ['', [Validators.required]],
    });

    this.addMemberForm = this.fb.group({
      memberId: ['', [Validators.required]]
    });

    this.loadTeams();       
    this.loadAvailableUsers();
  }

  
  private loadTeams(): void {
    this.isLoading = true;
    this.teamService.getTeams().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (teams: Team[]) => {
        this.teams = teams;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des équipes';
        this.isLoading = false;
      }
    });
  }

  private loadAvailableUsers(): void {
    this.userService.getUsersByRole(Role.TEAM_LEAD).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (users: User[]) => this.availableTeamLeads = users,
      error: () => console.error('Erreur chargement Team Leads')
    });

    this.userService.getUsersByRole(Role.TEAM_MEMBER).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (users: User[]) => this.availableTeamMembers = users,
      error: () => console.error('Erreur chargement Team Members')
    });
  }

  getUserById(id: number): User | undefined {
    return [...this.availableTeamLeads, ...this.availableTeamMembers]
      .find(u => u.id === id);
  }

  getTeamLead(team: Team): User | undefined {
    return this.availableTeamLeads.find(u => u.id === team.leadId);
  }

  getTeamMembers(team: Team): User[] {
    return team.memberIds
      .map(id => this.availableTeamMembers.find(u => u.id === id))
      .filter((u): u is User => !!u);
  }

  getAvailableMembersForTeam(team: Team): User[] {
    return this.availableTeamMembers.filter(
      u => !team.memberIds.includes(u.id)
    );
  }

  selectTeam(team: Team): void {
    this.selectedTeam = this.selectedTeam?.id === team.id ? null : team;
  }

  get totalMembers(): number {
    return this.teams.reduce((acc, t) => acc + t.memberIds.length, 0);
  }

  get pendingMembers(): number {
    return this.teams.reduce((acc, t) => {
      const members = this.getTeamMembers(t);
      return acc + members.filter(m => m.status === Status.ATTENTE).length;
    }, 0);
  }

  openCreateTeamModal(): void  { this.showCreateTeamModal = true; }
  closeCreateTeamModal(): void {
    this.showCreateTeamModal = false;
    this.createTeamForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
  }

  createTeam(): void {
    if (this.createTeamForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';

    const { name, leadId } = this.createTeamForm.value;

    this.teamService.createTeam({
      name,
      leadId:    +leadId,
      memberIds: []
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (newTeam: Team) => {
        this.teams.push(newTeam);
        this.isLoading = false;
        this.successMessage = `Équipe "${newTeam.name}" créée avec succès`;
        this.createTeamForm.reset();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la création de l\'équipe';
        this.isLoading = false;
      }
    });
  }

  openAddMemberModal(team: Team): void {
    this.selectedTeam = team;
    this.showAddMemberModal = true;
    this.addMemberForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
  }

  closeAddMemberModal(): void {
    this.showAddMemberModal = false;
    this.addMemberForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
  }

  addMember(): void {
    if (this.addMemberForm.invalid || !this.selectedTeam) return;
    this.isLoading = true;
    this.errorMessage = '';

    const memberId = +this.addMemberForm.value.memberId;
    const member = this.availableTeamMembers.find(u => u.id === memberId);

    if (!member) {
      this.errorMessage = 'Membre introuvable';
      this.isLoading = false;
      return;
    }

    const updatedMemberIds = [...this.selectedTeam.memberIds, memberId];

    this.teamService.updateTeam(this.selectedTeam.id, { memberIds: updatedMemberIds })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedTeam: Team) => {
          const index = this.teams.findIndex(t => t.id === updatedTeam.id);
          if (index !== -1) this.teams[index] = updatedTeam;
          if (this.selectedTeam?.id === updatedTeam.id) this.selectedTeam = updatedTeam;
          this.isLoading = false;
          this.successMessage = `${member.firstName} ${member.lastName} ajouté à l'équipe`;
          this.addMemberForm.reset();
        },
        error: () => {
          this.errorMessage = 'Erreur lors de l\'ajout du membre';
          this.isLoading = false;
        }
      });
  }

  removeMember(team: Team, memberId: number): void {
    const updatedMemberIds = team.memberIds.filter(id => id !== memberId);
    this.teamService.updateTeam(team.id, { memberIds: updatedMemberIds })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedTeam: Team) => {
          const index = this.teams.findIndex(t => t.id === updatedTeam.id);
          if (index !== -1) this.teams[index] = updatedTeam;
          if (this.selectedTeam?.id === updatedTeam.id) this.selectedTeam = updatedTeam;
        },
        error: () => this.errorMessage = 'Erreur lors de la suppression du membre'
      });
  }

  confirmDeleteTeam(teamId: number): void {
    this.teamToDelete = teamId;
    this.showDeleteConfirm = true;
  }

  deleteTeam(): void {
    if (!this.teamToDelete) return;
    this.teamService.deleteTeam(this.teamToDelete)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.teams = this.teams.filter(t => t.id !== this.teamToDelete);
          if (this.selectedTeam?.id === this.teamToDelete) this.selectedTeam = null;
          this.showDeleteConfirm = false;
          this.teamToDelete = null;
        },
        error: () => this.errorMessage = 'Erreur lors de la suppression de l\'équipe'
      });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.teamToDelete = null;
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}