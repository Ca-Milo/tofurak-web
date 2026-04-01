import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HeaderShop } from '../header-shop/header-shop';
import { CartService, CartItem } from '../services/cart.service';
import { Hart, User } from '../services/hart';

@Component({
  selector: 'app-shop-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderShop],
  templateUrl: './shop-cart.html',
  styleUrl: './shop-cart.scss',
})
export class ShopCart implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  user: User | null = null;
  totals = { cop: 0, usd: 0 };

  private destroy$ = new Subject<void>();

  constructor(
    private cartService: CartService,
    private hart: Hart,
  ) {}

  ngOnInit(): void {
    this.cartService.cart$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cartItems = this.cartService.items;
      this.totals = this.cartService.totals;
    });

    this.hart.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.user = user;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  increase(id: number): void {
    this.cartService.increase(id);
  }

  decrease(id: number): void {
    this.cartService.decrease(id);
  }

  remove(id: number): void {
    this.cartService.remove(id);
  }

  getImgUrl(imagen: string): string {
    if (!imagen) return '';
    return imagen.startsWith('http') ? imagen : `assets/shop/items/${imagen}`;
  }

  hasDiscount(item: CartItem): boolean {
    return !!item.descuento && item.descuento > 0;
  }
}
