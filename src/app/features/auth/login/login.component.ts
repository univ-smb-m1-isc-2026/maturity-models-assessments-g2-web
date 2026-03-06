import { Component, OnInit, OnDestroy } from '@angular/core';  
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Role } from '@models/role.enum';
import { Subject } from 'rxjs';         
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {  
  loginForm!: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;        
  private destroy$ = new Subject<void>();  

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    // la route n'existant pas encore, cela créer une E404 qui est redirigé vers l'accueil sinon un message d'erreur apparait sur la page login

    this.authService.login(
      this.loginForm.value.email,
      this.loginForm.value.password
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (user) => {
        this.isLoading = false;
        switch (user.role) {
          case Role.PMO:
            this.router.navigate(['/pmo/dashboard']);
            break;
          case Role.TEAM_LEAD:
            this.router.navigate(['/lead/dashboard']);
            break;
          case Role.TEAM_MEMBER:
            this.router.navigate(['/member/dashboard']);
            break;
          default:
            this.router.navigate(['/login']);
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Email ou mot de passe incorrect';
      }
    });
  }

  ngOnDestroy(): void {  // ✅ Nettoyage des subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }
}