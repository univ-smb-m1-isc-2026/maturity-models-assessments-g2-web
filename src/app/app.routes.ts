import { Routes } from '@angular/router';

// Dashboards
import { PmoDashboardComponent } from '@features/pmo/pmo-dashboard/pmo-dashboard.component';
import { TeamLeadDashboardComponent } from '@features/team-lead/dashboard/team-lead-dashboard.component';
import { TeamMemberDashboardComponent } from '@features/team-member/dashboard/member-dashbord.component';
import { FormModelComponent } from '@features/pmo/model-form/model-form.component';
import { EditModelComponent } from '@features/pmo/model-edit-form/edit-model.component';
import { EvaluationComponent } from '@features/team-member/evaluation/evaluation.component';


// Auth
import { LoginComponent } from '@features/auth/login/login.component';
import { RegisterComponent } from '@features/auth/register/register.component';
import { HomeComponent } from '@features/home.component';

// Guards
import { AuthGuard} from '@core/auth.guard';
import { RoleGuard } from '@core/role.guard';

export const routes: Routes = [
  { path: '',         component: HomeComponent },
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {path: "register/{:token}", component: RegisterComponent},
  {
    path: 'member/dashboard',
    component: TeamMemberDashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'member/evaluation/:id',
    component: EvaluationComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'pmo/dashboard',
    component: PmoDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['PMO'] }
  },
  {
    path: 'pmo/model/new',
    component: FormModelComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['PMO'] }
  },
  { 
    path: 'pmo/model/edit/:id', 
    component: EditModelComponent, 
    canActivate: [AuthGuard, RoleGuard], 
    data: { roles: ['PMO'] } 
  },
  {
    path: 'lead/dashboard',
    component: TeamLeadDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['TEAM_LEAD'] }
  }
]