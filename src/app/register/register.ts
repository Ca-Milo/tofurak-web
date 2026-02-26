import { Component, OnDestroy, ChangeDetectorRef, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Hart } from '../services/hart';
import { IpService } from '../services/ip.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ 
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnDestroy, OnInit {

  showPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  userTouched = false;
  emailTouched = false;
  passTouched = false;
  confirmTouched = false;

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
    private router: Router,
    private cdr: ChangeDetectorRef
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
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      name: ['', [Validators.required]],
      lastname: ['', [Validators.required]],
      nickname: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      secretQuestion: ['', [Validators.required]],
      secretAnswer: ['', [Validators.required]],
      day: ['', [Validators.required]],
      month: ['', [Validators.required]],
      year: ['', [Validators.required]],
      accounts: ['1', [Validators.required]],
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onBlurUser() { this.userTouched = true; }
  onBlurEmail() { this.emailTouched = true; }
  onBlurPass() { this.passTouched = true; }
  onBlurConfirm() { this.confirmTouched = true; }

  getUsernameError() {
    const c = this.registerForm.get('username');
    if (c?.errors?.['required']) return 'El usuario es requerido';
    if (c?.errors?.['minlength']) return 'Mínimo 3 caracteres';
    return '';
  }

  getEmailError() {
    const c = this.registerForm.get('email');
    if (c?.errors?.['required']) return 'El email es requerido';
    if (c?.errors?.['email']) return 'Email inválido';
    return '';
  }

  getPasswordError() {
    const c = this.registerForm.get('password');
    if (c?.errors?.['required']) return 'La contraseña es requerida';
    if (c?.errors?.['minlength']) return 'Mínimo 6 caracteres';
    return '';
  }

  getConfirmError() {
    const v = this.registerForm.value;
    if (v.password && v.confirmPassword && v.password !== v.confirmPassword) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }

  isFormValid(): boolean {
    return this.registerForm.valid && !this.getConfirmError();
  }

  onRegister(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.isFormValid()) {
      this.errorMessage = 'Completa todos los campos correctamente';
      return;
    }

    this.isLoading = true;

    const v = this.registerForm.value;

    // Enviar todos los campos del formulario al backend en un solo payload
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
      // Convertir a number cuando aplique
      day: v.day ? Number(v.day) : undefined,
      month: v.month ? Number(v.month) : undefined,
      year: v.year ? Number(v.year) : undefined,
      accounts: v.accounts ? Number(v.accounts) : undefined,
      // Añadir la IP pública del cliente
      ipv4: this.userIpv4,
    }; 
 
    this.hart.register(payload)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Cuenta creada correctamente';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || err?.error?.message || 'Error al registrar';
        this.cdr.detectChanges();
        console.error('Error al registrar:', err);
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
