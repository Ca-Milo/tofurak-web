import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Hart } from '../services/hart';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const hart = inject(Hart);
  const router = inject(Router);

  return hart.authStatus$.pipe(
    take(1),
    map(isLogged => (isLogged ? true : router.parseUrl('/login')))
  );
};
