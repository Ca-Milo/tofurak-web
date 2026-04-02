import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  AdminPurchaseItem,
  AdminPurchaseStat,
  AdminService,
} from '../services/admin.service';

@Component({
  selector: 'app-admin-purchases',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe, DecimalPipe],
  templateUrl: './admin-purchases.html',
  styleUrl: './admin-purchases.scss',
})
export class AdminPurchases implements OnInit, OnDestroy {
  searchTerm = '';
  loading = true;
  errorMessage = '';
  stats: AdminPurchaseStat[] = [];
  rows: AdminPurchaseItem[] = [];
  columnFilters = ['', '', '', '', '', '', '', ''];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly adminService: AdminService,
    private readonly cdr: ChangeDetectorRef,
    private readonly datePipe: DatePipe,
    private readonly decimalPipe: DecimalPipe,
  ) {}

  ngOnInit(): void {
    this.loadPurchases();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPurchases(query = this.searchTerm): void {
    this.loading = true;
    this.errorMessage = '';
    this.searchTerm = query;
    this.refreshView();

    this.adminService
      .getPurchases(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.stats = response.stats;
          this.rows = response.rows;
          this.loading = false;
          this.refreshView();
        },
        error: error => {
          this.stats = [];
          this.rows = [];
          this.loading = false;
          this.errorMessage =
            error?.error?.message || error?.message || 'No se pudo cargar el modulo de compras.';
          this.refreshView();
        },
      });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.loadPurchases('');
  }

  updateColumnFilter(index: number, value: string): void {
    this.columnFilters[index] = value;
  }

  get visibleRows(): AdminPurchaseItem[] {
    return this.rows.filter(row => this.matchesColumnFilters(row));
  }

  getStatValue(key: string): number {
    return this.stats.find(stat => stat.key === key)?.value ?? 0;
  }

  formatDate(value: string): string {
    return this.datePipe.transform(value, 'dd/MM/yy HH:mm') || '--/--/-- --:--';
  }

  formatTotal(row: AdminPurchaseItem): string {
    const digits = row.currency === 'USD' ? '1.2-2' : '1.0-0';
    const value = this.decimalPipe.transform(row.total, digits) ?? '0';
    return row.currency === 'USD' ? `USD ${value}` : `$ ${value}`;
  }

  getStatusClass(status: string): string {
    if (status === 'APPROVED' || status === 'COMPLETED') {
      return 'badge badge-success';
    }

    if (status === 'PENDING' || status === 'PROCESSING' || status === 'IN_PROCESS') {
      return 'badge badge-pending';
    }

    return 'badge badge-error';
  }

  trackByReference(_index: number, row: AdminPurchaseItem): string {
    return `${row.reference}-${row.userId}`;
  }

  private matchesColumnFilters(row: AdminPurchaseItem): boolean {
    const cells = [
      this.formatDate(row.createdAt),
      `${row.userAccount} ID: ${row.userId}`,
      row.method,
      row.reference,
      row.products.map(product => `${product.quantity}x ${product.name}`).join(' '),
      row.promoCode ?? '----',
      this.formatTotal(row),
      row.status,
    ];

    return this.columnFilters.every((filter, index) => {
      const normalizedFilter = filter.trim().toUpperCase();
      if (!normalizedFilter) {
        return true;
      }

      return String(cells[index] ?? '').toUpperCase().includes(normalizedFilter);
    });
  }

  private refreshView(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }
}
