import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '@core/auth.service';
import { Router } from '@angular/router';

/**
 * Intercepteur HTTP Angular qui gère l'authentification de manière centralisée.
 *
 * Rôle principal : intercepter toutes les requêtes HTTP sortantes pour y injecter
 * automatiquement le token JWT, et intercepter toutes les réponses en erreur pour
 * gérer les cas d'échec d'authentification ou d'autorisation.
 *
 * Comportement :
 * - Ajoute un header `Authorization: Bearer <token>` si un token est disponible
 * - Redirige vers /login en cas de token expiré ou invalide (401)
 * - Redirige vers /forbidden en cas d'accès non autorisé (403)
 * - Logue une erreur console si le serveur est injoignable (status 0)
 *
 * À enregistrer dans le tableau `providers` du module avec le multi-provider HTTP_INTERCEPTORS.
 */

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();

    // Clone la requête et ajoute le header Authorization si token présent
    const authReq = token
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        })
      : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        switch (error.status) {

          case 401: // Token expiré ou invalide
            this.authService.logout();
            this.router.navigate(['/login']);
            break;

          case 403: // Accès refusé (mauvais rôle)
            this.router.navigate(['/forbidden']); // TODO : route à créer 
            break;

          case 0: // Pas de connexion réseau
            console.error('Erreur réseau : serveur injoignable');
            break;
        }

        return throwError(() => error);
      })
    );
  }
}