import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaturityModelService } from '@core/maturity-model.service';
import { AuthService } from '@core/auth.service';
import { MATURITY_CATEGORIES, MaturityCategory, MaturityModel } from '@models/maturity-model.model';
import { ChangeDetectorRef } from '@angular/core';
import { Question } from '@models/question.model';
import { Answer } from '@models/answer.model';

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
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.modelForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      category: ['', Validators.required],
      icon: ['📋'],
      questions: this.fb.array([this.createQuestion()])
    });

    this.modelForm.get('category')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: MaturityCategory) => {
        const found = this.categories.find(c => c.value === value);
        if (found) this.modelForm.patchValue({ icon: found.icon });
      });

    this.modelId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.modelId) {
      this.router.navigate(['/pmo/dashboard']);
      return;
    }

    this.maturityModelService.getModelById(this.modelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (model: MaturityModel) => {
          this.isFetching = false;
          this.modelForm.patchValue({
            title: model.title,
            description: model.description,
            category: model.category,
            icon: model.icon
          });
          this.questions.clear();
          if (model.questions?.length) {
            model.questions.forEach((q: Question) => this.questions.push(this.createQuestion(q)));
          } else {
            this.questions.push(this.createQuestion());
          }
          this.cdr.detectChanges();
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

  createQuestion(question?: Question): FormGroup {
  return this.fb.group({
    text: [question?.text || '', Validators.required],
    answers: this.fb.array(
      question?.answers?.length
        ? question.answers.map((ans: Answer) => this.createAnswer(ans))
        : [this.createAnswer()]
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

  // =========================
  // ANSWERS
  // =========================

  getAnswers(index: number): FormArray {
    return this.questions.at(index).get('answers') as FormArray;
  }

  createAnswer(answer?: Answer): FormGroup {
    return this.fb.group({
      value: [answer?.value || '', Validators.required],
    });
  }

  addAnswer(questionIndex: number): void {
    this.getAnswers(questionIndex).push(this.createAnswer()); // ✅ createAnswer() au lieu de fb.control('')
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

  const formValue = this.modelForm.value;

  const payload = {
    title: formValue.title,
    description: formValue.description,
    category: formValue.category,
    icon: formValue.icon,
    questions: formValue.questions.map((q: Question, qIndex: number) => ({
      text: q.text,
      questionOrder: qIndex + 1, 
      answers: q.answers.map((a: Answer, aIndex: number) => ({
        value: a.value,
        answerOrder: aIndex + 1 
      }))
    }))
  };

  console.log('Payload envoyé :', JSON.stringify(payload, null, 2)); // debug

  this.maturityModelService.updateModel(this.modelId, payload)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
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