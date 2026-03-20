import { Routes } from '@angular/router';

// Dashboards
import { PmoDashboardComponent } from '@features/pmo/pmo-dashboard/pmo-dashboard.component';
import { TeamLeadDashboardComponent } from '@features/team-lead/dashboard/team-lead-dashboard.component';
import { TeamMemberDashboardComponent } from '@features/team-member/dashboard/member-dashbord.component';
// Auth
import { LoginComponent } from '@features/auth/login/login.component';
import { RegisterComponent } from '@features/auth/register/register.component';
import { HomeComponent } from '@features/home.component';
// Guards
import { RoleGuard } from '@core/role.guard';

// app.routes.ts
export const routes: Routes = [
  { path: '',         component: HomeComponent },
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // ...autres routes
  { path: '**', redirectTo: '' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'member/dashboard',
    component: TeamMemberDashboardComponent,
    // canActivate: [AuthGuard]
  },
  {
    path: 'pmo/dashboard',
    component: PmoDashboardComponent,
    //canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['PMO'] }
  },
  {
    //path: 'pmo/team',
    //component: TeamManagementComponent,
   // canActivate: [AuthGuard, RoleGuard],
    //data: { roles: ['PMO'] }
  },
  {
    path: 'lead/dashboard',
    component: TeamLeadDashboardComponent,
    //canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['TEAM_LEAD'] }
  }
];
