import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Hart } from '../services/hart';

export const authSessionInterceptor: HttpInterceptorFn = (req, next) => {
  const hart = inject(Hart);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        hart.logout();
        void router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
