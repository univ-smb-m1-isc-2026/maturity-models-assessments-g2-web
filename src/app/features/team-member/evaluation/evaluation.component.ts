import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { MaturityModelService } from '@core/maturity-model.service';
import { AuthService } from '@core/auth.service';
import { SessionResultService } from '@core/session-result.service';

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

  // ── IDs récupérés depuis la route ─────────────────────────────────────────
  modelId: number = 0;
  sessionId: number = 0;         // ← queryParam sessionId passé depuis le dashboard

  // ── Model ─────────────────────────────────────────────────────────────────
  model: MaturityModel | null = null;

  // ── Reactive Form ─────────────────────────────────────────────────────────
  evaluationForm!: FormGroup;

  // ── UI ────────────────────────────────────────────────────────────────────
  isFetching = false;
  isLoading  = false;
  errorMessage = '';

  // ── Step ──────────────────────────────────────────────────────────────────
  step: 'form' | 'confirmation' = 'form';

  // ── Résultat retourné par le backend après soumission ────────────────────
  sessionResult: SessionResult | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private maturityModelService: MaturityModelService,
    private sessionResultService: SessionResultService,
    private cdr : ChangeDetectorRef,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // modelId  → /member/evaluation/:id
    const idParam = this.route.snapshot.paramMap.get('id');
    this.modelId  = idParam ? Number(idParam) : 0;

    // sessionId → queryParam ?sessionId=X passé depuis goToEvaluation()
    const sessionParam = this.route.snapshot.queryParamMap.get('sessionId');
    this.sessionId     = sessionParam ? Number(sessionParam) : 0;

    if (!this.modelId || isNaN(this.modelId)) {
      this.router.navigate(['/member/dashboard']);
      return;
    }

    if (!this.sessionId || isNaN(this.sessionId)) {
      this.router.navigate(['/member/dashboard']);
      return;
    }

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.evaluationForm = this.fb.group({
      answers: this.fb.array([])
    });

    this.loadModel();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Chargement du modèle ──────────────────────────────────────────────────

  private loadModel(): void {
    this.isFetching  = true;
    this.errorMessage = '';

    this.maturityModelService.getModelById(this.modelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (model: MaturityModel | null) => {
          if (model?.questions?.length) {
            // tri par ordre pour garantir que values[] est dans le bon ordre
            model.questions = [...model.questions].sort(
              (a, b) => a.questionOrder - b.questionOrder
            );
          }

          this.model      = model ?? null;
          this.isFetching = false;

          if (!this.model) {
            this.errorMessage = 'Modèle introuvable.';
            return;
          }

          this.buildForm();
          this.cdr.detectChanges()
        },
        error: () => {
          this.errorMessage = 'Impossible de charger le modèle.';
          this.isFetching   = false;
        }
      });
  }

  // ── Construction du formulaire ────────────────────────────────────────────

  private buildForm(): void {
    const answersArray = this.answers;
    answersArray.clear();

    this.model?.questions?.forEach(() => {
      // une entrée par question : juste la valeur 1-5, pas de questionId
      answersArray.push(
        this.fb.group({ value: ['', Validators.required] })
      );
    });
  }

  // ── Accesseurs formulaire ─────────────────────────────────────────────────

  get answers(): FormArray {
    return this.evaluationForm.get('answers') as FormArray;
  }

  getAnswerGroup(index: number): FormGroup {
    return this.answers.at(index) as FormGroup;
  }

  selectAnswer(index: number, value: string): void {
    this.getAnswerGroup(index).get('value')?.setValue(value);
    if (this.errorMessage) this.errorMessage = '';
  }

  getMyValueForQuestion(index: number): number | null {
    return this.currentParticipantValues[index] ?? null;
  }

  isSelected(index: number, value: string): boolean {
    return this.getAnswerGroup(index).get('value')?.value === value;
  }

  isAnswered(index: number): boolean {
    const v = this.getAnswerGroup(index).get('value')?.value;
    return v !== null && v !== undefined && v !== '';
  }

  // ── Progression ───────────────────────────────────────────────────────────

  get answeredCount(): number {
    return this.answers.controls.filter(c => {
      const v = c.get('value')?.value;
      return v !== null && v !== undefined && v !== '';
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
    return this.evaluationForm.valid;
  }

  // ── Lecture du résultat après soumission ──────────────────────────────────

  get currentParticipantValues(): number[] {
    if (!this.sessionResult || !this.currentUser) return [];
    return this.sessionResult.participants
      ?.find(p => p.userId === this.currentUser!.id)
      ?.values ?? [];
  }

  get globalAverage(): number {
    const averages = this.sessionResult?.averages;
    if (!averages?.length) return 0;
    const total = averages.reduce((sum, v) => sum + v, 0);
    return Math.round((total / averages.length) * 10) / 10;
  }

  getQuestionAverage(index: number): number {
    return this.sessionResult?.averages?.[index] ?? 0;
  }

  get participantCount(): number {
    return this.sessionResult?.participants?.length ?? 0;
  }

  // ── Soumission ────────────────────────────────────────────────────────────

  submitEvaluation(): void {
    if (!this.model || !this.currentUser) return;

    if (this.evaluationForm.invalid) {
      this.evaluationForm.markAllAsTouched();
      this.errorMessage = 'Veuillez répondre à toutes les questions avant de soumettre.';
      return;
    }

    this.isLoading    = true;
    this.errorMessage = '';

    // Le backend attend { values: number[] } dans l'ordre des questions
    const values: number[] = this.answers.controls.map(
      c => Number(c.get('value')?.value)
    );

    this.sessionResultService.submit(this.sessionId, { values })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: SessionResult) => {
          this.sessionResult = result;
          this.step          = 'confirmation';
          this.isLoading     = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          if (err.status === 409) {
            this.errorMessage = 'Vous avez déjà soumis vos réponses pour cette session.';
          } else {
            this.errorMessage = 'Une erreur est survenue lors de la soumission. Veuillez réessayer.';
          }
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
    this.router.navigate(['/login']);
  }
}