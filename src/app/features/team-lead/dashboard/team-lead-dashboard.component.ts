import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '@core/auth.service';
import { MaturityModelService } from '@core/maturity-model.service';
import { MaturityModel } from '@models/maturity-model.model';
import { User } from '@models/user.model';

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
  inviteForm!: FormGroup;
  sessionForm! : FormGroup;
  inviteSuccess: string = '';
  sessionSuccess: string = '';
  inviteError: string = '';
  sessionError: string = '';
  isInviting: boolean = false;
  isSession: boolean = false; 
  showInviteModal: boolean = false;
  showSessionModal: boolean = false; 

  // 🔧 Mock membres invités — à remplacer par appel API
  teamMembers = [
      {
         id: 3,
         firstName: 'Charlie',
         lastName: 'Durand',
         email: 'member@test.com',
         password: 'password123',
         role: "team member",
         status : "Actif"
       }, 
       {
        id: 3,
        firstName: 'Lea',
        lastName: 'Dupont',
        email: 'member2@test.com',
        password: 'password123',
        role: "team member",
        status : "En attente"
      }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private maturityModelService: MaturityModelService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.sessionForm = this.fb.group({
      modelId: ['', Validators.required]  
    });

    this.maturityModelService.getModels().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (models) => this.models = models,
      error: () => console.error('Erreur chargement des modèles')
    });
  }

  get pendingMembersCount(): number {
  return this.teamMembers.filter(m => m.status === 'En attente').length;
  }

  openInviteModal(): void  { this.showInviteModal = true; }
  openSessionModal() : void  { this.showSessionModal = true; }


  closeInviteModal(): void {
    this.showInviteModal = false;
    this.inviteForm.reset();
    this.inviteSuccess = '';
    this.inviteError = '';
  }

  closeSessionModal(): void {
    this.showSessionModal = false;
    this.sessionForm.reset();
    this.sessionSuccess = '';
    this.sessionError = '';
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) return;

    this.isInviting = true;
    this.inviteSuccess = '';
    this.inviteError = '';

    this.authService.inviteTeamMember(this.inviteForm.value.email).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isInviting = false;
        this.inviteSuccess = `Invitation envoyée à ${this.inviteForm.value.email}`;
        this.inviteForm.reset();
      },
      error: () => {
        this.isInviting = false;
        this.inviteError = "Erreur lors de l'envoi de l'invitation";
      }
    });
  }
 

  startSession():void {
    if (this.sessionForm.invalid) return;
   // TODO : start une session sur un model pour son équipe
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}