import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

let pendingAdminRequests = 0;

function openAdminLoading(): void {
  if (Swal.isVisible()) {
    return;
  }

  void Swal.fire({
    title: 'Cargando...',
    text: 'Estamos consultando la informacion del panel.',
    allowEscapeKey: false,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

function closeAdminLoading(): void {
  if (pendingAdminRequests > 0) {
    return;
  }

  if (Swal.isVisible()) {
    Swal.close();
  }
}

export const adminLoadingInterceptor: HttpInterceptorFn = (req, next) => {
  const isAdminRequest = req.url.startsWith('/api/admin');

  if (!isAdminRequest) {
    return next(req);
  }

  pendingAdminRequests += 1;
  openAdminLoading();

  return next(req).pipe(
    finalize(() => {
      pendingAdminRequests = Math.max(0, pendingAdminRequests - 1);
      closeAdminLoading();
    }),
  );
};
