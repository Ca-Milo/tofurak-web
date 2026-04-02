import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

export interface AdminPurchaseStat {
  key: 'total' | 'mercado_pago' | 'wompi' | 'paypal' | string;
  label: string;
  value: number;
}

export interface AdminPurchaseItemProduct {
  productId: number;
  name: string;
  quantity: number;
}

export interface AdminPurchaseItem {
  createdAt: string;
  userId: number;
  userAccount: string;
  method: string;
  reference: string;
  products: AdminPurchaseItemProduct[];
  promoCode: string | null;
  total: number;
  currency: 'COP' | 'USD' | string;
  status: string;
}

export interface AdminPurchasesResponse {
  wompiDisponible: number;
  stats: AdminPurchaseStat[];
  rows: AdminPurchaseItem[];
}

export interface AdminAffiliateLiquidationItem {
  codigo: string;
  cuentaId: number;
  porcentaje: number;
  tsCorte: number;
  diaPagoTexto: string;
  rangoTexto: string;
  ventasTotal: number;
  netoCop: number;
  netoUsd: number;
  comisionAPagar: number;
  estado: 'PENDIENTE' | 'PAGADO' | string;
}

export interface AdminAffiliateLiquidationsResponse {
  wompiDisponible: number;
  pendientes: AdminAffiliateLiquidationItem[];
  pagados: AdminAffiliateLiquidationItem[];
}

export interface AdminDailySalesDay {
  dia: string;
  totalWompi: number;
  totalMp: number;
  totalPaypal: number;
  totalEstimado: number;
  totalNeto: number;
  metaDiaria: number;
}

export interface AdminDailySalesTotals {
  granTotalEstimado: number;
  totalPeriodoCop: number;
  totalPeriodoUsd: number;
}

