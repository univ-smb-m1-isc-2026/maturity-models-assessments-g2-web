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
  selector: 'app-form-model',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, RouterLink],
  templateUrl: './model-form.component.html',
  styleUrls: ['./model-form.component.scss']
})
export class FormModelComponent implements OnInit, OnDestroy {

  modelForm!: FormGroup;
  isLoading: boolean = false;
  isFetching: boolean = true;
  errorMessage: string = '';
  modelId!: number;
  isEditMode: boolean = false;

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
    this.modelId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.modelId;

    // Initialisation du formulaire
    this.modelForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      category: ['', [Validators.required]],
      icon: ['📋'],
      questions: this.fb.array([ this.createQuestion() ])
    });

    // Mettre à jour l’icône lors du choix de catégorie
    this.modelForm.get('category')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((value: MaturityCategory) => {
      const found = this.categories.find(c => c.value === value);
      if (found) {
        this.modelForm.patchValue({ icon: found.icon });
      }
    });

    if (this.isEditMode) {
      this.loadModel();
    } else {
      this.isFetching = false;
    }
  }

  private loadModel() {
    this.maturityModelService.getModelById(this.modelId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (model: any) => {
        this.isFetching = false;

        this.modelForm.patchValue({
          title: model.title,
          description: model.description,
          category: model.category,
          icon: model.icon
        });

        // Questions + niveaux
        this.questions.clear();
        if (model.questions?.length) {
          model.questions.forEach((q: any) => this.questions.push(this.createQuestion(q)));
        } else {
          this.questions.push(this.createQuestion());
        }
      },
      error: () => {
        this.isFetching = false;
        this.errorMessage = 'Modèle introuvable';
      }
    });
  }

  // =========================
  // QUESTIONS
  // =========================
  get questions(): FormArray {
    return this.modelForm.get('questions') as FormArray;
  }

  createQuestion(question?: { text?: string, levels?: string[] }): FormGroup {
    return this.fb.group({
      text: [question?.text || '', Validators.required],
      levels: this.fb.array(
        question?.levels?.length
          ? question.levels.map(l => this.fb.control(l, Validators.required))
          : [this.fb.control('', Validators.required)]  // un niveau vide par défaut
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
      if (this.currentQuestionIndex >= this.questions.length) {
        this.currentQuestionIndex = this.questions.length - 1;
      }
    }
  }
    get currentQuestion(): FormGroup {
    return this.questions.at(this.currentQuestionIndex) as FormGroup;
  }


  // =========================
  // LEVELS (dans chaque question)
  // =========================
  getLevels(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('levels') as FormArray;
  }

  addLevel(questionIndex: number) {
    this.getLevels(questionIndex).push(this.fb.control('', Validators.required));
  }

  removeLevel(questionIndex: number, levelIndex: number) {
    const levels = this.getLevels(questionIndex);
    if (levels.length > 1) {
      levels.removeAt(levelIndex);
    }
  }

  // =========================
  // PAGINATION
  // =========================
  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  prevQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
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
        levels: q.levels
      }))
    };

    const request$ = this.isEditMode
      ? this.maturityModelService.updateModel(this.modelId, payload)
      : this.maturityModelService.createModel(payload);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/pmo/dashboard']);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Une erreur est survenue lors de l’enregistrement';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}