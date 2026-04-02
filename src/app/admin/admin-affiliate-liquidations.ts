import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, finalize } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import {
  AdminAffiliateLiquidationItem,
  AdminService,
} from '../services/admin.service';

@Component({
  selector: 'app-admin-affiliate-liquidations',
  standalone: true,
  imports: [CommonModule],
  providers: [DecimalPipe],
  templateUrl: './admin-affiliate-liquidations.html',
  styleUrl: './admin-affiliate-liquidations.scss',
})
export class AdminAffiliateLiquidations implements OnInit, OnDestroy {
  loading = true;
  errorMessage = '';
  pendingRows: AdminAffiliateLiquidationItem[] = [];
  paidRows: AdminAffiliateLiquidationItem[] = [];
  processingKey = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly adminService: AdminService,
    private readonly cdr: ChangeDetectorRef,
    private readonly decimalPipe: DecimalPipe,
  ) {}

  ngOnInit(): void {
    this.loadLiquidations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLiquidations(): void {
    this.loading = true;
    this.errorMessage = '';
    this.refreshView();

    this.adminService
      .getAffiliateLiquidations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.pendingRows = response.pendientes;
          this.paidRows = response.pagados;
          this.loading = false;
          this.refreshView();
        },
        error: error => {
          this.pendingRows = [];
          this.paidRows = [];
          this.loading = false;
          this.errorMessage =
            error?.error?.message || error?.message || 'No se pudo cargar el modulo de liquidaciones.';
          this.refreshView();
        },
      });
  }

  async markAsPaid(row: AdminAffiliateLiquidationItem): Promise<void> {
    const confirmResult = await Swal.fire({
      title: 'Confirmar pago',
      text: 'Estas seguro de que ya transferiste este dinero al creador? Esta accion no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, marcar pagado',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    this.processingKey = this.getRowKey(row);
    this.refreshView();

    this.adminService
      .markAffiliateLiquidationPaid({
        codigo: row.codigo,
        cuentaId: row.cuentaId,
        tsCorte: row.tsCorte,
        monto: row.comisionAPagar,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.processingKey = '';
          this.refreshView();
        }),
      )
      .subscribe({
        next: async response => {
          await Swal.fire(
            'Pago registrado',
            response?.message || 'El pago se registro correctamente.',
            'success',
          );
          this.loadLiquidations();
        },
        error: async error => {
          await Swal.fire(
            'Error',
            error?.error?.message || error?.message || 'No se pudo registrar el pago.',
            'error',
          );
        },
      });
  }

  isProcessing(row: AdminAffiliateLiquidationItem): boolean {
    return this.processingKey === this.getRowKey(row);
  }

  formatCop(value: number): string {
    return `$ ${this.decimalPipe.transform(value ?? 0, '1.0-0') ?? '0'}`;
  }

  formatUsd(value: number): string {
    return `$ ${this.decimalPipe.transform(value ?? 0, '1.2-2') ?? '0.00'}`;
  }

  trackByRow(_index: number, row: AdminAffiliateLiquidationItem): string {
    return this.getRowKey(row);
  }

  private getRowKey(row: AdminAffiliateLiquidationItem): string {
    return `${row.codigo}-${row.tsCorte}`;
  }

  private refreshView(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }
}
