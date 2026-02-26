import { RouterModule } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hart, User } from '../services/hart';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule], // 👈 aquí
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})


export class Header implements OnInit, OnDestroy {

  isLoggedIn = false;
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  constructor(private hart: Hart) {}

  ngOnInit(): void {
    this.checkLoggedIn();
    
    // Suscribirse a los cambios de autenticación
    this.hart.authStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoggedIn => {
        this.isLoggedIn = isLoggedIn;
        if (!isLoggedIn) {
          this.currentUser = null;
        }
      });

    // Suscribirse a los cambios del usuario actual
    this.hart.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.currentUser = user;
          this.isLoggedIn = true;
        } else {
          this.currentUser = null;
          this.isLoggedIn = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkLoggedIn(): void {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    this.isLoggedIn = !!token && !!user;
    if (user) {
      this.currentUser = JSON.parse(user);
    }
  }

  getSubscriptionStatus(): string {
    // Si abono no es 0 (y no es null/undefined), devolver "Abonado", sino "No Abonado"
    if (this.currentUser?.abono !== null && this.currentUser?.abono !== undefined && this.currentUser.abono !== 0) {
      return 'Abonado';
    }
    return 'No Abonado';
  }

  logout(): void {
    this.hart.logout();
    this.isLoggedIn = false;
    this.currentUser = null;
    window.location.href = '/';
  }
}
