import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, finalize, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { HeaderShop } from '../header-shop/header-shop';
import { CartService, CartItem } from '../services/cart.service';
import { Hart, User } from '../services/hart';
import { PaymentPayload, PaymentService, WompiAvailabilityResponse } from '../services/payment.service';

declare global {
  interface Window {
    paypal?: any;
    WidgetCheckout?: any;
  }
}

@Component({
  selector: 'app-shop-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderShop],
  templateUrl: './shop-cart.html',
  styleUrl: './shop-cart.scss',
})
export class ShopCart implements OnInit, OnDestroy {
  private readonly paypalClientId =
    'AfzCjGoelcfp4GoKxGCUmORkOIK3hvfoARxUJSeMoNfBfAbAv93NrzHZLckXFtomgybWVua35j-ehS78';
  private readonly paypalCurrency = 'USD';
  readonly showBoldButton = true;
  readonly showMercadoPagoButton = false;
  readonly showWompiButton = true;

  cartItems: CartItem[] = [];
  user: User | null = null;
  totals = { cop: 0, usd: 0 };
  promoCode = '';
  validatedPromoCode = '';
  couponMessage = '';
  couponMessageColor: 'green' | 'red' | 'gray' = 'gray';
  loadingCoupon = false;
  payingBold = false;
  payingMercadoPago = false;
  payingWompi = false;
  paypalRendered = false;
  wompiAvailabilityLoading = false;
  wompiAvailabilityResolved = false;
  wompiAvailability: WompiAvailabilityResponse = {
    disponible: false,
  };

  private destroy$ = new Subject<void>();

