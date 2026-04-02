import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HeaderShop } from '../header-shop/header-shop';
import { ShopFooter } from '../shop-footer/shop-footer';
import { Hart, User } from '../services/hart';
import {
  ReferralCode,
  ReferralDashboard,
  ReferralLiquidation,
  ReferralSale,
  ReferidosService,
} from '../services/referidos.service';

@Component({
  selector: 'app-referidos',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderShop, ShopFooter],
  providers: [DatePipe, DecimalPipe],
  templateUrl: './referidos.html',
  styleUrl: './referidos.scss',
})
export class ReferidosComponent implements OnInit, OnDestroy {
  user: User | null = null;
  dashboard: ReferralDashboard | null = null;
  loading = true;
  errorMessage = '';
  private isLoadingDashboard = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly hart: Hart,
    private readonly router: Router,
    private readonly referidosService: ReferidosService,
    private readonly cdr: ChangeDetectorRef,
    private readonly datePipe: DatePipe,
    private readonly decimalPipe: DecimalPipe,
  ) {}

  ngOnInit(): void {
    const currentUser = this.hart.getCurrentUser();
    if (currentUser) {
      this.user = currentUser;
      this.redirectIfUnauthorized(currentUser);
    }

    this.hart.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.user = user;
      this.redirectIfUnauthorized(user);
      if (this.hasReferralAccess(user) && !this.dashboard && !this.isLoadingDashboard) {
        this.loadDashboard();
      }
      this.refreshView();
    });

    if (this.hasReferralAccess(currentUser)) {
      this.loadDashboard();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get codes(): ReferralCode[] {
    return this.dashboard?.codes ?? [];
  }

  get liquidations(): ReferralLiquidation[] {
    const pending = this.dashboard?.liquidaciones?.pendientes ?? [];
    const paid = this.dashboard?.liquidaciones?.pagadas ?? [];
    return [...pending, ...paid].sort((a, b) => b.tsCorte - a.tsCorte);
  }

  get sales(): ReferralSale[] {
    return [...(this.dashboard?.ventas ?? [])].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );
  }

  get hasCodes(): boolean {
    return this.codes.length > 0;
  }

  reload(): void {
    this.loadDashboard();
  }

  trackByCode(_index: number, code: ReferralCode): string {
    return code.codigo;
  }

  trackByLiquidation(_index: number, liquidation: ReferralLiquidation): string {
    return `${liquidation.codigo}-${liquidation.tsCorte}`;
  }

  trackBySale(_index: number, sale: ReferralSale): string {
    return `${sale.promoCode}-${sale.fecha}-${sale.gateway}`;
  }

  getStatusClass(liquidation: ReferralLiquidation): string {
    return liquidation.estado === 'PAGADO' ? 'status-paid' : 'status-pending';
  }

  getGatewayClass(gateway: string): string {
    switch (gateway) {
      case 'MercadoPago':
        return 'bg-mp';
      case 'PayPal':
        return 'bg-paypal';
      default:
        return 'bg-wompi';
    }
  }

  formatDateTime(value: string): string {
    return this.datePipe.transform(value, 'dd/MM/yyyy hh:mm a') || '--';
  }

  formatCop(value: number, digits = '1.0-0'): string {
    const normalized = this.decimalPipe.transform(value ?? 0, digits) ?? '0';
    return `$ ${normalized}`;
  }

  formatUsd(value: number): string {
    const normalized = this.decimalPipe.transform(value ?? 0, '1.2-2') ?? '0.00';
    return `USD ${normalized}`;
  }

  getUnifiedNetEstimate(liquidation: ReferralLiquidation): number {
    const usdRate = this.dashboard?.summary?.tasaUsdCop ?? 3500;
    return liquidation.netoCop + liquidation.netoUsd * usdRate;
  }

  getCommissionEstimate(liquidation: ReferralLiquidation): number {
    return this.getUnifiedNetEstimate(liquidation) * (liquidation.porcentaje / 100);
  }

  private redirectIfUnauthorized(user: User | null): void {
    if (!this.hasReferralAccess(user)) {
      void this.router.navigate(['/shop']);
    }
  }

  private hasReferralAccess(user: User | null): boolean {
    return Number(user?.module ?? 0) === 1;
  }

  private loadDashboard(): void {
    if (this.isLoadingDashboard) {
      return;
    }

    this.isLoadingDashboard = true;
    this.loading = true;
    this.errorMessage = '';
    this.refreshView();

    this.referidosService
      .getDashboard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: dashboard => {
          this.dashboard = dashboard;
          this.isLoadingDashboard = false;
          this.loading = false;
          this.refreshView();
        },
        error: error => {
          this.dashboard = null;
          this.isLoadingDashboard = false;
          this.loading = false;
          this.errorMessage =
            error?.error?.message || error?.message || 'No pudimos cargar el panel de referidos.';
          this.refreshView();
        },
      });
  }

  private refreshView(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }
}
