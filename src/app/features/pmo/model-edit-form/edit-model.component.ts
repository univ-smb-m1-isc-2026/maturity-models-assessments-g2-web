import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaturityModelService } from '@core/maturity-model.service';
import { AuthService } from '@core/auth.service';
import { MATURITY_CATEGORIES, MaturityCategory } from '@models/maturity-model.model';

@Component({
  selector: 'app-edit-model',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, RouterLink],
  templateUrl: './edit-model.component.html',
  styleUrls: ['./edit-model.component.scss']
})
export class EditModelComponent implements OnInit, OnDestroy {

  modelForm!: FormGroup;
  isLoading = false;
  isFetching = true;
  errorMessage = '';
  modelId!: number;

  categories = MATURITY_CATEGORIES;
  currentQuestionIndex = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private maturityModelService: MaturityModelService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Initialisation du formulaire
    this.modelForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      category: ['', Validators.required],
      icon: ['📋'],
      levels: this.fb.array([]),
      questions: this.fb.array([this.createQuestion()])
    });

    // Mettre à jour les niveaux selon catégorie
    this.modelForm.get('category')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value: MaturityCategory) => {
      const found = this.categories.find(c => c.value === value);
      if (found) {
        this.modelForm.patchValue({ icon: found.icon });
        this.levels.clear();
      }
    });

    // Récupérer l'ID du modèle
    this.modelId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.modelId) {
      this.router.navigate(['/pmo/dashboard']);
      return;
    }

    // Charger le modèle
    this.maturityModelService.getModelById(this.modelId).pipe(takeUntil(this.destroy$)).subscribe({
      next: model => {
        this.isFetching = false;

        // Formulaire principal
        this.modelForm.patchValue({
          title: model.title,
          description: model.description,
          category: model.category,
          icon: model.icon
        });

        

        // Questions et réponses
        this.questions.clear();
        model.questions.forEach((q: any) => this.questions.push(this.createQuestion(q)));
      },
      error: () => {
        this.isFetching = false;
        this.errorMessage = 'Modèle introuvable';
      }
    });
  }

  // =========================
  // LEVELS
  // =========================
  get levels(): FormArray {
    return this.modelForm.get('levels') as FormArray;
  }

  addLevel(): void {
    this.levels.push(this.fb.control('', Validators.required));
  }

  removeLevel(index: number): void {
    if (this.levels.length > 1) this.levels.removeAt(index);
  }

  // =========================
  // QUESTIONS
  // =========================
  get questions(): FormArray {
    return this.modelForm.get('questions') as FormArray;
  }

  createQuestion(question?: any): FormGroup {
    return this.fb.group({
      text: [question?.text || '', Validators.required],
      answers: this.fb.array(
        question?.answers?.length ? question.answers.map((a: string) => this.fb.control(a)) : [this.fb.control('')]
      )
    });
  }

  addQuestion(): void {
    this.questions.push(this.createQuestion());
    this.currentQuestionIndex = this.questions.length - 1;
  }

  removeQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
      if (this.currentQuestionIndex >= this.questions.length) this.currentQuestionIndex = this.questions.length - 1;
    }
  }

  // =========================
  // ANSWERS
  // =========================
  getAnswers(index: number): FormArray {
    return this.questions.at(index).get('answers') as FormArray;
  }

  addAnswer(questionIndex: number): void {
    this.getAnswers(questionIndex).push(this.fb.control(''));
  }

  removeAnswer(questionIndex: number, answerIndex: number): void {
    const answers = this.getAnswers(questionIndex);
    if (answers.length > 1) answers.removeAt(answerIndex);
  }

  // =========================
  // PAGINATION
  // =========================
  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) this.currentQuestionIndex++;
  }

  prevQuestion(): void {
    if (this.currentQuestionIndex > 0) this.currentQuestionIndex--;
  }

  // =========================
  // SUBMIT
  // =========================
  onSubmit(): void {
    if (this.modelForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      ...this.modelForm.value,
      questions: this.modelForm.value.questions.map((q: any, i: number) => ({
        id: i + 1,
        text: q.text,
        answers: q.answers
      }))
    };

    this.maturityModelService.updateModel(this.modelId, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/pmo/dashboard']);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Une erreur est survenue lors de la modification';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}