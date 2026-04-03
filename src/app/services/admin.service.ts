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

export interface AdminExchangeLogParty {
  personajeId: number;
  personajeNombre: string;
  cuentaId: number;
  cuentaNombre: string;
  ip: string;
  tipo?: string;
}

export interface AdminExchangeLogObject {
  cantidad: number;
  nombre: string;
  objetoId: number;
  modeloId: number;
  stats: string;
}

export interface AdminExchangeLogItem {
  id: number;
  timestamp: number;
  fechaHora: string;
  tipoExchange: string;
  evento: string;
  exito: boolean;
  mapaId: number;
  accion: string;
  detalles: string;
  actor: AdminExchangeLogParty;
  contra: AdminExchangeLogParty;
  kamasActor: number;
  kamasContra: number;
  ogrinasActor: number;
  ogrinasContra: number;
  objetosActor: AdminExchangeLogObject[];
  objetosContra: AdminExchangeLogObject[];
}

export interface AdminExchangeLogFilters {
  tiposExchange: string[];
  eventos: string[];
  acciones: string[];
  ips: string[];
}

export interface AdminExchangeLogSearchState {
  searchTarget: string;
  searchValue: string;
  tipoExchange: string;
  evento: string;
  accion: string;
  ip: string;
  fechaInicio: string;
  fechaFin: string;
  hasKamas: boolean;
  hasOgrinas: boolean;
  sameIp: boolean;
  itemIds: string;
  freeText: string;
}

export interface AdminExchangeLogPagination {
  page: number;
  perPage: number;
  totalRows: number;
  totalPages: number;
  runSearch: boolean;
}

export interface AdminExchangeLogsResponse {
  wompiDisponible: number;
  filters: AdminExchangeLogFilters;
  search: AdminExchangeLogSearchState;
  pagination: AdminExchangeLogPagination;
  rows: AdminExchangeLogItem[];
}

export interface AdminServerLogItem {
  id: number;
  fechaHora: string;
  timestamp: number;
  tipo: string;
  accion: string;
  personajeId: number;
  personajeNombre: string;
  cuentaId: number;
  cuentaNombre: string;
  objetoId: number;
  objetoNombre: string;
  cantidad: number;
  kamas: number;
  ogrinas: number;
  ipAddress: string;
  detalles: string;
}

export interface AdminServerLogSearchState {
  tipo: string;
  accion: string;
  personaje: string;
  cuenta: string;
  objeto: string;
  ip: string;
  fechaInicio: string;
  fechaFin: string;
  sort: string;
  dir: 'ASC' | 'DESC' | string;
}

export interface AdminServerLogPagination {
  page: number;
  perPage: number;
  totalRows: number;
  totalPages: number;
}

export interface AdminServerLogsResponse {
  wompiDisponible: number;
  summary: {
    totalRows: number;
  };
  search: AdminServerLogSearchState;
  pagination: AdminServerLogPagination;
  rows: AdminServerLogItem[];
}

export interface AdminCodeItem {
  id: number;
  codigo: string;
  activo: boolean;
  modulo: number;
  porcentaje: number;
  wompiVentas: number;
  paypalVentas: number;
  mercadopagoVentas: number;
  totalVentas: number;
  dineroWompiCop: number;
  dineroMpCop: number;
  dineroPaypalUsd: number;
  totalGanadoCop: number;
  netoWompi: number;
  netoMp: number;
  netoPaypal: number;
  totalBrutoEstimado: number;
  totalNetoEstimado: number;
  pagoAfiliado: number;
}

export interface AdminCodesResponse {
  wompiDisponible: number;
  totals: {
    grandTotalVentas: number;
    grandTotalCop: number;
    grandTotalUsd: number;
    grandTotalPagarAfiliados: number;
    granTotalUnificado: number;
    tasaDolar: number;
  };
  chart: Array<{
    label: string;
    value: number;
  }>;
  rows: AdminCodeItem[];
}

export interface AdminTopClientItem {
  rank: number;
  userId: number;
  nombreCuenta: string;
  nombreApodo: string;
  email: string;
  totalGastado: number;
  ultimaCompra: string;
  totalTransacciones: number;
  estadoCliente: 'activo' | 'inactivo' | string;
}

export interface AdminTopClientsResponse {
  wompiDisponible: number;
  tasaDolar: number;
  rows: AdminTopClientItem[];
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

  getExchangeLogs(payload: Record<string, string | number | boolean | undefined> = {}): Observable<AdminExchangeLogsResponse> {
    return this.http
      .post<ApiEnvelope<any> | any>('/api/admin/logs/intercambios', payload, {
        withCredentials: true,
      })
      .pipe(
        map(response => this.normalizeExchangeLogsResponse(response?.data ?? response)),
        tap(response => this.wompiDisponibleSubject.next(response.wompiDisponible)),
      );
  }

