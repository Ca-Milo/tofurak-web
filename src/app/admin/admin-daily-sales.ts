import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  AdminDailySalesDay,
  AdminDailySalesResponse,
  AdminService,
} from '../services/admin.service';

@Component({
  selector: 'app-admin-daily-sales',
  standalone: true,
  imports: [CommonModule],
  providers: [DecimalPipe],
  templateUrl: './admin-daily-sales.html',
  styleUrl: './admin-daily-sales.scss',
})
export class AdminDailySales implements OnInit, OnDestroy {
  loading = true;
  errorMessage = '';
  sales: AdminDailySalesResponse = {
    wompiDisponible: 0,
    tasaDolar: 3500,
    metaDiaria: 100000,
    totals: {
      granTotalEstimado: 0,
      totalPeriodoCop: 0,
      totalPeriodoUsd: 0,
    },
    days: [],
  };

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly adminService: AdminService,
    private readonly cdr: ChangeDetectorRef,
    private readonly decimalPipe: DecimalPipe,
  ) {}

  ngOnInit(): void {
    this.loadDailySales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDailySales(): void {
    this.loading = true;
    this.errorMessage = '';
    this.refreshView();

    this.adminService
      .getDailySales()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.sales = response;
          this.loading = false;
          this.refreshView();
        },
        error: error => {
          this.loading = false;
          this.errorMessage =
            error?.error?.message || error?.message || 'No se pudo cargar el reporte de ventas diarias.';
          this.refreshView();
        },
      });
  }

  get orderedDays(): AdminDailySalesDay[] {
    return [...this.sales.days].sort((a, b) => b.dia.localeCompare(a.dia));
  }

  formatCop(value: number): string {
    return `$ ${this.decimalPipe.transform(value ?? 0, '1.0-0') ?? '0'}`;
  }

  formatUsd(value: number): string {
    return `USD ${this.decimalPipe.transform(value ?? 0, '1.2-2') ?? '0.00'}`;
  }

  formatApproxCop(value: number): string {
    return `$ ${this.decimalPipe.transform(value ?? 0, '1.0-0') ?? '0'}`;
  }

  shortDayLabel(value: string): string {
    const [year, month, day] = String(value ?? '').split('-');
    if (!year || !month || !day) {
      return value;
    }

    return `${month}-${day}`;
  }

  goalDifference(day: AdminDailySalesDay): number {
    return Math.max((day.metaDiaria || this.sales.metaDiaria) - day.totalNeto, 0);
  }

  trackByDay(_index: number, day: AdminDailySalesDay): string {
    return day.dia;
  }

  private refreshView(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }
}
