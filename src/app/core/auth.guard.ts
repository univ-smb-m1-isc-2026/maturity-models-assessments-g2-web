import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '@core/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

/***
 * Classe permettant de protéger les routes en fonction de l'authentification de l'utilisateur
 */ 

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.isLoggedIn$().pipe(
      take(1), 
      map(isLoggedIn => {
        if (isLoggedIn) {
          return true;
        }
        return this.router.createUrlTree(['/login']);
      })
    );
  }
}