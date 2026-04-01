import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '@core/auth.service';
import { MaturityModelService } from '@core/maturity-model.service';
import { MaturityModel } from '@models/maturity-model.model';
import { User } from '@models/user.model';
import { ChangeDetectorRef } from '@angular/core';



@Component({
  selector: 'app-pmo-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pmo-dashboard.component.html',
  styleUrls: ['./pmo-dashboard.component.scss']
})
export class PmoDashboardComponent implements OnInit, OnDestroy {
  models: MaturityModel[] = [] ;
  currentUser: User | null = null;
  isLoading = true; 

  private destroy$ = new Subject<void>();
  
  
  constructor(
    private authService: AuthService,
    private maturityModelService: MaturityModelService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit() {
    this.loadModels();
  }

  private loadModels() {
    this.isLoading = true; 
    this.maturityModelService.getModels().pipe(
      takeUntil(this.destroy$)).subscribe({
       next: (models) => {
        console.log('Modèles récupérés :', models);
        this.models = models;
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('isLoading après chargement :', this.isLoading);
      },
      error: (err) => {
        console.error('Erreur chargement des modèles :', err);
        console.error('Status :', err.status);
        console.error('Body :', err.error);
        this.isLoading = false; 
      }, 
     
    });
  }


deleteModel(id: number): void {
  this.maturityModelService.deleteModel(id).pipe(
    takeUntil(this.destroy$)
  ).subscribe({
    next: () => {
      console.log('✅ Modèle supprimé, rechargement...');
      this.loadModels();
    },
    error: (err) => {
      console.error('❌ Erreur suppression :', err);
      console.error('Status :', err.status);
      console.error('Body :', err.error);
    }
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