  getServerLogs(payload: Record<string, string | number | boolean | undefined> = {}): Observable<AdminServerLogsResponse> {
    return this.http
      .post<ApiEnvelope<any> | any>('/api/admin/logs', payload, {
        withCredentials: true,
      })
      .pipe(
        map(response => this.normalizeServerLogsResponse(response?.data ?? response)),
        tap(response => this.wompiDisponibleSubject.next(response.wompiDisponible)),
      );
  }

  getCodes(): Observable<AdminCodesResponse> {
    return this.http
      .get<ApiEnvelope<any> | any>('/api/admin/codigos', {
        withCredentials: true,
      })
      .pipe(
        map(response => this.normalizeCodesResponse(response?.data ?? response)),
        tap(response => this.wompiDisponibleSubject.next(response.wompiDisponible)),
      );
  }

  getTopClients(): Observable<AdminTopClientsResponse> {
    return this.http
      .get<ApiEnvelope<any> | any>('/api/admin/clientes', {
        withCredentials: true,
      })
      .pipe(
        map(response => this.normalizeTopClientsResponse(response?.data ?? response)),
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

  private normalizeExchangeLogsResponse(raw: any): AdminExchangeLogsResponse {
    const rowsSource = Array.isArray(raw?.rows)
      ? raw.rows
      : Array.isArray(raw?.logs)
        ? raw.logs
        : [];

    return {
      wompiDisponible: Number(raw?.wompiDisponible ?? raw?.disponible ?? 0),
      filters: {
        tiposExchange: Array.isArray(raw?.filters?.tiposExchange)
          ? raw.filters.tiposExchange.map((item: any) => String(item))
          : [],
        eventos: Array.isArray(raw?.filters?.eventos)
          ? raw.filters.eventos.map((item: any) => String(item))
          : [],
        acciones: Array.isArray(raw?.filters?.acciones)
          ? raw.filters.acciones.map((item: any) => String(item))
          : [],
        ips: Array.isArray(raw?.filters?.ips)
          ? raw.filters.ips.map((item: any) => String(item))
          : [],
      },
      search: {
        searchTarget: String(raw?.search?.searchTarget ?? raw?.search_target ?? ''),
        searchValue: String(raw?.search?.searchValue ?? raw?.search_value ?? ''),
        tipoExchange: String(raw?.search?.tipoExchange ?? raw?.tipo_exchange ?? ''),
        evento: String(raw?.search?.evento ?? ''),
        accion: String(raw?.search?.accion ?? ''),
        ip: String(raw?.search?.ip ?? ''),
        fechaInicio: String(raw?.search?.fechaInicio ?? raw?.fecha_inicio ?? ''),
        fechaFin: String(raw?.search?.fechaFin ?? raw?.fecha_fin ?? ''),
        hasKamas: Boolean(raw?.search?.hasKamas ?? raw?.has_kamas ?? false),
        hasOgrinas: Boolean(raw?.search?.hasOgrinas ?? raw?.has_ogrinas ?? false),
        sameIp: Boolean(raw?.search?.sameIp ?? raw?.same_ip ?? false),
        itemIds: String(raw?.search?.itemIds ?? raw?.item_ids ?? ''),
        freeText: String(raw?.search?.freeText ?? raw?.free_text ?? ''),
      },
      pagination: {
        page: Number(raw?.pagination?.page ?? raw?.page ?? 1),
        perPage: Number(raw?.pagination?.perPage ?? raw?.per_page ?? 40),
        totalRows: Number(raw?.pagination?.totalRows ?? raw?.total_rows ?? 0),
        totalPages: Number(raw?.pagination?.totalPages ?? raw?.total_paginas ?? 0),
        runSearch: Boolean(raw?.pagination?.runSearch ?? raw?.run_search ?? false),
      },
      rows: rowsSource.map((item: any) => ({
        id: Number(item?.id ?? 0),
        timestamp: Number(item?.timestamp ?? item?.tiempo ?? 0),
        fechaHora: String(item?.fechaHora ?? item?.fecha_hora ?? ''),
        tipoExchange: String(item?.tipoExchange ?? item?.tipo_exchange ?? ''),
        evento: String(item?.evento ?? ''),
        exito: Boolean(item?.exito),
        mapaId: Number(item?.mapaId ?? item?.mapa_id ?? 0),
        accion: String(item?.accion ?? ''),
        detalles: String(item?.detalles ?? item?.detail ?? item?.detalle ?? ''),
        actor: {
          personajeId: Number(item?.actor?.personajeId ?? item?.actor_personaje_id ?? 0),
          personajeNombre: String(item?.actor?.personajeNombre ?? item?.actor_personaje_nombre ?? ''),
          cuentaId: Number(item?.actor?.cuentaId ?? item?.actor_cuenta_id ?? 0),
          cuentaNombre: String(item?.actor?.cuentaNombre ?? item?.actor_cuenta_nombre ?? ''),
          ip: String(item?.actor?.ip ?? item?.actor_ip ?? ''),
        },
        contra: {
          tipo: String(item?.contra?.tipo ?? item?.contra_tipo ?? ''),
          personajeId: Number(item?.contra?.personajeId ?? item?.contra_personaje_id ?? 0),
          personajeNombre: String(item?.contra?.personajeNombre ?? item?.contra_personaje_nombre ?? ''),
          cuentaId: Number(item?.contra?.cuentaId ?? item?.contra_cuenta_id ?? 0),
          cuentaNombre: String(item?.contra?.cuentaNombre ?? item?.contra_cuenta_nombre ?? ''),
          ip: String(item?.contra?.ip ?? item?.contra_ip ?? ''),
        },
        kamasActor: Number(item?.kamasActor ?? item?.kamas_actor ?? 0),
        kamasContra: Number(item?.kamasContra ?? item?.kamas_contra ?? 0),
        ogrinasActor: Number(item?.ogrinasActor ?? item?.ogrinas_actor ?? 0),
        ogrinasContra: Number(item?.ogrinasContra ?? item?.ogrinas_contra ?? 0),
        objetosActor: this.normalizeExchangeObjects(item?.objetosActor ?? item?.objetos_actor ?? item?.objetos_actor_json),
        objetosContra: this.normalizeExchangeObjects(item?.objetosContra ?? item?.objetos_contra ?? item?.objetos_contra_json),
      })),
    };
  }

  private normalizeServerLogsResponse(raw: any): AdminServerLogsResponse {
    const rowsSource = Array.isArray(raw?.rows) ? raw.rows : [];
    const summary = raw?.summary ?? {};
    const pagination = raw?.pagination ?? {};
    const search = raw?.search ?? {};

    return {
      wompiDisponible: Number(raw?.wompiDisponible ?? raw?.disponible ?? 0),
      summary: {
        totalRows: Number(summary?.totalRows ?? summary?.total_rows ?? pagination?.totalRows ?? 0),
      },
      search: {
        tipo: String(search?.tipo ?? ''),
        accion: String(search?.accion ?? ''),
        personaje: String(search?.personaje ?? ''),
        cuenta: String(search?.cuenta ?? ''),
        objeto: String(search?.objeto ?? ''),
        ip: String(search?.ip ?? ''),
        fechaInicio: String(search?.fechaInicio ?? search?.fecha_inicio ?? ''),
        fechaFin: String(search?.fechaFin ?? search?.fecha_fin ?? ''),
        sort: String(search?.sort ?? 'fecha_hora'),
        dir: String(search?.dir ?? 'DESC').toUpperCase(),
      },
      pagination: {
        page: Number(pagination?.page ?? 1),
        perPage: Number(pagination?.perPage ?? pagination?.per_page ?? 50),
        totalRows: Number(pagination?.totalRows ?? pagination?.total_rows ?? 0),
        totalPages: Number(pagination?.totalPages ?? pagination?.total_paginas ?? 0),
      },
      rows: rowsSource.map((item: any) => ({
        id: Number(item?.id ?? 0),
        fechaHora: String(item?.fechaHora ?? item?.fecha_hora ?? ''),
        timestamp: Number(item?.timestamp ?? 0),
        tipo: String(item?.tipo ?? ''),
        accion: String(item?.accion ?? ''),
        personajeId: Number(item?.personajeId ?? item?.personaje_id ?? 0),
        personajeNombre: String(item?.personajeNombre ?? item?.personaje_nombre ?? ''),
        cuentaId: Number(item?.cuentaId ?? item?.cuenta_id ?? 0),
        cuentaNombre: String(item?.cuentaNombre ?? item?.cuenta_nombre ?? ''),
        objetoId: Number(item?.objetoId ?? item?.objeto_id ?? 0),
        objetoNombre: String(item?.objetoNombre ?? item?.objeto_nombre ?? ''),
        cantidad: Number(item?.cantidad ?? 0),
        kamas: Number(item?.kamas ?? 0),
        ogrinas: Number(item?.ogrinas ?? 0),
        ipAddress: String(item?.ipAddress ?? item?.ip_address ?? ''),
        detalles: String(item?.detalles ?? ''),
      })),
    };
  }

  private normalizeCodesResponse(raw: any): AdminCodesResponse {
    const totals = raw?.totals ?? {};
    const chartSource = Array.isArray(raw?.chart) ? raw.chart : [];
    const rowsSource = Array.isArray(raw?.rows) ? raw.rows : [];

    return {
      wompiDisponible: Number(raw?.wompiDisponible ?? raw?.disponible ?? 0),
      totals: {
        grandTotalVentas: Number(totals?.grandTotalVentas ?? totals?.grand_total_ventas ?? 0),
        grandTotalCop: Number(totals?.grandTotalCop ?? totals?.grand_total_cop ?? 0),
        grandTotalUsd: Number(totals?.grandTotalUsd ?? totals?.grand_total_usd ?? 0),
        grandTotalPagarAfiliados: Number(totals?.grandTotalPagarAfiliados ?? totals?.grand_total_pagar_afiliados ?? 0),
        granTotalUnificado: Number(totals?.granTotalUnificado ?? totals?.gran_total_unificado ?? 0),
        tasaDolar: Number(totals?.tasaDolar ?? totals?.tasa_dolar ?? 3500),
      },
      chart: chartSource.map((item: any) => ({
        label: String(item?.label ?? item?.codigo ?? ''),
        value: Number(item?.value ?? item?.totalBrutoEstimado ?? 0),
      })),
      rows: rowsSource.map((item: any) => ({
        id: Number(item?.id ?? 0),
        codigo: String(item?.codigo ?? ''),
        activo: Boolean(item?.activo),
        modulo: Number(item?.modulo ?? 0),
        porcentaje: Number(item?.porcentaje ?? 0),
        wompiVentas: Number(item?.wompiVentas ?? item?.wompi_ventas ?? 0),
        paypalVentas: Number(item?.paypalVentas ?? item?.paypal_ventas ?? 0),
        mercadopagoVentas: Number(item?.mercadopagoVentas ?? item?.mercadopago_ventas ?? 0),
        totalVentas: Number(item?.totalVentas ?? item?.total_ventas ?? 0),
        dineroWompiCop: Number(item?.dineroWompiCop ?? item?.dinero_wompi_cop ?? 0),
        dineroMpCop: Number(item?.dineroMpCop ?? item?.dinero_mp_cop ?? 0),
        dineroPaypalUsd: Number(item?.dineroPaypalUsd ?? item?.dinero_paypal_usd ?? 0),
        totalGanadoCop: Number(item?.totalGanadoCop ?? item?.total_ganado_cop ?? 0),
        netoWompi: Number(item?.netoWompi ?? item?.neto_wompi ?? 0),
        netoMp: Number(item?.netoMp ?? item?.neto_mp ?? 0),
        netoPaypal: Number(item?.netoPaypal ?? item?.neto_paypal ?? 0),
        totalBrutoEstimado: Number(item?.totalBrutoEstimado ?? item?.total_bruto_estimado ?? 0),
        totalNetoEstimado: Number(item?.totalNetoEstimado ?? item?.total_neto_estimado ?? 0),
        pagoAfiliado: Number(item?.pagoAfiliado ?? item?.pago_afiliado ?? 0),
      })),
    };
  }

  private normalizeTopClientsResponse(raw: any): AdminTopClientsResponse {
    const rowsSource = Array.isArray(raw?.rows) ? raw.rows : [];

    return {
      wompiDisponible: Number(raw?.wompiDisponible ?? raw?.disponible ?? 0),
      tasaDolar: Number(raw?.tasaDolar ?? raw?.tasa_dolar ?? 3500),
      rows: rowsSource.map((item: any) => ({
        rank: Number(item?.rank ?? 0),
        userId: Number(item?.userId ?? item?.user_id ?? 0),
        nombreCuenta: String(item?.nombreCuenta ?? item?.nombre_cuenta ?? ''),
        nombreApodo: String(item?.nombreApodo ?? item?.nombre_apodo ?? ''),
        email: String(item?.email ?? ''),
        totalGastado: Number(item?.totalGastado ?? item?.total_gastado ?? 0),
        ultimaCompra: String(item?.ultimaCompra ?? item?.ultima_compra ?? ''),
        totalTransacciones: Number(item?.totalTransacciones ?? item?.total_transacciones ?? 0),
        estadoCliente: String(item?.estadoCliente ?? item?.estado_cliente ?? ''),
      })),
    };
  }

  private normalizeExchangeObjects(value: any): AdminExchangeLogObject[] {
    const source = Array.isArray(value) ? value : [];

    return source.map((item: any) => ({
      cantidad: Number(item?.cantidad ?? item?.quantity ?? 1),
      nombre: String(item?.nombre ?? item?.name ?? 'Objeto'),
      objetoId: Number(item?.objetoId ?? item?.objectId ?? 0),
      modeloId: Number(item?.modeloId ?? item?.modelId ?? 0),
      stats: String(item?.stats ?? ''),
    }));
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
