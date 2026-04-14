import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Register } from './register';
import { Hart } from '../services/hart';
import { IpService } from '../services/ip.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let hartSpy: jasmine.SpyObj<Hart>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    hartSpy = jasmine.createSpyObj<Hart>('Hart', ['register']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        { provide: Hart, useValue: hartSpy },
        {
          provide: IpService,
          useValue: {
            getPublicIp: () => of('127.0.0.1'),
          },
        },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows a validation modal when the form is invalid', () => {
    const swalSpy = spyOn(Swal, 'fire').and.resolveTo({
      isConfirmed: true,
    } as any);

    component.onRegister();

    expect(hartSpy.register).not.toHaveBeenCalled();
    expect(swalSpy).toHaveBeenCalled();
  });

  it('shows success modal for a single account and redirects after confirm', async () => {
    hartSpy.register.and.returnValue(of({
      success: true,
      message: 'Se crearon 1 cuenta(s) exitosamente',
      data: {
        id: '1',
        cuenta: 'demo',
        allAccounts: [{ cuenta: 'demo' }],
      },
      token: 'token',
    } as any));

    spyOn(Swal, 'close');
    const swalSpy = spyOn(Swal, 'fire').and.resolveTo({
      isConfirmed: true,
    } as any);

    component.registerForm.patchValue({
      username: 'demo',
      name: 'Demo',
      lastname: 'User',
      nickname: 'demo123',
      email: 'demo@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
      secretQuestion: 'Pregunta demo',
      secretAnswer: 'Respuesta demo',
      day: 1,
      month: 1,
      year: 2000,
      accounts: 1,
    });

    component.onRegister();
    await Promise.resolve();

    expect(hartSpy.register).toHaveBeenCalled();
    expect(swalSpy).toHaveBeenCalledTimes(2);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('shows backend errors in a modal', () => {
    hartSpy.register.and.returnValue(throwError(() => ({
      message: 'Revisa los datos del formulario e inténtalo nuevamente.',
      errors: ['El usuario ya existe.'],
    })));

    spyOn(Swal, 'close');
    const swalSpy = spyOn(Swal, 'fire').and.resolveTo({
      isConfirmed: true,
    } as any);

    component.registerForm.patchValue({
      username: 'demo',
      name: 'Demo',
      lastname: 'User',
      nickname: 'demo123',
      email: 'demo@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
      secretQuestion: 'Pregunta demo',
      secretAnswer: 'Respuesta demo',
      day: 1,
      month: 1,
      year: 2000,
      accounts: 1,
    });

    component.onRegister();

    expect(swalSpy).toHaveBeenCalledTimes(2);
    const lastCallArgs = swalSpy.calls.mostRecent().args[0] as any;
    expect(lastCallArgs.title).toContain('No se pudo completar el registro');
    expect(lastCallArgs.html).toContain('El usuario ya existe.');
  });

  it('preserves required error on confirmPassword before mismatch', () => {
    component.registerForm.patchValue({
      password: 'secret1',
      confirmPassword: '',
    });

    component.registerForm.get('confirmPassword')?.markAsTouched();
    component.registerForm.updateValueAndValidity();

    expect(component.registerForm.get('confirmPassword')?.errors?.['required']).toBeTrue();
    expect(component.registerForm.get('confirmPassword')?.errors?.['passwordMismatch']).toBeUndefined();
  });
});
