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
  selector: 'app-pmo-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pmo-dashboard.component.html',
  styleUrls: ['./pmo-dashboard.component.scss']
})
export class PmoDashboardComponent implements OnInit, OnDestroy {
  models: MaturityModel[] = [];
  currentUser: User | null = null;

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

  deleteModel(id: number): void {
    this.maturityModelService.deleteModel(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => this.models = this.models.filter(m => m.id !== id),
      error: () => console.error('Erreur suppression')
    });
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}