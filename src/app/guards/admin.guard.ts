import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Hart } from '../services/hart';

export const adminGuard: CanActivateFn = () => {
  const hart = inject(Hart);
  const router = inject(Router);
  const currentUser = hart.getCurrentUser();
  const rango = Number(currentUser?.rango ?? 0);

  if (rango >= 2) {
    return true;
  }

  return router.parseUrl('/profile');
};
