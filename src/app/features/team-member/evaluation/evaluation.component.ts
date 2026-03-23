import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaturityModelService } from '@core/maturity-model.service';
import { AuthService } from '@core/auth.service';
import { MaturityLevel } from '@models/maturity-model.model';
import { MaturityModel } from '@models/maturity-model.model';
import { Question } from '@models/question.model';
import { User } from '@models/user.model';


@Component({
  selector: 'app-team-member-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './evaluation.component.html',
  styleUrls: ['./evaluation.component.scss']
})
export class EvaluationComponent implements OnInit, OnDestroy {
  currentUser : User | null = null; 
  errorMessage: string = "";
  isFetching: boolean = false; 
  isLoading: boolean = false; 
  submitted: boolean = false; 
  isResultStep: boolean = false; 
  modelId!: number;
  model: MaturityModel|null = null ; 

  private destroy$ = new Subject<void>();

  constructor(
    private maturityModelService: MaturityModelService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.currentUser = this.authService.getCurrentUser()
    } 

  ngOnInit(): void {
    this.modelId = Number(this.route.snapshot.paramMap.get('id'));
      if (!this.modelId) {
        this.router.navigate(['/member/dashboard']);
        return;
      }

    if (this.currentUser) {
      this.maturityModelService.getModelById(this.modelId).subscribe({
      next: (model) => {
        this.model = model ?? null;
        this.isFetching = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger le modèle.';
        this.isFetching = false;
      }
      });
    }
    }

  getSessionResult(){
    //get la session result associer à la session
  }

  submitEvaluation(){
      // ajouter à la session result 
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}