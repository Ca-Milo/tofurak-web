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

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'string') {
      return ['1', 'true', 'yes', 'si'].includes(value.toLowerCase());
    }

    return Boolean(value);
  }
}
