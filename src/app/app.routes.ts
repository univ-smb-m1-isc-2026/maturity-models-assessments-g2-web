import { Routes } from '@angular/router';

// Auth
import { LoginComponent } from '@features/auth/login/login.component';
import { RegisterComponent } from '@features/auth/register/register.component';
import { HomeComponent } from '@features/home.component';

// app.routes.ts
export const routes: Routes = [
  { path: '',         component: HomeComponent },   
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // ...autres routes
  { path: '**', redirectTo: '' }
];