  constructor(
    private cartService: CartService,
    private hart: Hart,
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cartService.cart$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cartItems = this.cartService.items;
      this.totals = this.cartService.totals;
      this.refreshWompiAvailability();
      void this.tryRenderPayPalButtons();
      this.refreshView();
    });

    this.hart.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.user = user;
      this.refreshView();
    });

    this.refreshWompiAvailability();
    void this.tryRenderPayPalButtons();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  increase(id: number): void {
    this.cartService.increase(id);
  }

  decrease(id: number): void {
    this.cartService.decrease(id);
  }

  remove(id: number): void {
    this.cartService.remove(id);
  }

  getImgUrl(imagen: string): string {
    if (!imagen) return '';
    return imagen.startsWith('http') ? imagen : `assets/shop/items/${imagen}`;
  }

  hasDiscount(item: CartItem): boolean {
    return !!item.descuento && item.descuento > 0;
  }

  get canPayWithWompi(): boolean {
    return (
      this.showWompiButton &&
      this.totals.cop > 0 &&
      (!this.wompiAvailabilityResolved || this.wompiAvailability.disponible)
    );
  }

  get canPayWithBold(): boolean {
    return (
      this.showBoldButton &&
      this.totals.cop > 0 &&
      this.wompiAvailabilityResolved &&
      !this.wompiAvailability.disponible
    );
  }

  get canPayWithMercadoPago(): boolean {
    return (
      this.showMercadoPagoButton &&
      this.totals.cop > 0 &&
      this.wompiAvailabilityResolved &&
      !this.wompiAvailability.disponible
    );
  }

  get canPayWithPaypal(): boolean {
    return this.cartItems.length > 0;
  }

  get showWompiUnavailableMessage(): boolean {
    return (
      (this.showWompiButton || this.showBoldButton || this.showMercadoPagoButton) &&
      this.totals.cop > 0 &&
      this.wompiAvailabilityResolved &&
      !this.wompiAvailability.disponible
    );
  }

  validarCupon(): void {
    const code = this.promoCode.trim();
    if (!code || this.loadingCoupon) {
      return;
    }

    this.loadingCoupon = true;
    this.couponMessage = 'Verificando...';
    this.couponMessageColor = 'gray';
    this.refreshView();

    this.paymentService
      .validateCoupon(code)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingCoupon = false;
          this.refreshView();
        }),
      )
      .subscribe({
        next: response => {
          if (response?.valido) {
            this.validatedPromoCode = code;
            this.couponMessage = response.message || 'Codigo aplicado correctamente.';
            this.couponMessageColor = 'green';
            this.refreshView();
            return;
          }

          this.validatedPromoCode = '';
          this.couponMessage = response?.message || 'Codigo invalido o expirado.';
          this.couponMessageColor = 'red';
          this.refreshView();
        },
        error: (error: any) => {
          this.validatedPromoCode = '';
          this.couponMessage = error?.message || 'Error de conexion al validar el codigo.';
          this.couponMessageColor = 'red';
          this.refreshView();
        },
      });
  }

  pagarBold(): void {
    if (!this.ensureUserCanPay() || this.hasPendingCoupon() || this.payingBold) {
      return;
    }

    this.payingBold = true;

    this.paymentService
      .createBoldOrder(this.buildPaymentPayload())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          const paymentUrl = response?.paymentUrl;
          if (!paymentUrl) {
            this.payingBold = false;
            void Swal.fire('Error', 'No se recibio la URL de pago de Bold.', 'error');
            return;
          }

          window.location.href = paymentUrl;
        },
        error: error => {
          this.payingBold = false;
          void Swal.fire(
            'Error',
            error?.error?.message || 'No pudimos iniciar el pago con Bold.',
            'error',
          );
        },
      });
  }

  pagarMercadoPago(): void {
    if (!this.ensureUserCanPay() || this.hasPendingCoupon() || this.payingMercadoPago) {
      return;
    }

    this.payingMercadoPago = true;

    this.paymentService
      .createMercadoPagoPreference(this.buildPaymentPayload())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          const initPoint = response?.initPoint;
          if (!initPoint) {
            this.payingMercadoPago = false;
            void Swal.fire('Error', 'No se recibio la URL de pago de Mercado Pago.', 'error');
            return;
          }

          window.location.href = initPoint;
        },
        error: error => {
          this.payingMercadoPago = false;
          void Swal.fire(
            'Error',
            error?.error?.message || 'No pudimos conectar con Mercado Pago.',
            'error',
          );
        },
      });
  }

  async pagarWompi(): Promise<void> {
    if (!this.ensureUserCanPay() || this.hasPendingCoupon() || this.payingWompi) {
      return;
    }

    const wompiAvailable = await this.validateWompiAvailabilityBeforePay();
    if (!wompiAvailable) {
      return;
    }

    this.payingWompi = true;

    try {
      await this.loadScript('https://checkout.wompi.co/widget.js', 'wompi-checkout-sdk');
    } catch {
      this.payingWompi = false;
      await Swal.fire('Error', 'No se pudo cargar Wompi.', 'error');
      return;
    }

    this.paymentService
      .generateWompiSignature(this.buildPaymentPayload())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async response => {
          const widgetPublicKey = response?.publicKey || '';

          if (!window.WidgetCheckout || !response?.reference || !response?.signature) {
            this.payingWompi = false;
            await Swal.fire('Error', 'La respuesta de Wompi esta incompleta.', 'error');
            return;
          }

          const checkout = new window.WidgetCheckout({
            currency: 'COP',
            amountInCents: response.amountInCents,
            reference: response.reference,
            publicKey: widgetPublicKey,
            signature: { integrity: response.signature },
            redirectUrl: response.redirectUrl,
          });

          checkout.open(async (result: any) => {
            const transactionStatus = result?.transaction?.status;
            this.payingWompi = false;

            if (transactionStatus === 'APPROVED') {
              this.cartService.clear();
              await Swal.fire('Pago exitoso', 'Tu compra fue aprobada correctamente.', 'success');
            }
          });
        },
        error: async error => {
          this.payingWompi = false;
          await Swal.fire('Error', error?.error?.message || 'Error al abrir Wompi.', 'error');
        },
      });
  }

  private refreshWompiAvailability(): void {
    if (this.totals.cop <= 0) {
      this.wompiAvailabilityLoading = false;
      this.wompiAvailabilityResolved = false;
      this.wompiAvailability = {
        disponible: false,
      };
      this.refreshView();
      return;
    }

    this.wompiAvailabilityLoading = true;
    this.wompiAvailabilityResolved = false;
    this.refreshView();

    this.paymentService
      .getWompiAvailability(this.totals.cop)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.wompiAvailabilityLoading = false;
          this.wompiAvailabilityResolved = true;
          this.wompiAvailability = response;
          this.refreshView();
        },
        error: () => {
          this.wompiAvailabilityLoading = false;
          this.wompiAvailabilityResolved = true;
          this.wompiAvailability = {
            disponible: false,
          };
          this.refreshView();
        },
      });
  }

  private refreshView(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }

  private async validateWompiAvailabilityBeforePay(): Promise<boolean> {
    this.wompiAvailabilityLoading = true;
    this.wompiAvailabilityResolved = false;
    this.refreshView();

    try {
      const response = await firstValueFrom(this.paymentService.getWompiAvailability(this.totals.cop));
      this.wompiAvailability = response;
      this.wompiAvailabilityResolved = true;

      if (response.disponible) {
        return true;
      }

      await Swal.fire(
        'Wompi no disponible',
        'Este pedido no esta disponible para pago con Wompi en este momento. Puedes continuar con Mercado Pago o PayPal.',
        'warning',
      );
      return false;
    } catch {
      this.wompiAvailability = { disponible: false };
      this.wompiAvailabilityResolved = true;
      await Swal.fire(
        'Error',
        'No se pudo validar la disponibilidad de Wompi antes de iniciar el pago.',
        'error',
      );
      return false;
    } finally {
      this.wompiAvailabilityLoading = false;
      this.refreshView();
    }
  }

  private ensureUserCanPay(): boolean {
    if (this.cartItems.length === 0) {
      void Swal.fire('Carrito vacio', 'Agrega productos antes de pagar.', 'warning');
      return false;
    }

    if (!this.user?.id) {
      void Swal.fire('Sesion requerida', 'Inicia sesion para continuar con el pago.', 'warning');
      return false;
    }

    return true;
  }

  private hasPendingCoupon(): boolean {
    const currentCode = this.promoCode.trim();
    if (!currentCode || currentCode === this.validatedPromoCode) {
      return false;
    }

    void Swal.fire(
      'Codigo sin validar',
      'Aplica el codigo de regalo o borralo antes de continuar con el pago.',
      'warning',
    );
    return true;
  }

  private buildPaymentPayload(): PaymentPayload {
    return {
      cart: this.cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
      })),
      userId: this.user?.id || '',
      promoCode: this.validatedPromoCode || undefined,
    };
  }

  private async tryRenderPayPalButtons(): Promise<void> {
    if (!this.canPayWithPaypal || this.paypalRendered) {
      return;
    }

    try {
      await this.loadScript(
        `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(this.paypalClientId)}&currency=${encodeURIComponent(
          this.paypalCurrency,
        )}&disable-funding=card`,
        'paypal-sdk',
      );
    } catch {
      return;
    }

    setTimeout(() => {
      const container = document.getElementById('paypal-button-container');
      if (!container || !window.paypal || this.paypalRendered) {
        return;
      }

      container.innerHTML = '';
      this.paypalRendered = true;

      window.paypal
        .Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay',
          },
          onClick: (_data: any, actions: any) => {
            if (!this.ensureUserCanPay() || this.hasPendingCoupon()) {
              return actions.reject();
            }

            return actions.resolve();
          },
          createOrder: async () => {
            try {
              const response = await firstValueFrom(
                this.paymentService.createPayPalOrder(this.buildPaymentPayload()),
              );

              if (!response?.orderID) {
                throw new Error('No se recibio orderID');
              }

              return response.orderID;
            } catch {
              await Swal.fire('Error', 'No se pudo iniciar el pago con PayPal.', 'error');
              return undefined;
            }
          },
          onApprove: async (data: any) => {
            Swal.fire({
              title: 'Procesando pago...',
              text: 'Por favor no cierres esta ventana',
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              },
            });

            this.paymentService
              .capturePayPalOrder(data.orderID)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: async () => {
                  this.cartService.clear();
                  await Swal.fire(
                    'Pago exitoso',
                    'Tus articulos fueron acreditados correctamente.',
                    'success',
                  );
                },
                error: async error => {
                  await Swal.fire(
                    'Error',
                    error?.error?.message ||
                      'Hubo un problema confirmando el pago con PayPal.',
                    'error',
                  );
                },
              });
          },
          onError: async () => {
            await Swal.fire('Error PayPal', 'Ocurrio un error en la pasarela.', 'error');
          },
        })
        .render('#paypal-button-container');
    });
  }

  private loadScript(src: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.getElementById(id) as HTMLScriptElement | null;
      if (existing) {
        if (existing.getAttribute('data-loaded') === 'true') {
          resolve();
          return;
        }

        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)), {
          once: true,
        });
        return;
      }

      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = true;
      script.onload = () => {
        script.setAttribute('data-loaded', 'true');
        resolve();
      };
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.body.appendChild(script);
    });
  }
}
