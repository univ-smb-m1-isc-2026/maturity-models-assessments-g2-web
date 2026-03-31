import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { MaturityModelService } from '@core/maturity-model.service';
import { AuthService } from '@core/auth.service';
import { EvaluationService } from '@core/evaluation.service';

import { MaturityModel } from '@models/maturity-model.model';
import { SessionResult } from '@models/session-result.model';
import { User } from '@models/user.model';

@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './evaluation.component.html',
  styleUrls: ['./evaluation.component.scss']
})
export class EvaluationComponent implements OnInit, OnDestroy {

  // ── User ──────────────────────────────────────────────────────────────────
  currentUser: User | null = null;

  // ── Model ─────────────────────────────────────────────────────────────────
  modelId: number = 0;
  model: MaturityModel | null = null;

  // ── Reactive Form ─────────────────────────────────────────────────────────
  sessionResultForm!: FormGroup;

  // ── UI ────────────────────────────────────────────────────────────────────
  isFetching = false;
  isLoading = false;
  errorMessage = '';

  // ── Step ──────────────────────────────────────────────────────────────────
  step: 'form' | 'confirmation' = 'form';

  // ── Backend result ────────────────────────────────────────────────────────
  sessionResult: SessionResult | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private maturityModelService: MaturityModelService,
    private evaluationService: EvaluationService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.modelId = idParam ? Number(idParam) : 0;

    if (!this.modelId || isNaN(this.modelId)) {
      this.router.navigate(['/member/dashboard']);
      return;
    }

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.sessionResultForm = this.fb.group({
      answers: this.fb.array([])
    });

    this.loadModel();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Load model ────────────────────────────────────────────────────────────

  private loadModel(): void {
    this.isFetching = true;
    this.errorMessage = '';

    this.maturityModelService.getModelById(this.modelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (model: MaturityModel | null) => {
          if (model?.questions?.length) {
            model.questions = [...model.questions].sort(
              (a, b) => a.questionOrder - b.questionOrder
            );
          }

          this.model = model ?? null;
          this.isFetching = false;

          if (!this.model) {
            this.errorMessage = 'Modèle introuvable.';
            return;
          }

          this.buildSessionResultForm();
        },
        error: (error) => {
          console.error('Erreur lors du chargement du modèle :', error);
          this.errorMessage = 'Impossible de charger le modèle.';
          this.isFetching = false;
        }
      });
  }

  // ── Build form ────────────────────────────────────────────────────────────

  private buildSessionResultForm(): void {
    const answersArray = this.sessionResultAnswers;
    answersArray.clear();

    if (!this.model?.questions?.length) return;

    this.model.questions.forEach(question => {
      answersArray.push(this.createAnswerGroup(question.id));
    });
  }

  private createAnswerGroup(questionId: number): FormGroup {
    return this.fb.group({
      questionId: [questionId],
      value: ['', Validators.required]
    });
  }

  // ── Form helpers ──────────────────────────────────────────────────────────

  get sessionResultAnswers(): FormArray {
    return this.sessionResultForm.get('answers') as FormArray;
  }

  getAnswerGroup(index: number): FormGroup {
    return this.sessionResultAnswers.at(index) as FormGroup;
  }

  selectAnswer(index: number, value: string): void {
    this.getAnswerGroup(index).get('value')?.setValue(value);

    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  isSelected(index: number, value: string): boolean {
    return this.getAnswerGroup(index).get('value')?.value === value;
  }

  isAnswered(index: number): boolean {
    const value = this.getAnswerGroup(index).get('value')?.value;
    return value !== null && value !== undefined && value !== '';
  }

  // ── Progress ──────────────────────────────────────────────────────────────

  get answeredCount(): number {
    return this.sessionResultAnswers.controls.filter(control => {
      const value = control.get('value')?.value;
      return value !== null && value !== undefined && value !== '';
    }).length;
  }

  get totalQuestions(): number {
    return this.model?.questions?.length ?? 0;
  }

  get progressPercent(): number {
    if (!this.totalQuestions) return 0;
    return Math.round((this.answeredCount / this.totalQuestions) * 100);
  }

  get allAnswered(): boolean {
    return this.sessionResultForm.valid;
  }

  // ── Session result reading ────────────────────────────────────────────────

  get currentParticipantValues(): number[] {
    if (!this.sessionResult || !this.currentUser) return [];

    const participant = this.sessionResult.participants?.find(
      p => p.userId === this.currentUser?.id
    );

    return participant?.values ?? [];
  }

  get globalAverage(): number {
    const averages = this.sessionResult?.averages;

    if (!averages?.length) return 0;

    const total = averages.reduce((sum, value) => sum + value, 0);
    return Math.round((total / averages.length) * 10) / 10;
  }

  getQuestionAverage(index: number): number {
    return this.sessionResult?.averages?.[index] ?? 0;
  }

  get participantCount(): number {
    return this.sessionResult?.participants?.length ?? 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  submitEvaluation(): void {
    if (!this.model || !this.currentUser) return;

    if (this.sessionResultForm.invalid) {
      this.sessionResultForm.markAllAsTouched();
      this.errorMessage = 'Veuillez répondre à toutes les questions avant de soumettre.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload:any = {
      sessionId: 0,
      modelId: this.modelId,
      teamId: this.currentUser.teamId ?? 0,
      userId: this.currentUser.id ?? 0,
      answers: this.sessionResultForm.value.answers,
      completedAt: new Date().toISOString()
    };

    this.evaluationService.submit(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: SessionResult) => {
          this.sessionResult = result;
          this.step = 'confirmation';
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la soumission :', error);
          this.errorMessage = 'Une erreur est survenue lors de la soumission. Veuillez réessayer.';
          this.isLoading = false;
        }
      });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  goToDashboard(): void {
    this.router.navigate(['/member/dashboard']);
  }

  logout(): void {
    this.authService.logout();
  }
}