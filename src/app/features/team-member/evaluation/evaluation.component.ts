import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaturityModelService } from '@core/maturity-model.service';
import { AuthService } from '@core/auth.service';
import { MaturityModel } from '@models/maturity-model.model';
import { User } from '@models/user.model';

@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './evaluation.component.html',
  styleUrls: ['./evaluation.component.scss']
})
export class EvaluationComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  errorMessage: string = '';
  isFetching: boolean = false;
  isLoading: boolean = false;
  submitted: boolean = false;
  isResultStep: boolean = false;
  modelId!: number;
  model: MaturityModel | null = null;

  // Stocke la réponse choisie par question : { [questionId]: levelString }
  answers: Record<number, string> = {};

  private destroy$ = new Subject<void>();

  constructor(
    private maturityModelService: MaturityModelService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { this.currentUser =  this.authService.getCurrentUser()}

  ngOnInit(): void {
    this.modelId = Number(this.route.snapshot.paramMap.get('id'));

    if (!this.modelId) {
      this.router.navigate(['/member/dashboard']);
      return;
    }

    // Chargement du modèle — indépendant de currentUser
    this.isFetching = true;
    this.maturityModelService.getModelById(this.modelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (model) => {
          // Trier les questions par order
          if (model) {
            model.questions = model.questions
              .slice()
              .sort((a, b) => a.order - b.order);
          }
          this.model = model ?? null;
          this.isFetching = false;
        },
        error: () => {
          this.errorMessage = 'Impossible de charger le modèle.';
          this.isFetching = false;
        }
      });
  }

  selectAnswer(questionId: number, level: string): void {
    this.answers[questionId] = level;
  }

  getSessionResult(): void {
    // TODO : récupérer la session result associée à la session
  }

  submitEvaluation(): void {
    if (!this.model) return;

    // Vérifier que toutes les questions ont une réponse
    const allAnswered = this.model.questions.every(q => this.answers[q.id] !== undefined);
    if (!allAnswered) {
      this.errorMessage = 'Veuillez répondre à toutes les questions avant de soumettre.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // TODO : envoyer this.answers au service
    // this.evaluationService.submit(this.modelId, this.answers).subscribe(...)

    console.log('Réponses soumises :', this.answers);
    this.submitted = true;
    this.isResultStep = true;
    this.isLoading = false;
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}