import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Hart, User } from '../services/hart';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-header-shop',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header-shop.html',
  styleUrl: './header-shop.scss',
})
export class HeaderShop implements OnInit, OnDestroy {
  isLoggedIn = false;
  user: User | null = null;
  isMenuOpen = false;
  totalItems = 0;
  searchTerm = '';

  private destroy$ = new Subject<void>();

  constructor(
    private hart: Hart,
    private cartService: CartService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.hart.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.user = user;
      this.isLoggedIn = !!user;
    });

    this.cartService.cart$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.totalItems = this.cartService.totalItems;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout(): void {
    this.hart.logout();
    this.isMenuOpen = false;
    window.location.href = '/';
  }

  submitSearch(rawValue?: string): void {
    const search = (rawValue ?? this.searchTerm ?? '').trim();
    this.searchTerm = search;

    this.router.navigate(['/shop'], {
      queryParams: { buscar: search || null },
      queryParamsHandling: 'merge',
    });
  }
}
