import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
  providers: [DecimalPipe],
  templateUrl: './admin-daily-sales.html',
  styleUrl: './admin-daily-sales.scss',
})
export class AdminDailySales implements OnInit, OnDestroy {
  loading = true;
  errorMessage = '';
  filters = {
    fechaInicio: '',
    fechaFin: '',
  };
  sales: AdminDailySalesResponse = {
    wompiDisponible: 0,
    tasaDolar: 3500,
    metaDiaria: 100000,
    search: {
      fechaInicio: '',
      fechaFin: '',
    },
    totals: {
      granTotalEstimado: 0,
      totalPeriodoCop: 0,
      totalPeriodoUsd: 0,
      totalPeriodoNeto: 0,
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
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 29);
    this.filters.fechaInicio = this.toDateInputValue(start);
    this.filters.fechaFin = this.toDateInputValue(today);
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
      .getDailySales({
        fecha_inicio: this.filters.fechaInicio,
        fecha_fin: this.filters.fechaFin,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.sales = response;
          this.filters.fechaInicio = response.search.fechaInicio || this.filters.fechaInicio;
          this.filters.fechaFin = response.search.fechaFin || this.filters.fechaFin;
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

  get chartDays(): AdminDailySalesDay[] {
    return [...this.sales.days].sort((a, b) => a.dia.localeCompare(b.dia));
  }

  get totalWompiPeriodo(): number {
    return this.sales.days.reduce((total, day) => total + (day.totalWompi || 0), 0);
  }

  get totalMpPeriodo(): number {
    return this.sales.days.reduce((total, day) => total + (day.totalMp || 0), 0);
  }

  get maxChartValue(): number {
    return this.chartDays.reduce((max, day) => Math.max(max, day.totalNeto), 0);
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
      return String(value ?? '');
    }

    return `${month}-${day}`;
  }

  goalDifference(day: AdminDailySalesDay): number {
    return Math.max((day.metaDiaria || this.sales.metaDiaria) - day.totalNeto, 0);
  }

  getBarHeight(day: AdminDailySalesDay): number {
    if (!this.maxChartValue) {
      return 6;
    }

    return Math.max((day.totalNeto / this.maxChartValue) * 100, 6);
  }

  trackByDay(_index: number, day: AdminDailySalesDay): string {
    return day.dia;
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private refreshView(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }
}
