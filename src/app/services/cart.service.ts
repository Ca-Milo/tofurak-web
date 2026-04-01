import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: number;
  nombre: string;
  imagen: string;
  cop: number;
  usd: number;
  originalCop?: number;
  originalUsd?: number;
  descuento?: number;
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
      const rawItems = JSON.parse(localStorage.getItem(this.cartKey) || '[]');
      if (!Array.isArray(rawItems)) {
        return [];
      }

      return rawItems.map((item: any) => {
        const discount = item?.descuento != null ? Number(item.descuento) : undefined;
        const originalCop = item?.originalCop != null ? Number(item.originalCop) : undefined;
        const originalUsd = item?.originalUsd != null ? Number(item.originalUsd) : undefined;

        return {
          id: Number(item?.id ?? 0),
          nombre: String(item?.nombre ?? ''),
          imagen: String(item?.imagen ?? ''),
          cop:
            originalCop != null && discount != null
              ? this.getDiscountedCopPrice(originalCop, discount)
              : Number(item?.cop ?? 0),
          usd:
            originalUsd != null && discount != null
              ? this.getDiscountedUsdPrice(originalUsd, discount)
              : Number(item?.usd ?? 0),
          originalCop,
          originalUsd,
          descuento: discount,
          quantity: Math.max(1, Number(item?.quantity ?? 1)),
        };
      });
    } catch {
      return [];
    }
  }

  private getDiscountedCopPrice(price: number, discount: number): number {
    if (!discount || discount <= 0) return price;
    return Math.round(price * (1 - discount / 100));
  }

  private getDiscountedUsdPrice(price: number, discount: number): number {
    if (!discount || discount <= 0) return price;
    return Number((price * (1 - discount / 100)).toFixed(2));
  }
}
