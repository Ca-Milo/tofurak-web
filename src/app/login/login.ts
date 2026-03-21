import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Globals } from '../globals/globals';
import { Hart } from '../services/hart';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule, 
    MatButtonModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit, OnDestroy {

  showPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Estados de validación
  userTouched = false;
  passTouched = false;

  loginForm!: FormGroup;
  
  private destroy$ = new Subject<void>();

  constructor(
    public global: Globals,
    private hart: Hart,
    private formBuilder: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Si ya está autenticado, redirigir al home
    if (this.hart.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario reactivo
   */
  private initForm(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Marca el campo usuario como tocado
   */
  onBlurUser(): void {
    this.userTouched = true;
  }

  /**
   * Marca el campo contraseña como tocado
   */
  onBlurPass(): void {
    this.passTouched = true;
  }

  /**
   * Obtiene el mensaje de error del campo username
   */
  getUsernameError(): string {
    const control = this.loginForm.get('username');
    if (!control?.touched || !control?.errors) {
      return '';
    }
    if (control.errors['required']) {
      return 'El usuario es requerido';
    }
    if (control.errors['minlength']) {
      return 'El usuario debe tener al menos 3 caracteres';
    }
    return '';
  }

  /**
   * Obtiene el mensaje de error del campo password
   */
  getPasswordError(): string {
    const control = this.loginForm.get('password');
    if (!control?.touched || !control?.errors) {
      return '';
    }
    if (control.errors['required']) {
      return 'La contraseña es requerida';
    }
    if (control.errors['minlength']) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }

  /**
   * Verifica si el formulario es válido para enviar
   */
  isFormValid(): boolean {
    return this.loginForm.valid;
  }

  /**
   * Realiza el login del usuario
   */
  onLogin(): void {
    // Resetear mensajes
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.isFormValid()) {
      this.errorMessage = 'Por favor completa todos los campos correctamente';
      return;
    }

    this.isLoading = true;

    const { username, password } = this.loginForm.value;

    this.hart.login(username, password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = '¡Login exitoso! Redirigiendo...';
            setTimeout(() => {
              this.router.navigate(['/home']);
            }, 1500);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || error?.error?.message || 'Usuario o contraseña incorrectos';
          this.cdr.detectChanges();
          console.error('Error al iniciar sesión:', error);
        },
      });
  }

  /**
   * Navega al componente de registro
   */
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  async openPasswordRecovery() {
    const { value: email } = await Swal.fire({
      title: 'Recuperar Cuenta',
      input: 'email',
      inputLabel: 'Ingresa tu correo electrónico y te enviaremos tus cuentas asociadas.',
      inputPlaceholder: 'ejemplo@hotmail.com',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      background: '#fff',
      color: '#333',
      confirmButtonColor: '#ff7b00',
      customClass: {
        popup: 'swal-ankama-box',
        confirmButton: 'swal-ankama-btn',
        input: 'swal2-input'
      },
      showLoaderOnConfirm: true,
      preConfirm: (emailValue) => {
        if (!emailValue) {
          Swal.showValidationMessage('El correo electrónico es obligatorio');
          return;
        }
        return this.hart.recoverPassword(emailValue)
          .pipe(takeUntil(this.destroy$))
          .toPromise()
          .catch(error => {
            Swal.showValidationMessage(`Request failed: ${error.message}`);
          });
      },
      allowOutsideClick: () => !Swal.isLoading()
    });

    if (email) {
      if (email.success) {
        Swal.fire({
          title: '¡CORREO ENVIADO!',
          text: 'Revisa tu bandeja de entrada (y spam).',
          icon: 'success',
          confirmButtonColor: '#ff7b00',
          background: '#fff',
          color: '#333',
          customClass: { popup: 'swal-ankama-box', confirmButton: 'swal-ankama-btn' }
        });
      } else {
        Swal.fire({
          title: 'ERROR',
          text: email.message || 'No se encontró el correo.',
          icon: 'error',
          confirmButtonColor: '#ff7b00',
          background: '#fff',
          color: '#333',
          customClass: { popup: 'swal-ankama-box', confirmButton: 'swal-ankama-btn' }
        });
      }
    }
  }
}
