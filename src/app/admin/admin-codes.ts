import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminCodeItem, AdminCodesResponse, AdminService } from '../services/admin.service';

@Component({
  selector: 'app-admin-codes',
  standalone: true,
  imports: [CommonModule],
  providers: [DecimalPipe],
  templateUrl: './admin-codes.html',
  styleUrl: './admin-codes.scss',
})
export class AdminCodes implements OnInit, OnDestroy {
  loading = true;
  errorMessage = '';
  data: AdminCodesResponse = {
    wompiDisponible: 0,
    totals: {
      grandTotalVentas: 0,
      grandTotalCop: 0,
      grandTotalUsd: 0,
      grandTotalPagarAfiliados: 0,
      granTotalUnificado: 0,
      tasaDolar: 3500,
    },
    chart: [],
    rows: [],
  };

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly adminService: AdminService,
    private readonly cdr: ChangeDetectorRef,
    private readonly decimalPipe: DecimalPipe,
  ) {}

  ngOnInit(): void {
    this.loadCodes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCodes(): void {
    this.loading = true;
    this.errorMessage = '';
    this.refreshView();

    this.adminService
      .getCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.data = response;
          this.loading = false;
          this.refreshView();
        },
        error: error => {
          this.loading = false;
          this.errorMessage =
            error?.error?.message || error?.message || 'No se pudo cargar el modulo de codigos.';
          this.refreshView();
        },
      });
  }

  formatCop(value: number): string {
    return `$ ${this.decimalPipe.transform(value ?? 0, '1.0-0') ?? '0'}`;
  }

  formatUsd(value: number): string {
    return `USD ${this.decimalPipe.transform(value ?? 0, '1.2-2') ?? '0.00'}`;
  }

  trackByCode(_index: number, row: AdminCodeItem): string {
    return `${row.id}-${row.codigo}`;
  }

  private refreshView(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }
}
