import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaturityModelService } from '@core/maturity-model.service';
import { AuthService } from '@core/auth.service';
import { MATURITY_CATEGORIES, DEFAULT_LEVELS, MaturityCategory } from '@models/maturity-model.model';

@Component({
  selector: 'app-form-model',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './model-form.component.html',
  styleUrls: ['./model-form.component.scss']
})
export class FormModelComponent implements OnInit, OnDestroy {
  modelForm!: FormGroup;
  isEditMode: boolean = false;
  modelId: number | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';

  categories = MATURITY_CATEGORIES;  

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private maturityModelService: MaturityModelService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.modelForm = this.fb.group({
      title:       ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      category:    ['', [Validators.required]],
      icon:        ['📋'],
      levels:      this.fb.array([
        this.fb.control('Initial',   Validators.required),
        this.fb.control('Répétable', Validators.required),
        this.fb.control('Défini',    Validators.required),
        this.fb.control('Géré',      Validators.required),
        this.fb.control('Optimisé',  Validators.required),
      ]),
      questions: this.fb.array([
        this.createQuestion(1),
        this.createQuestion(2),
        this.createQuestion(3),
      ])
    });

    
    this.modelForm.get('category')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((value: MaturityCategory) => {
      const found = this.categories.find(c => c.value === value);
      if (found) {
        this.modelForm.patchValue({ icon: found.icon });
        this.levels.clear();
        DEFAULT_LEVELS[value].forEach(l =>
          this.levels.push(this.fb.control(l, Validators.required))
        );
      }
    });


    this.modelId = Number(this.route.snapshot.paramMap.get('id')) || null;
    if (this.modelId) {
      this.isEditMode = true;
      this.maturityModelService.getModelById(this.modelId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (model) => {
          this.modelForm.patchValue({
            title:       model.title,
            description: model.description,
            category:    model.category,
            icon:        model.icon
          });
          this.levels.clear();
          model.levels.forEach(l =>
            this.levels.push(this.fb.control(l, Validators.required))
          );
          this.questions.clear();
          model.questions.forEach(q =>
            this.questions.push(this.createQuestion(q.order, q.text))
          );
        },
        error: () => this.errorMessage = 'Modèle introuvable'
      });
    }
  }

 
  get levels(): FormArray {
    return this.modelForm.get('levels') as FormArray;
  }

  addLevel(): void {
    this.levels.push(this.fb.control('', Validators.required));
  }

  removeLevel(index: number): void {
    if (this.levels.length > 1) this.levels.removeAt(index);
  }

  createQuestion(order: number, text: string = ''): FormGroup {
    return this.fb.group({
      text:  [text, Validators.required],
      order: [order]
    });
  }

  get questions(): FormArray {
    return this.modelForm.get('questions') as FormArray;
  }

  addQuestion(): void {
    this.questions.push(this.createQuestion(this.questions.length + 1));
  }

  removeQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
      this.questions.controls.forEach((ctrl, i) => ctrl.patchValue({ order: i + 1 }));
    }
  }

  onSubmit(): void {
    if (this.modelForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const currentUser = this.authService.getCurrentUser();
    const payload = {
      ...this.modelForm.value,
      createdBy: currentUser!.id,
      questions: this.modelForm.value.questions.map((q: any, i: number) => ({
        ...q,
        id: i + 1
      }))
    };

    const action$ = this.isEditMode
      ? this.maturityModelService.updateModel(this.modelId!, payload)
      : this.maturityModelService.createModel(payload);

    action$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/pmo/dashboard']);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Une erreur est survenue';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}