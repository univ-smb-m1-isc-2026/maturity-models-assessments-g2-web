import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpErrorResponse
} from '@angular/common/http';
import { throwError } from 'rxjs';
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
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  console.log('AuthInterceptor: interception de la requête', req.url);

  const token = authService.getToken();

  // Clone la requête et ajoute le header Authorization si token présent
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {

        case 401: // Token expiré ou invalide
          authService.logout();
          break;

        case 403: // Accès refusé (mauvais rôle)
          router.navigate(['/forbidden']); // TODO : route à créer
          break;

        case 0: // Pas de connexion réseau
          console.error('Erreur réseau : serveur injoignable');
          break;
      }

      return throwError(() => error);
    })
  );
};