export interface AdminDailySalesResponse {
  wompiDisponible: number;
  tasaDolar: number;
  metaDiaria: number;
  totals: AdminDailySalesTotals;
  days: AdminDailySalesDay[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly wompiDisponibleSubject = new BehaviorSubject<number | null>(null);
  readonly wompiDisponible$ = this.wompiDisponibleSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  getPurchases(query = ''): Observable<AdminPurchasesResponse> {
    const normalizedQuery = query.trim();
    const params = normalizedQuery ? new HttpParams().set('q', normalizedQuery) : undefined;

    return this.http
      .get<ApiEnvelope<any> | any>('/api/admin/compras', {
        params,
        withCredentials: true,
      })
      .pipe(
        map(response => this.normalizePurchasesResponse(response?.data ?? response)),
        tap(response => this.wompiDisponibleSubject.next(response.wompiDisponible)),
      );
  }

  getAffiliateLiquidations(): Observable<AdminAffiliateLiquidationsResponse> {
    return this.http
      .get<ApiEnvelope<any> | any>('/api/admin/liquidaciones', {
        withCredentials: true,
      })
      .pipe(
        map(response => this.normalizeAffiliateLiquidationsResponse(response?.data ?? response)),
        tap(response => this.wompiDisponibleSubject.next(response.wompiDisponible)),
      );
  }

  markAffiliateLiquidationPaid(payload: {
    codigo: string;
    cuentaId: number;
    tsCorte: number;
    monto: number;
  }): Observable<{ message?: string }> {
    return this.http.post<ApiEnvelope<any> | any>(
      '/api/admin/liquidaciones/pagar',
      payload,
      { withCredentials: true },
    ).pipe(
      map(response => ({
        message: response?.message ?? response?.data?.message,
      })),
    );
  }

  getDailySales(): Observable<AdminDailySalesResponse> {
    return this.http
      .get<ApiEnvelope<any> | any>('/api/admin/ventas/diarias', {
        withCredentials: true,
      })
      .pipe(
        map(response => this.normalizeDailySalesResponse(response?.data ?? response)),
        tap(response => this.wompiDisponibleSubject.next(response.wompiDisponible)),
      );
  }

  private normalizePurchasesResponse(raw: any): AdminPurchasesResponse {
    const statsSource = Array.isArray(raw?.stats)
      ? raw.stats
      : Array.isArray(raw?.cards)
        ? raw.cards
        : [];
    const rowsSource = Array.isArray(raw?.rows)
      ? raw.rows
      : Array.isArray(raw?.historial)
        ? raw.historial
        : [];

    const normalizedStats = statsSource.map((item: any) => ({
      key: String(item?.key ?? item?.id ?? item?.label ?? 'total')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_'),
      label: String(item?.label ?? item?.titulo ?? 'Estadistica'),
      value: Number(item?.value ?? item?.cantidad ?? item?.total ?? 0),
    }));

    const fallbackTotal = rowsSource.length;

    return {
      wompiDisponible: Number(raw?.wompiDisponible ?? raw?.disponible ?? 0),
      stats:
        normalizedStats.length > 0
          ? normalizedStats
          : [
              { key: 'total', label: 'Ventas Totales', value: fallbackTotal },
              { key: 'mercado_pago', label: 'Mercado Pago', value: 0 },
              { key: 'wompi', label: 'Wompi', value: 0 },
              { key: 'paypal', label: 'PayPal', value: 0 },
            ],
      rows: rowsSource.map((item: any) => this.normalizePurchaseRow(item)),
    };
  }

  private normalizeAffiliateLiquidationsResponse(raw: any): AdminAffiliateLiquidationsResponse {
    const pendientesSource = Array.isArray(raw?.pendientes) ? raw.pendientes : [];
    const pagadosSource = Array.isArray(raw?.pagados) ? raw.pagados : [];

    return {
      wompiDisponible: Number(raw?.wompiDisponible ?? raw?.disponible ?? 0),
      pendientes: pendientesSource.map((item: any) => this.normalizeAffiliateLiquidationItem(item)),
      pagados: pagadosSource.map((item: any) => this.normalizeAffiliateLiquidationItem(item)),
    };
  }

  private normalizeDailySalesResponse(raw: any): AdminDailySalesResponse {
    const totals = raw?.totals ?? raw?.resumen ?? {};
    const daysSource = Array.isArray(raw?.days)
      ? raw.days
      : Array.isArray(raw?.dias)
        ? raw.dias
        : [];

    return {
      wompiDisponible: Number(raw?.wompiDisponible ?? raw?.disponible ?? 0),
      tasaDolar: Number(raw?.tasaDolar ?? raw?.tasa_dolar ?? 3500),
      metaDiaria: Number(raw?.metaDiaria ?? raw?.meta_diaria ?? 100000),
      totals: {
        granTotalEstimado: Number(
          totals?.granTotalEstimado ?? totals?.gran_total_estimado ?? raw?.granTotalEstimado ?? 0,
        ),
        totalPeriodoCop: Number(
          totals?.totalPeriodoCop ?? totals?.total_periodo_cop ?? raw?.totalPeriodoCop ?? 0,
        ),
        totalPeriodoUsd: Number(
          totals?.totalPeriodoUsd ?? totals?.total_periodo_usd ?? raw?.totalPeriodoUsd ?? 0,
        ),
      },
      days: daysSource.map((item: any) => ({
        dia: String(item?.dia ?? ''),
        totalWompi: Number(item?.totalWompi ?? item?.total_wompi ?? 0),
        totalMp: Number(item?.totalMp ?? item?.total_mp ?? 0),
        totalPaypal: Number(item?.totalPaypal ?? item?.total_paypal ?? 0),
        totalEstimado: Number(item?.totalEstimado ?? item?.total_estimado ?? 0),
        totalNeto: Number(item?.totalNeto ?? item?.total_neto ?? 0),
        metaDiaria: Number(item?.metaDiaria ?? item?.meta_diaria ?? raw?.metaDiaria ?? raw?.meta_diaria ?? 100000),
      })),
    };
  }

  private normalizeAffiliateLiquidationItem(item: any): AdminAffiliateLiquidationItem {
    return {
      codigo: String(item?.codigo ?? ''),
      cuentaId: Number(item?.cuentaId ?? item?.cuenta_id ?? 0),
      porcentaje: Number(item?.porcentaje ?? 0),
      tsCorte: Number(item?.tsCorte ?? item?.ts_corte ?? 0),
      diaPagoTexto: String(item?.diaPagoTexto ?? item?.dia_pago_texto ?? ''),
      rangoTexto: String(item?.rangoTexto ?? item?.rango_texto ?? ''),
      ventasTotal: Number(item?.ventasTotal ?? item?.ventas_total ?? 0),
      netoCop: Number(item?.netoCop ?? item?.neto_cop ?? 0),
      netoUsd: Number(item?.netoUsd ?? item?.neto_usd ?? 0),
      comisionAPagar: Number(item?.comisionAPagar ?? item?.comision_a_pagar ?? 0),
      estado: String(item?.estado ?? '').toUpperCase(),
    };
  }

  private normalizePurchaseRow(item: any): AdminPurchaseItem {
    const productsSource = Array.isArray(item?.products)
      ? item.products
      : Array.isArray(item?.cart)
        ? item.cart
        : [];

    return {
      createdAt: String(item?.createdAt ?? item?.fecha ?? ''),
      userId: Number(item?.userId ?? item?.uid ?? 0),
      userAccount: String(item?.userAccount ?? item?.cuenta ?? item?.usuario ?? ''),
      method: String(item?.method ?? item?.metodo ?? ''),
      reference: String(item?.reference ?? item?.ref ?? ''),
      products: productsSource.map((product: any) => ({
        productId: Number(product?.productId ?? product?.id ?? 0),
        name: String(product?.name ?? product?.nombre ?? `Item ${product?.productId ?? product?.id ?? ''}`),
        quantity: Number(product?.quantity ?? product?.cantidad ?? 1),
      })),
      promoCode: item?.promoCode ? String(item.promoCode) : null,
      total: Number(item?.total ?? item?.monto ?? 0),
      currency: String(item?.currency ?? item?.moneda ?? 'COP').toUpperCase(),
      status: String(item?.status ?? '').toUpperCase(),
    };
  }
}
