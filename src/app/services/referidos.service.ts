import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE } from './api.constants';

export interface ReferralCode {
  codigo: string;
  porcentaje: number;
  activo: boolean;
}

export interface ReferralSaleProduct {
  productId: number;
  quantity: number;
  title: string;
}

export interface ReferralSale {
  gateway: 'Wompi' | 'MercadoPago' | 'PayPal' | string;
  fecha: string;
  promoCode: string;
  brutoCop: number;
  brutoUsd: number;
  netoCop: number;
  netoUsd: number;
  tsCorte: number;
  diaPagoTexto: string;
  rangoTexto: string;
  products: ReferralSaleProduct[];
}

export interface ReferralLiquidation {
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

export interface ReferralDashboard {
  account: {
    cuenta: string;
    apodo: string;
    module: number;
  };
  codes: ReferralCode[];
  summary: {
    ventasTotal: number;
    netoCop: number;
    netoUsd: number;
    comisionesPendientesCop: number;
    comisionesPagadasCop: number;
    tasaUsdCop: number;
  };
  liquidaciones: {
    pendientes: ReferralLiquidation[];
    pagadas: ReferralLiquidation[];
  };
  ventas: ReferralSale[];
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ReferidosService {
  private readonly endpoint = `${API_BASE}/account/referidos`;

  constructor(private readonly http: HttpClient) {}

  getDashboard(): Observable<ReferralDashboard> {
    return this.http
      .get<ApiEnvelope<ReferralDashboard> | ReferralDashboard>(this.endpoint, {
        withCredentials: true,
      })
      .pipe(map(response => (response as ApiEnvelope<ReferralDashboard>)?.data ?? (response as ReferralDashboard)));
  }
}
