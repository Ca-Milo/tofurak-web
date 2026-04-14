import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BoldVerificationResponse, PaymentService } from '../services/payment.service';
import { HeaderShop } from '../header-shop/header-shop';

type VerificationViewState = 'loading' | 'approved' | 'pending' | 'rejected' | 'error';

@Component({
  selector: 'app-shop-bold-verification',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderShop],
  templateUrl: './shop-bold-verification.html',
  styleUrl: './shop-bold-verification.scss',
})
export class ShopBoldVerification implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private pollAttempts = 0;
  private readonly maxPollAttempts = 6;

  readonly reference = signal('');
  readonly lookupValue = signal('');
  readonly lookupLabel = signal('Referencia');
  readonly lookupKey = signal<'reference' | 'bold-order-id'>('reference');
  readonly state = signal<VerificationViewState>('loading');
  readonly message = signal('Consultando el estado de tu pago con Bold...');
  readonly statusLabel = signal('Verificando');
  readonly transactionId = signal('');
  readonly paymentUrl = signal('');
  readonly checking = signal(false);

  readonly title = computed(() => {
    switch (this.state()) {
      case 'approved':
        return 'Pago validado';
      case 'pending':
        return 'Pago en verificacion';
      case 'rejected':
        return 'Pago no validado';
      case 'error':
        return 'No pudimos verificar el pago';
      default:
        return 'Verificando tu pago';
    }
  });

  readonly icon = computed(() => {
    switch (this.state()) {
      case 'approved':
        return '✓';
      case 'pending':
        return '…';
      case 'rejected':
      case 'error':
        return '!';
      default:
        return '•';
    }
  });

  readonly canRetryPayment = computed(
    () => this.state() === 'pending' || this.state() === 'rejected' || this.state() === 'error',
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly paymentService: PaymentService,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(queryParams => {
      const boldOrderId =
        queryParams.get('bold-order-id')?.trim() ??
        queryParams.get('bold_order_id')?.trim() ??
        queryParams.get('boldOrderId')?.trim() ??
        '';
      const queryReference = queryParams.get('reference')?.trim() ?? '';
      const paramReference = this.route.snapshot.paramMap.get('reference')?.trim() ?? '';
      const identifier = boldOrderId || queryReference || paramReference;
      const lookupKey = boldOrderId ? 'bold-order-id' : 'reference';

      this.clearScheduledPoll();
      this.pollAttempts = 0;
      this.lookupKey.set(lookupKey);
      this.lookupLabel.set(lookupKey === 'bold-order-id' ? 'Bold Order ID' : 'Referencia');
      this.lookupValue.set(identifier);
      this.reference.set(queryReference || paramReference || '');

      if (!identifier) {
        this.state.set('error');
        this.statusLabel.set('Referencia invalida');
        this.message.set('No se encontro un identificador de pago para verificar.');
        return;
      }

      this.checkStatus(true);
    });
  }

  ngOnDestroy(): void {
    this.clearScheduledPoll();
    this.destroy$.next();
    this.destroy$.complete();
  }

  retryCheck(): void {
    this.clearScheduledPoll();
    this.pollAttempts = 0;
    this.checkStatus(true);
  }

  retryPayment(): void {
    const paymentUrl = this.paymentUrl();
    if (paymentUrl) {
      window.location.href = paymentUrl;
      return;
    }

    void this.router.navigate(['/shop-cart'], {
      queryParams: { retryBold: this.lookupValue() },
    });
  }

  private checkStatus(showLoader = false): void {
    const identifier = this.lookupValue();
    if (!identifier || this.checking()) {
      return;
    }

    if (showLoader) {
      this.state.set('loading');
      this.statusLabel.set('Verificando');
      this.message.set('Consultando el estado de tu pago con Bold...');
    }

    this.checking.set(true);

    this.paymentService
      .verifyBoldPayment(identifier, this.lookupKey())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.checking.set(false);
          this.applyVerificationResponse(response);
        },
        error: error => {
          this.checking.set(false);
          this.state.set('error');
          this.statusLabel.set('Error de consulta');
          this.message.set(
            error?.error?.message ||
              error?.message ||
              'No fue posible consultar el estado del pago en este momento.',
          );
        },
      });
  }

  private applyVerificationResponse(response: BoldVerificationResponse): void {
    this.lookupValue.set(response.lookupValue || this.lookupValue());
    this.lookupLabel.set(response.lookupKey === 'bold-order-id' ? 'Bold Order ID' : 'Referencia');
    this.reference.set(response.reference ?? '');
    this.transactionId.set(response.transactionId ?? '');
    this.paymentUrl.set(response.paymentUrl ?? '');
    this.statusLabel.set(response.statusLabel);
    this.message.set(response.message);

    if (response.isApproved) {
      this.clearScheduledPoll();
      this.state.set('approved');
      return;
    }

    if (response.isPending) {
      this.state.set('pending');
      this.schedulePoll();
      return;
    }

    this.clearScheduledPoll();
    this.state.set('rejected');
  }

  private schedulePoll(): void {
    this.clearScheduledPoll();

    if (this.pollAttempts >= this.maxPollAttempts) {
      return;
    }

    this.pollAttempts += 1;
    this.pollTimer = window.setTimeout(() => this.checkStatus(false), 5000);
  }

  private clearScheduledPoll(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
