import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HeaderShop } from '../header-shop/header-shop';
import { ShopFooter } from '../shop-footer/shop-footer';
import { OrderHistoryItem, PaymentService } from '../services/payment.service';

@Component({
  selector: 'app-shop-order-history',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderShop, ShopFooter],
  providers: [DatePipe, DecimalPipe],
  templateUrl: './shop-order-history.html',
  styleUrl: './shop-order-history.scss',
})
export class ShopOrderHistory implements OnInit, OnDestroy {
  orders: OrderHistoryItem[] = [];
  loading = true;
  errorMessage = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly paymentService: PaymentService,
    private readonly cdr: ChangeDetectorRef,
    private readonly datePipe: DatePipe,
    private readonly decimalPipe: DecimalPipe,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';
    this.refreshView();

    this.paymentService
      .getOrderHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: orders => {
          this.orders = [...orders]
            .filter(order => order.statusTone === 'success')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          this.loading = false;
          this.refreshView();
        },
        error: error => {
          this.orders = [];
          this.loading = false;
          this.errorMessage =
            error?.error?.message || error?.message || 'No pudimos cargar tu historial por ahora.';
          this.refreshView();
        },
      });
  }

  trackByReference(_index: number, order: OrderHistoryItem): string {
    return order.reference;
  }

  getMethodShortLabel(order: OrderHistoryItem): string {
    switch (order.method) {
      case 'mercado_pago':
        return 'MP';
      case 'paypal':
        return 'PP';
      case 'wompi':
        return 'WM';
      default:
        return order.methodLabel.slice(0, 2).toUpperCase();
    }
  }

  getMethodClass(order: OrderHistoryItem): string {
    switch (order.method) {
      case 'mercado_pago':
        return 'is-mercado-pago';
      case 'paypal':
        return 'is-paypal';
      case 'wompi':
        return 'is-wompi';
      default:
        return 'is-default';
    }
  }

  getStatusClass(order: OrderHistoryItem): string {
    return `status-badge status-${order.statusTone}`;
  }

  formatDate(value: string): string {
    return this.datePipe.transform(value, 'dd/MM/yy') || '--/--/--';
  }

  formatTime(value: string): string {
    return this.datePipe.transform(value, 'hh:mm a') || '--:--';
  }

  formatAmount(order: OrderHistoryItem): string {
    const digits = order.currency === 'USD' ? '1.2-2' : '1.0-0';
    const value = this.decimalPipe.transform(order.total ?? 0, digits) ?? '0';
    return `${order.currency} ${value}`;
  }

  private refreshView(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }
}
