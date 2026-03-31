import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/auth.service';
import { Role } from '@models/role.enum';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  isInvited: boolean = false;     
  invitationToken: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute   
  ) {}

  ngOnInit(): void {
  
    this.invitationToken = this.route.snapshot.queryParamMap.get('token');
    this.isInvited = !!this.invitationToken;

    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName:  ['', [Validators.required]],
      email:     ['', [Validators.required, Validators.email]],
      password:  ['', [Validators.required, Validators.minLength(6)]],
      role: [
        { value: this.isInvited ? Role.TEAM_MEMBER : Role.PMO, disabled: this.isInvited },
        [Validators.required]
      ]
    });

    
    if (this.isInvited) {
      this.authService.getInvitationEmail(this.invitationToken!).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (data:any) =>{
            this.registerForm.patchValue({ email: data.email });
        },
        error: () => this.errorMessage = 'Invitation invalide ou expirée'
      });
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    
    const payload = {
      ...this.registerForm.getRawValue(),
      ...(this.invitationToken && { invitationToken: this.invitationToken })
    };

    this.authService.register(payload).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/login']);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Impossible de créer le compte';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}