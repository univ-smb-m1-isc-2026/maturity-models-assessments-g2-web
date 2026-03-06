import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '@core/auth.service';

@Injectable({
  providedIn: 'root'
})

/***
 * Classe permettant de protéger les routes en fonction du role de l'utilisateur
 */ 


export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const expectedRoles: string[] = route.data['roles']; 
    const currentUser = this.authService.getCurrentUser();

    if (currentUser && expectedRoles.includes(currentUser.role)) {
      return true;
    }

    return this.router.createUrlTree(['/login']);
  }
}