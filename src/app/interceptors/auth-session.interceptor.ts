import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Hart } from '../services/hart';

export const authSessionInterceptor: HttpInterceptorFn = (req, next) => {
  const hart = inject(Hart);
  const router = inject(Router);
  const token = hart.getToken();
  const requiresBearerAuth =
    req.url.startsWith('/api/account') ||
    req.url.startsWith('/api/pagos/historial') ||
    req.url.startsWith('/api/admin');

  const shouldAttachToken =
    !!token &&
    requiresBearerAuth &&
    !req.headers.has('Authorization');

  const authReq = shouldAttachToken
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        hart.logout();
        void router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
