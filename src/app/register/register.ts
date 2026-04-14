import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Hart } from '../services/hart';
import { IpService } from '../services/ip.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ 
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnDestroy, OnInit {

  showPassword = false;
  isLoading = false;

  // IP pública del usuario
  userIpv4 = '';

  // selects
  days = Array.from({ length: 31 }, (_, i) => i + 1);
  months = Array.from({ length: 12 }, (_, i) => i + 1);
  years = Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i);

  registerForm!: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private hart: Hart,
    private ipService: IpService,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Obtener la IP pública del usuario al iniciar el componente
    this.ipService.getPublicIp()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ip) => {
          this.userIpv4 = ip;
          console.log('IP pública obtenida:', ip);
        },
        error: (err) => {
          console.warn('No se pudo obtener IP:', err);
          this.userIpv4 = '';
        }
      });
  }

  private initForm(): void {
    const currentYear = new Date().getFullYear();
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(30), Validators.pattern(/^[a-zA-Z0-9]+$/)]],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      lastname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      nickname: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[a-zA-Z0-9]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]],
      confirmPassword: ['', [Validators.required]],
      secretQuestion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(255)]],
      secretAnswer: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(255)]],
      day: ['', [Validators.required, Validators.min(1), Validators.max(31)]],
      month: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
      year: ['', [Validators.required, Validators.min(1900), Validators.max(currentYear)]],
      accounts: ['1', [Validators.required, Validators.min(1), Validators.max(100)]],
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    const hasMismatch = !!password && !!confirmPassword && !!confirmPassword.value && password.value !== confirmPassword.value;
    const currentErrors = confirmPassword?.errors || {};

    if (!confirmPassword) {
      return null;
    }

    if (hasMismatch) {
      confirmPassword.setErrors({ ...currentErrors, passwordMismatch: true });
      return null;
    }

    if (currentErrors['passwordMismatch']) {
      const { passwordMismatch, ...remainingErrors } = currentErrors;
      confirmPassword.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null);
    }

    return null;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onBlur(field: string): void {
    this.registerForm.get(field)?.markAsTouched();
  }

  getError(field: string): string {
    const control = this.registerForm.get(field);
    if (control?.touched && control.errors) {
      if (control.errors['required']) return 'Este campo es requerido';
      if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
      if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
      if (control.errors['pattern']) return 'Solo letras y números sin espacios';
      if (control.errors['email']) return 'Email inválido';
      if (control.errors['min']) return `El valor debe ser mayor o igual a ${control.errors['min'].min}`;
      if (control.errors['max']) return `El valor debe ser menor o igual a ${control.errors['max'].max}`;
      if (control.errors['passwordMismatch']) return 'Las contraseñas no coinciden';
    }
    return '';
  }
 
  isFormValid(): boolean {
    return this.registerForm.valid;
  }

  onRegister(): void {
    if (this.isLoading) {
      return;
    }

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      void Swal.fire({
        title: 'Formulario incompleto',
        text: 'Revisa los campos marcados antes de continuar.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
        background: '#0f0d19',
        customClass: {
          popup: 'custom-swal-popup',
          title: 'custom-swal-title',
          htmlContainer: 'custom-swal-html-container',
          confirmButton: 'custom-swal-confirm-button'
        },
        heightAuto: false
      });
      return;
    }

    this.isLoading = true;
    this.openLoadingModal();

    const v = this.registerForm.value;

    const payload = {
      username: v.username,
      name: v.name,
      lastname: v.lastname,
      nickname: v.nickname,
      email: v.email,
      password: v.password,
      confirmPassword: v.confirmPassword,
      secretQuestion: v.secretQuestion,
      secretAnswer: v.secretAnswer,
      day: v.day ? Number(v.day) : undefined,
      month: v.month ? Number(v.month) : undefined,
      year: v.year ? Number(v.year) : undefined,
      accounts: v.accounts ? Number(v.accounts) : undefined,
      ipv4: this.userIpv4,
    }; 
 
    this.hart.register(payload)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res: any) => {
        this.isLoading = false;
        Swal.close();
        
        let accountsHtml = '';
        const password = this.registerForm.value.password;
        const accounts = res?.data?.allAccounts || [];

        if (accounts.length > 0) {
            accountsHtml = accounts
              .map((acc: any) => `<p><b>Usuario:</b> ${acc.cuenta} - <b>Contraseña:</b> ${password}</p>`)
              .join('');
        } else {
            accountsHtml = '<p>¡Registro exitoso! Ya puedes iniciar sesión.</p>';
        } 

        void Swal.fire({
          title: res.message || '¡Cuenta(s) creada(s)!',
          html: `
            <div style="text-align: left; margin-top: 20px;">
              ${accountsHtml}
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Iniciar Sesión',
          background: '#0f0d19',
          customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            htmlContainer: 'custom-swal-html-container',
            confirmButton: 'custom-swal-confirm-button'
          },
          heightAuto: false
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/login']);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        Swal.close();

        void Swal.fire({
          title: 'No se pudo completar el registro',
          html: this.buildErrorHtml(err),
          icon: 'error',
          confirmButtonText: 'Cerrar',
          background: '#0f0d19',
          customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            htmlContainer: 'custom-swal-html-container',
            confirmButton: 'custom-swal-confirm-button'
          },
          heightAuto: false
        });
      },
    });
  }

  private openLoadingModal(): void {
    void Swal.fire({
      title: 'Creando cuenta...',
      text: 'Estamos procesando tu registro.',
      allowEscapeKey: false,
      allowOutsideClick: false,
      showConfirmButton: false,
      background: '#0f0d19',
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        htmlContainer: 'custom-swal-html-container'
      },
      didOpen: () => {
        Swal.showLoading();
      },
      heightAuto: false
    });
  }

  private buildErrorHtml(error: unknown): string {
    const messages = this.extractErrorMessages(error);

    if (messages.length === 1) {
      return `<p>${messages[0]}</p>`;
    }

    return `
      <div style="text-align: left; margin-top: 20px;">
        ${messages.map((message) => `<p>• ${message}</p>`).join('')}
      </div>
    `;
  }

  private extractErrorMessages(error: unknown): string[] {
    const candidate = error as {
      errors?: string[];
      message?: string;
      error?: {
        errors?: string[];
        message?: string;
      };
    };

    const backendErrors = candidate?.errors;
    if (Array.isArray(backendErrors) && backendErrors.length > 0) {
      return backendErrors;
    }

    const nestedErrors = candidate?.error?.errors;
    if (Array.isArray(nestedErrors) && nestedErrors.length > 0) {
      return nestedErrors;
    }

    const message = candidate?.message || candidate?.error?.message;
    if (message) {
      return [message];
    }

    return ['Ocurrió un error inesperado al registrar la cuenta.'];
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
