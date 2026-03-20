import { Routes } from '@angular/router';

// Auth
import { LoginComponent } from '@features/auth/login/login.component';
import { RegisterComponent } from '@features/auth/register/register.component';

// Dashboards
import { PmoDashboardComponent } from '@features/pmo/pmo-dashboard/pmo-dashboard.component';
import { TeamLeadDashboardComponent } from '@features/team-lead/dashboard/team-lead-dashboard.component';
import { TeamMemberDashboardComponent } from '@features/team-member/dashboard/member-dashbord.component';


// Guards
import { RoleGuard } from '@core/role.guard';


export const routes: Routes = [
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
    path: 'pmo/team', 
    component: TeamManagementComponent, 
   // canActivate: [AuthGuard, RoleGuard], 
    data: { roles: ['PMO'] } 
  },
  {
    path: 'lead/dashboard',
    component: TeamLeadDashboardComponent,
    //canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['TEAM_LEAD'] }
  },

  // redirection par défaut
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' } // wildcard pour 404
];