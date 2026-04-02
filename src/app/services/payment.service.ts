import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, firstValueFrom, map, throwError } from 'rxjs';

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
  method: 'mercado_pago' | 'paypal' | 'wompi' | string;
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
    if (normalized === 'mercado_pago' || normalized === 'mercadopago') return 'mercado_pago';
    if (normalized === 'paypal' || normalized === 'pay_pal') return 'paypal';
    if (normalized === 'wompi') return 'wompi';
    return normalized || 'desconocido';
  }

  private getMethodLabel(method: string, fallback: string): string {
    switch (method) {
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
