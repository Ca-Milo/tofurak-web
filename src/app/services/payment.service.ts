import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';

export interface PaymentCartItemPayload {
  productId: number;
  quantity: number;
}

export interface PaymentPayload {
  cart: PaymentCartItemPayload[];
  userId: string;
  promoCode?: string;
}

export interface OrderHistoryItemProduct {
  productId: number;
  name: string;
  quantity: number;
}

export interface OrderHistoryItem {
  reference: string;
  method: 'bold' | 'mercado_pago' | 'paypal' | 'wompi' | string;
  methodLabel: string;
  status: string;
  statusLabel: string;
  statusTone: 'success' | 'pending' | 'error';
  createdAt: string;
  currency: 'COP' | 'USD' | string;
  total: number;
  products: OrderHistoryItemProduct[];
 }

export interface PaymentAvailability {
  wompiPublicKey?: string;
}

export interface WompiAvailabilityResponse {
  disponible: boolean;
}

export interface BoldVerificationResponse {
  lookupKey: string;
  lookupValue: string;
  reference: string;
  status: string;
  statusLabel: string;
  message: string;
  isApproved: boolean;
  isPending: boolean;
  paymentUrl?: string;
  transactionId?: string;
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly baseUrl = '/pagos';
 
  constructor(private http: HttpClient) {}

  getAvailability(): Observable<PaymentAvailability> {
    return this.http
      .get<ApiEnvelope<any> | any>(`${this.baseUrl}/disponibilidad`, { withCredentials: true })
      .pipe(map(response => this.normalizeAvailability(response)));
  }

  getWompiAvailability(amount: number): Observable<WompiAvailabilityResponse> {
    return this.http
      .get<ApiEnvelope<any> | any>( 
        `/api/shop/wompi/availability?amount=${encodeURIComponent(amount)}`,
        { withCredentials: true },
      )
      .pipe(map(response => this.normalizeWompiAvailability(response, amount)));
  }

  validateCoupon(promoCode: string): Observable<{ valido: boolean; message?: string }> {
    return this.http
      .post<ApiEnvelope<any> | any>(`${this.baseUrl}/validar-cupon`, { promoCode }, {
        withCredentials: true,
      })
      .pipe(
        map(response => this.normalizeCouponResponse(response?.data ?? response)),
        catchError((error: any) =>
          throwError(() => new Error(error?.error?.message || 'No se pudo validar el codigo.')),
        ),
      );
  }

  createMercadoPagoPreference(payload: PaymentPayload): Observable<{ initPoint?: string }> {
    return this.http.post<{ initPoint?: string }>(`${this.baseUrl}/crear-preferencia`, payload, {
      withCredentials: true,
    });
  }

  createBoldOrder(payload: PaymentPayload): Observable<{ paymentUrl?: string }> {
    return this.http.post<{ paymentUrl?: string }>(`${this.baseUrl}/crear-orden-bold`, payload, {
      withCredentials: true,
    });
  }

  verifyBoldPayment(
    identifier: string,
    lookupKey: 'reference' | 'bold-order-id' = 'reference',
  ): Observable<BoldVerificationResponse> {
    const requestUrl = `${this.baseUrl}/verificar-bold/${encodeURIComponent(identifier)}`;

    return this.http
      .get<ApiEnvelope<any> | any>(requestUrl, { withCredentials: true })
      .pipe(map(response => this.normalizeBoldVerification(response, identifier, lookupKey)));
  }

  generateWompiSignature(
    payload: PaymentPayload,
  ): Observable<{
    amountInCents: number;
    reference: string;
    publicKey?: string;
    signature: string;
    redirectUrl?: string;
  }> {
    return this.http.post<{
      amountInCents: number;
      reference: string;
      publicKey?: string;
      signature: string;
      redirectUrl?: string;
    }>(`${this.baseUrl}/wompi-generar-firma`, payload, {
      withCredentials: true,
    });
  }

  createPayPalOrder(payload: PaymentPayload): Observable<{ orderID?: string }> {
    return this.http.post<{ orderID?: string }>(`${this.baseUrl}/crear-orden-paypal`, payload, {
      withCredentials: true,
    });
  }

  getOrderHistory(): Observable<OrderHistoryItem[]> {
    return this.http
      .get<ApiEnvelope<any> | any>(`/api/pagos/historial`, { withCredentials: true })
      .pipe(map(response => this.normalizeOrderHistory(response?.data ?? response)));
  }

