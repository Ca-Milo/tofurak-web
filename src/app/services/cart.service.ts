import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: number;
  nombre: string;
  imagen: string;
  cop: number;
  usd: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartKey = 'shopCart';
  private cartSubject = new BehaviorSubject<CartItem[]>(this.loadCart());
  cart$ = this.cartSubject.asObservable();

  get items(): CartItem[] {
    return this.cartSubject.getValue();
  }

  get totalItems(): number {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  get totals(): { cop: number; usd: number } {
    return this.items.reduce(
      (acc, i) => ({ cop: acc.cop + i.cop * i.quantity, usd: acc.usd + i.usd * i.quantity }),
      { cop: 0, usd: 0 },
    );
  }

  add(product: Omit<CartItem, 'quantity'>, qty = 1): void {
    const items = [...this.items];
    const idx = items.findIndex(i => i.id === product.id);
    if (idx >= 0) {
      items[idx] = { ...items[idx], quantity: Math.min(items[idx].quantity + qty, 5) };
    } else {
      items.push({ ...product, quantity: qty });
    }
    this.update(items);
  }

  isAtLimit(id: number): boolean {
    const item = this.items.find(i => i.id === id);
    return !!item && item.quantity >= 5;
  }

  increase(id: number): void {
    this.update(
      this.items.map(i => (i.id === id ? { ...i, quantity: Math.min(i.quantity + 1, 5) } : i)),
    );
  }

  decrease(id: number): void {
    this.update(
      this.items
        .map(i => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter(i => i.quantity > 0),
    );
  }

  remove(id: number): void {
    this.update(this.items.filter(i => i.id !== id));
  }

  private update(items: CartItem[]): void {
    this.cartSubject.next(items);
    localStorage.setItem(this.cartKey, JSON.stringify(items));
  }

  private loadCart(): CartItem[] {
    try {
      return JSON.parse(localStorage.getItem(this.cartKey) || '[]');
    } catch {
      return [];
    }
  }
}
