import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '@core/auth.service';
import { MaturityModelService } from '@core/maturity-model.service';
import { MaturityModel } from '@models/maturity-model.model';
import { User } from '@models/user.model';

@Component({
  selector: 'app-team-member-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './member-dashboard.component.html',
  styleUrls: ['../../_dashboard.component.scss']
})
export class TeamMemberDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
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
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.maturityModelService.getModels().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (models) => this.models = models,
      error: () => console.error('Erreur chargement des modèles')
    });
  }

  selectModel(model: MaturityModel): void {
    this.selectedModel = model;
    // ✅ Naviguer vers le formulaire d'évaluation
    this.router.navigate(['/member/evaluation', model.id]);
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}