  capturePayPalOrder(orderID: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/capturar-orden-paypal`,
      { orderID },
      { withCredentials: true },
    );
  }

  private normalizeAvailability(response: ApiEnvelope<any> | any): PaymentAvailability {
    const raw = response?.data ?? response ?? {};

    return {
      wompiPublicKey: raw.wompiPublicKey ?? raw.wompi_public_key ?? raw.publicKey,
    };
  }

  private normalizeWompiAvailability(
    response: ApiEnvelope<any> | any,
    _requestedAmount: number,
  ): WompiAvailabilityResponse {
    const raw = response?.data ?? response ?? {};

    return {
      disponible: this.toBoolean(raw.disponible),
    };
  }

  private normalizeCouponResponse(response: unknown): { valido: boolean; message?: string } {
    if (typeof response === 'string') {
      try {
        const parsed = JSON.parse(response);
        return {
          valido: this.toBoolean(parsed?.valido),
          message: parsed?.message,
        };
      } catch {
        return {
          valido: false,
        };
      }
    }

    const raw = response as any;
    return {
      valido: this.toBoolean(raw?.valido),
      message: raw?.message,
    };
  }

  private normalizeBoldVerification(
    response: ApiEnvelope<any> | any,
    identifier: string,
    lookupKey: 'reference' | 'bold-order-id',
  ): BoldVerificationResponse {
    const raw = response?.data ?? response ?? {};
    const explicitStatus = String(
      raw?.status ??
        raw?.estado ??
        raw?.paymentStatus ??
        raw?.payment_status ??
        raw?.boldStatus ??
        '',
    )
      .trim()
      .toUpperCase();

    const approvedByFlag =
      this.toBoolean(raw?.validated) ||
      this.toBoolean(raw?.valido) ||
      this.toBoolean(raw?.approved) ||
      this.toBoolean(raw?.isApproved);

    const pendingByFlag =
      this.toBoolean(raw?.pending) ||
      this.toBoolean(raw?.isPending) ||
      this.toBoolean(raw?.processing);

    const normalizedStatus = this.normalizeBoldStatus(explicitStatus);

    const status = approvedByFlag
      ? 'APPROVED'
      : pendingByFlag && !normalizedStatus
        ? 'PENDING'
        : normalizedStatus || 'PENDING';

    const isApproved =
      status === 'APPROVED' || status === 'COMPLETED' || status === 'SUCCESS';
    const isPending =
      !isApproved &&
      [
        'PENDING',
        'PROCESSING',
        'IN_PROCESS',
        'CREATED',
        'WAITING',
        'AUTHORIZED',
        'ACTIVE',
      ].includes(status);

    const fallbackMessage = this.getBoldVerificationMessage(status);

    return {
      lookupKey,
      lookupValue: String(
        raw?.lookupValue ??
          raw?.lookup_value ??
          raw?.boldOrderId ??
          raw?.bold_order_id ??
          raw?.reference ??
          identifier ??
          '',
      ),
      reference: String(raw?.reference ?? raw?.ref ?? identifier ?? ''),
      status,
      statusLabel: this.getBoldStatusLabel(status),
      message: String(raw?.message ?? raw?.mensaje ?? response?.message ?? fallbackMessage),
      paymentUrl: raw?.paymentUrl ?? raw?.payment_url ?? raw?.checkoutUrl ?? raw?.checkout_url,
      transactionId: String(
        raw?.transactionId ?? raw?.transaction_id ?? raw?.paymentId ?? raw?.payment_id ?? '',
      ).trim(),
      isApproved,
      isPending,
    };
  }

  private normalizeBoldStatus(status: string): string {
    const normalized = String(status ?? '').trim().toUpperCase();

    if (normalized === 'PAID') return 'APPROVED';
    if (normalized === 'NOT_FOUND') return 'NOT_FOUND';
    if (normalized === 'ACTIVE') return 'ACTIVE';
    if (normalized === 'PROCESSING') return 'PROCESSING';
    if (normalized === 'REJECTED') return 'REJECTED';

    return normalized;
  }

  private getBoldStatusLabel(status: string): string {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
      case 'SUCCESS':
        return 'Pago aprobado';
      case 'ACTIVE':
      case 'PENDING':
      case 'PROCESSING':
      case 'IN_PROCESS':
      case 'CREATED':
      case 'WAITING':
      case 'AUTHORIZED':
        return 'Pago pendiente';
      case 'NOT_FOUND':
        return 'Pago no encontrado';
      case 'REJECTED':
      case 'DECLINED':
      case 'ERROR':
      case 'VOIDED':
      case 'CANCELLED':
      case 'CANCELED':
        return 'Pago rechazado';
      default:
        return this.getStatusLabel(status);
    }
  }

  private getBoldVerificationMessage(status: string): string {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
      case 'SUCCESS':
        return 'Tu pago fue validado correctamente.';
      case 'ACTIVE':
      case 'PENDING':
      case 'PROCESSING':
      case 'IN_PROCESS':
      case 'CREATED':
      case 'WAITING':
      case 'AUTHORIZED':
        return 'Tu pago sigue en proceso. Puedes consultar nuevamente en unos segundos.';
      case 'NOT_FOUND':
        return 'No encontramos un pago asociado a este identificador.';
      default:
        return 'El pago no pudo validarse. Puedes intentarlo de nuevo.';
    }
  }

  private normalizeOrderHistory(response: unknown): OrderHistoryItem[] {
    if (!Array.isArray(response)) {
      return [];
    }

    return response.map(item => this.normalizeOrderHistoryItem(item));
  }

  private normalizeOrderHistoryItem(item: any): OrderHistoryItem {
    const rawMethod = String(item?.method ?? item?.metodo ?? '').trim();
    const rawStatus = String(item?.status ?? '').trim();
    const normalizedMethod = this.normalizePaymentMethod(rawMethod);
    const normalizedStatus = rawStatus.toUpperCase();
    const productsSource = Array.isArray(item?.products)
      ? item.products
      : Array.isArray(item?.cart)
        ? item.cart
        : [];

    return {
      reference: String(item?.reference ?? item?.ref ?? ''),
      method: normalizedMethod,
      methodLabel: this.getMethodLabel(normalizedMethod, rawMethod),
      status: normalizedStatus,
      statusLabel: this.getStatusLabel(normalizedStatus),
      statusTone: this.getStatusTone(normalizedStatus),
      createdAt: String(item?.createdAt ?? item?.fecha ?? ''),
      currency: String(item?.currency ?? item?.moneda ?? this.getCurrencyByMethod(normalizedMethod)).toUpperCase(),
      total: Number(item?.total ?? item?.monto ?? 0),
      products: productsSource.map((product: any) => ({
        productId: Number(product?.productId ?? product?.id ?? 0),
        name: String(product?.name ?? product?.nombre ?? 'Producto'),
        quantity: Number(product?.quantity ?? product?.cantidad ?? 1),
      })),
    };
  }

  private normalizePaymentMethod(method: string): string {
    const normalized = method.toLowerCase().replace(/\s+/g, '_');
    if (normalized === 'bold') return 'bold';
    if (normalized === 'mercado_pago' || normalized === 'mercadopago') return 'mercado_pago';
    if (normalized === 'paypal' || normalized === 'pay_pal') return 'paypal';
    if (normalized === 'wompi') return 'wompi';
    return normalized || 'desconocido';
  }

  private getMethodLabel(method: string, fallback: string): string {
    switch (method) {
      case 'bold':
        return 'Bold';
      case 'mercado_pago':
        return 'Mercado Pago';
      case 'paypal':
        return 'PayPal';
      case 'wompi':
        return 'Wompi';
      default:
        return fallback || 'Metodo';
    }
  }

  private getCurrencyByMethod(method: string): string {
    return method === 'paypal' ? 'USD' : 'COP';
  }

  private getStatusLabel(status: string): string {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'Exitoso';
      case 'PENDING':
      case 'IN_PROCESS':
      case 'PROCESSING':
        return 'Pendiente';
      case 'REJECTED':
      case 'DECLINED':
      case 'ERROR':
      case 'VOIDED':
      case 'CANCELLED':
      case 'CANCELED':
        return 'Rechazado';
      default:
        return status || 'Pendiente';
    }
  }

  private getStatusTone(status: string): 'success' | 'pending' | 'error' {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'success';
      case 'REJECTED':
      case 'DECLINED':
      case 'ERROR':
      case 'VOIDED':
      case 'CANCELLED':
      case 'CANCELED':
        return 'error';
      default:
        return 'pending';
    }
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'string') {
      return ['1', 'true', 'yes', 'si'].includes(value.toLowerCase());
    }

    return Boolean(value);
  }
}
