import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { API_BASE } from './api.constants';

export interface ShopCategory {
  id: number;
  nombre: string;
}

export interface ShopProduct {
  id: number;
  nombre: string;
  imagen: string;
  cop: number;
  usd: number;
  descuento: number;
  ogrinas: number;
  nuevo: boolean;
  descripcion?: string;
  categoria?: number | string | null;
  categoriaId?: number | null;
}

export interface CompositionItem {
  id: number;
  nombre: string;
  descripcion?: string;
  url_imagen: string;
}

export interface ShopBanner {
  title?: string;
  text?: string;
  thumb: string;
  bg: string;
  producto: number;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ShopService {
  private apiUrl = API_BASE;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<ShopCategory[]> {
    return this.http
      .get<ApiResponse<unknown> | ShopCategory[]>(`${this.apiUrl}/shop/categories`)
      .pipe(map(response => this.normalizeCategories(response)))
      .pipe(catchError(this.handleError));
  }

  getProducts(categoryId?: number | null, sort?: string): Observable<ShopProduct[]> {
    let params = new HttpParams();
    if (categoryId != null) params = params.set('categoria', categoryId);
    if (sort) params = params.set('sort', sort);
    return this.http
      .get<ApiResponse<unknown> | ShopProduct[]>(`${this.apiUrl}/shop/products`, { params })
      .pipe(map(response => this.normalizeProducts(response)))
      .pipe(catchError(this.handleError));
  }

  getProductById(id: number): Observable<ShopProduct> {
    return this.http
      .get<ApiResponse<unknown> | ShopProduct>(`${this.apiUrl}/shop/products/${id}`)
      .pipe(map(response => this.normalizeProduct(this.unwrapResponse(response))))
      .pipe(catchError(this.handleError));
  }

  getProductComposition(id: number): Observable<CompositionItem[]> {
    return this.http
      .get<ApiResponse<unknown> | CompositionItem[]>(`${this.apiUrl}/shop/products/${id}/composition`)
      .pipe(map(response => this.normalizeComposition(response)))
      .pipe(catchError(this.handleError));
  }

  getBanners(): Observable<ShopBanner[]> {
    return this.http
      .get<ApiResponse<unknown> | ShopBanner[]>(`${this.apiUrl}/shop/banners`)
      .pipe(map(response => this.normalizeBanners(response)))
      .pipe(catchError(this.handleError));
  }

  private unwrapResponse<T>(response: ApiResponse<T> | T): T {
    if (response && typeof response === 'object' && 'data' in (response as ApiResponse<T>)) {
      return ((response as ApiResponse<T>).data ?? []) as T;
    }
    return response as T;
  }

  private normalizeCategories(response: ApiResponse<unknown> | ShopCategory[]): ShopCategory[] {
    const categories = this.unwrapResponse(response);
    if (!Array.isArray(categories)) return [];

    return categories.map((item: any) => ({
      id: Number(item?.id ?? item?.categoria_id ?? item?.category_id ?? 0),
      nombre: String(item?.nombre ?? item?.name ?? item?.categoria ?? ''),
    }));
  }

  private normalizeProducts(response: ApiResponse<unknown> | ShopProduct[]): ShopProduct[] {
    const products = this.unwrapResponse(response);
    if (!Array.isArray(products)) return [];

    return products.map(item => this.normalizeProduct(item));
  }

  private normalizeProduct(item: any): ShopProduct {
    return {
      id: Number(item?.id ?? 0),
      nombre: String(item?.nombre ?? item?.name ?? ''),
      imagen: String(item?.imagen ?? item?.imagen_url ?? item?.url_imagen ?? ''),
      cop: Number(item?.cop ?? item?.precio_cop ?? item?.price_cop ?? 0),
      usd: Number(item?.usd ?? item?.precio_usd ?? item?.price_usd ?? 0),
      descuento: Number(item?.descuento ?? item?.discount ?? 0),
      ogrinas: Number(item?.ogrinas ?? item?.ogrines ?? item?.extra_ogrinas ?? 0),
      nuevo: Boolean(item?.nuevo ?? item?.is_new ?? item?.nuevo_producto ?? false),
      descripcion: item?.descripcion ?? item?.description ?? '',
      categoria: item?.categoria ?? item?.category ?? item?.nombre_categoria ?? null,
      categoriaId: item?.categoriaId ?? item?.categoria_id ?? item?.categoryId ?? item?.category_id ?? null,
    };
  }

  private normalizeComposition(
    response: ApiResponse<unknown> | CompositionItem[],
  ): CompositionItem[] {
    const items = this.unwrapResponse(response);
    if (!Array.isArray(items)) return [];

    return items.map((item: any) => ({
      id: Number(item?.id ?? 0),
      nombre: String(item?.nombre ?? item?.name ?? ''),
      descripcion: item?.descripcion ?? item?.description ?? '',
      url_imagen: String(item?.url_imagen ?? item?.imagen ?? item?.imagen_url ?? ''),
    }));
  }

  private normalizeBanners(response: ApiResponse<unknown> | ShopBanner[]): ShopBanner[] {
    const banners = this.unwrapResponse(response);
    if (!Array.isArray(banners)) return [];

    return banners
      .map((item: any) => ({
        title: item?.title ?? item?.titulo ?? '',
        text: item?.text ?? item?.texto ?? '',
        thumb: String(item?.thumb ?? item?.thumbnail ?? ''),
        bg: String(item?.bg ?? item?.background ?? item?.imagen ?? ''),
        producto: Number(item?.producto ?? item?.product ?? item?.product_id ?? 0),
      }))
      .filter((item: ShopBanner) => !!item.thumb && !!item.bg);
  }

  private handleError(error: any): Observable<never> {
    const msg =
      error?.error?.message || error?.message || 'Error al conectar con la tienda';
    return throwError(() => new Error(msg));
  }
}
