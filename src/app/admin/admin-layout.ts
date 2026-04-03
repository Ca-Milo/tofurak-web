import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Hart, User } from '../services/hart';
import { AdminService } from '../services/admin.service';

interface AdminMenuItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout implements OnInit, OnDestroy {
  readonly menuItems: AdminMenuItem[] = [
    { label: 'Compras', route: '/admin/compras' },
    { label: 'Codigos & Afiliados', route: '/admin/codigos' },
    { label: 'Pagos Afiliados', route: '/admin/liquidaciones' },
    { label: 'Ventas Diarias', route: '/admin/ventas/diarias' },
    { label: 'Top Clientes', route: '/admin/clientes' },
    { label: 'Logs Intercambios', route: '/admin/logs/intercambios' },
    { label: 'Logs Servidor', route: '/admin/logs' },
  ];

  user: User | null = null;
  isMobileMenuOpen = false;
  wompiDisponibleText = '--';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly hart: Hart,
    private readonly adminService: AdminService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.hart.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.user = user;
      this.refreshView();
    });

    this.adminService.wompiDisponible$.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.wompiDisponibleText = value === null ? '--' : `$ ${value.toLocaleString('es-CO')}`;
      this.refreshView();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  goBackToShop(): void {
    this.closeMobileMenu();
    void this.router.navigate(['/shop']);
  }

  private refreshView(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }
}
