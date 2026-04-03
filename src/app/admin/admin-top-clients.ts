import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminService, AdminTopClientItem } from '../services/admin.service';

@Component({
  selector: 'app-admin-top-clients',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe, DecimalPipe],
  templateUrl: './admin-top-clients.html',
  styleUrl: './admin-top-clients.scss',
})
export class AdminTopClients implements OnInit, OnDestroy {
  loading = true;
  errorMessage = '';
  rows: AdminTopClientItem[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly adminService: AdminService,
    private readonly cdr: ChangeDetectorRef,
    private readonly datePipe: DatePipe,
    private readonly decimalPipe: DecimalPipe,
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadClients(): void {
    this.loading = true;
    this.errorMessage = '';
    this.refreshView();

    this.adminService
      .getTopClients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.rows = response.rows;
          this.loading = false;
          this.refreshView();
        },
        error: error => {
          this.rows = [];
          this.loading = false;
          this.errorMessage =
            error?.error?.message || error?.message || 'No se pudo cargar el modulo de top clientes.';
          this.refreshView();
        },
      });
  }

  getRankClass(rank: number): string {
    if (rank === 1) return 'rank-badge rank-1';
    if (rank === 2) return 'rank-badge rank-2';
    if (rank === 3) return 'rank-badge rank-3';
    return 'rank-badge rank-other';
  }

  getInitial(row: AdminTopClientItem): string {
    const source = row.nombreApodo || row.nombreCuenta || 'U';
    return source.charAt(0).toUpperCase();
  }

  formatCop(value: number): string {
    return `$ ${this.decimalPipe.transform(value ?? 0, '1.0-0') ?? '0'}`;
  }

  formatDate(value: string): string {
    return this.datePipe.transform(value, 'dd/MM/yyyy') || '--/--/----';
  }

  formatTime(value: string): string {
    return this.datePipe.transform(value, 'hh:mm a') || '--:--';
  }

  trackByClient(_index: number, row: AdminTopClientItem): number {
    return row.userId || row.rank;
  }

  private refreshView(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }
}
