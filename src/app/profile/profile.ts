import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { Hart, User } from '../services/hart';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, Header, Footer],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  // UI
  showPwd1 = false;
  showPwd2 = false;

  msgOk = '';
  msgErr = '';

  currentUser: User = {
    id: '',
    cuenta: '',
    rango: 0,
    email: '',
    apodo: '',
    lastIP: '', 
    question: '',
    abono: 0,
    ips: [],
    personajes: [],
  }; 

  passwordForm: FormGroup;
  private destroy$ = new Subject<void>();
  private subscriptionExpiryMs: number | null = null;

  constructor(
    private fb: FormBuilder,
    private hartService: Hart,
    private cdr: ChangeDetectorRef,
  ) {
    this.passwordForm = this.fb.group({
      secretAnswer: ['', [Validators.required, Validators.minLength(2)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPasswordConfirm: ['', [Validators.required, Validators.minLength(6)]],
    });

    const storedUser = this.hartService.getCurrentUser();
    if (storedUser) {
      this.setCurrentUser(storedUser);
    }
  }   
  
  ngOnInit(): void {
    this.hartService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (!user) return;
        this.setCurrentUser(user);
        this.refreshView();
      });

    this.hartService.getProfile().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.setCurrentUser(response.data);
          this.refreshView();
        }
      },
      error: (error) => {
        this.msgErr = '';
        this.showErrorModal(
          'Error al cargar perfil',
          error?.message || 'No se pudo cargar el perfil.'
        );
        this.refreshView();
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  togglePwd(which: 1 | 2) {
    if (which === 1) this.showPwd1 = !this.showPwd1;
    else this.showPwd2 = !this.showPwd2;
  }

  submitPasswordChange() {
    this.msgOk = '';
    this.msgErr = '';

    if (this.passwordForm.invalid) {
      this.msgErr = 'Completa todos los campos correctamente.';
      return;
    }

    const { newPassword, newPasswordConfirm } = this.passwordForm.value;
    if (newPassword !== newPasswordConfirm) {
      this.msgErr = 'Las contraseñas no coinciden.';
      return;
    }

    const secretAnswer = (this.passwordForm.value.secretAnswer || '').trim();
    if (!secretAnswer) {
      this.msgErr = 'Debes ingresar tu respuesta secreta.';
      return;
    }

    this.hartService.changePassword({ secretAnswer, newPassword }).subscribe({
      next: (response) => {
        if (!response?.success) {
          this.showErrorModal('No se pudo cambiar', response?.message || 'No se pudo cambiar la contraseña.');
          this.refreshView();
          return;
        }

        if (response.data) {
          this.setCurrentUser(response.data);
        }

        this.showSuccessToast(response?.message || 'Contraseña actualizada correctamente.');
        this.passwordForm.reset();
        this.showPwd1 = false;
        this.showPwd2 = false;
        this.refreshView();
      },
      error: (error) => {
        this.showErrorModal('Error', error?.message || 'No se pudo cambiar la contraseña.');
        this.refreshView();
      },
    });
  }

  revokeIp(ipId: string) {
    this.confirmDeleteIp(ipId).then((confirmed) => {
      if (!confirmed) return;

      this.msgOk = '';
      this.msgErr = '';

      this.hartService.deleteAllowedIp(ipId).subscribe({
        next: (response) => {
          if (!response?.success) {
            this.showErrorModal('No se pudo revocar', response?.message || 'No se pudo revocar la IP.');
            this.refreshView();
            return;
          }

          if (response.data) {
            this.setCurrentUser(response.data);
          } else {
            this.currentUser.ips = this.currentUser.ips?.filter(x => x !== ipId) || [];
          }

          this.showSuccessToast(response?.message || 'IP revocada correctamente.');
          this.refreshView();
        },
        error: (error) => {
          this.showErrorModal('Error', error?.message || 'No se pudo revocar la IP.');
          this.refreshView();
        },
      });
    });
  }

  getSubscriptionStatus(): string {
    return this.getRemainingSubscriptionMs() > 0 ? 'Abonado' : 'No Abonado';
  }

  getSubscriptionExpiryText(): string {
    const expiryMs = this.getSubscriptionExpiryMs();
    if (!expiryMs || this.getRemainingSubscriptionMs() <= 0) {
      return 'Sin abono activo';
    }

    return `Hasta ${new Date(expiryMs).toLocaleString('es-ES')}`;
  }

  hasAdminAccess(): boolean {
    return Number(this.currentUser?.rango ?? 0) >= 2;
  }

  private getRemainingSubscriptionMs(): number {
    if (!this.subscriptionExpiryMs) return 0;
    return Math.max(this.subscriptionExpiryMs - Date.now(), 0);
  }

  private getSubscriptionExpiryMs(): number | null {
    return this.subscriptionExpiryMs;
  }

  private setCurrentUser(user: User): void {
    this.currentUser = {
      ...this.currentUser,
      ...user,
      ips: user.ips ?? [],
      personajes: user.personajes ?? [],
    };

    const raw = user?.abono;
    if (!raw || raw <= 0) {
      this.subscriptionExpiryMs = null;
      return;
    }

    // Si viene en epoch ms (13 dígitos), se usa directo.
    // Si viene como duración restante en ms, se suma al tiempo actual.
    this.subscriptionExpiryMs = raw >= 1_000_000_000_000 ? raw : Date.now() + raw;
  }

  private refreshView(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }

  private confirmDeleteIp(ip: string): Promise<boolean> {
    return Swal.fire({
      title: 'Revocar IP permitida',
      text: `Se eliminará la IP ${ip} de tu lista de acceso.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, revocar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: {
        popup: 'swal-profile-popup',
        title: 'swal-profile-title',
        confirmButton: 'swal-profile-confirm',
        cancelButton: 'swal-profile-cancel',
      },
      buttonsStyling: false,
    }).then((result) => !!result.isConfirmed);
  }

  private showSuccessToast(message: string): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      timer: 2600,
      timerProgressBar: true,
      showConfirmButton: false,
      icon: 'success',
      title: message,
      customClass: {
        popup: 'swal-profile-toast',
      },
    });
  }

  private showErrorModal(title: string, message: string): void {
    Swal.fire({
      title,
      text: message,
      icon: 'error',
      confirmButtonText: 'Entendido',
      customClass: {
        popup: 'swal-profile-popup',
        title: 'swal-profile-title',
        confirmButton: 'swal-profile-confirm',
      },
      buttonsStyling: false,
    });
  }
}
