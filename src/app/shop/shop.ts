import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HeaderShop } from '../header-shop/header-shop';
import { ShopFooter } from '../shop-footer/shop-footer';
import { ShopService, ShopProduct, ShopCategory, ShopBanner } from '../services/shop.service';
import { SortableSelect } from './sortable-select';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderShop, ShopFooter, SortableSelect],
  templateUrl: './shop.html',
  styleUrl: './shop.scss',
})
export class Shop implements OnInit, OnDestroy {
  slides: ShopBanner[] = [
  ];
 
  activeIndex = 0;
  private slideTimer: any;

  allProducts: ShopProduct[] = [];
  products: ShopProduct[] = [];
  categories: ShopCategory[] = [];
  selectedCategoryId: number | null = null;
  selectedSort = 'RELEVANCE';
  searchTerm = '';

  private destroy$ = new Subject<void>();

  constructor(
    private shopService: ShopService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadBanners();
    this.loadCategories();
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const rawCategoryId = params.get('categoria');
      const parsedCategoryId = rawCategoryId !== null ? Number(rawCategoryId) : NaN;
      this.selectedCategoryId = Number.isNaN(parsedCategoryId) ? null : parsedCategoryId;
      this.searchTerm = (params.get('buscar') ?? '').trim().toLowerCase();
      if (this.allProducts.length > 0) {
        this.applyProductFilters();
      }
    });
    this.loadProducts();
    this.startSlider();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearInterval(this.slideTimer);
  }

  getSlideBg(): string {
    return `url('${this.getBannerImgUrl(this.slides[this.activeIndex]?.bg ?? '')}')`;
  }

  setSlide(index: number): void {
    this.activeIndex = index;
    this.restartSlider();
  }

  goToSlideProduct(): void {
    const productId = this.slides[this.activeIndex]?.producto ?? 0;
    if (productId > 0) {
      this.goToProduct(productId);
    }
  }

  getBannerImgUrl(path: string): string {
    if (!path) return '';
    return path.startsWith('http') || path.startsWith('assets/') || path.startsWith('/')
      ? path
      : `assets/shop/${path}`;
  }

  loadProducts(categoryId?: number | null): void {
    if (categoryId !== undefined) {
      this.selectedCategoryId = categoryId;
    }

    if (this.allProducts.length > 0) {
      this.applyProductFilters();
      return;
    }

    this.shopService.getProducts().subscribe({
      next: data => {
        console.log('[Shop] products:', data);
        this.allProducts = data;
        this.applyProductFilters();
        this.refreshView();
      },
      error: err => {
        console.error('[Shop] products error:', err);
        this.allProducts = [];
        this.products = [];
        this.refreshView();
      },
    });
  }

  onSortChange(): void {
    this.applyProductFilters();
  }

  goToProduct(id: number): void {
    this.router.navigate(['/shop-product', id]);
  }

  getImgUrl(imagen: string): string {
    if (!imagen) return '';
    return imagen.startsWith('http') ? imagen : `assets/shop/items/${imagen}`;
  }

  getDiscountedCopPrice(price: number, discount: number): number {
    if (!discount || discount <= 0) return price;
    return Math.round(price * (1 - discount / 100));
  }

  getDiscountedUsdPrice(price: number, discount: number): number {
    if (!discount || discount <= 0) return price;
    return Number((price * (1 - discount / 100)).toFixed(2));
  }

  getOgrinasBadgeText(ogrinas: number): string {
    return `+${ogrinas} ogrinas`;
  }

  private loadCategories(): void {
    this.shopService.getCategories().subscribe({
      next: data => {
        console.log('[Shop] categories:', data);
        this.categories = data;
        this.refreshView();
      },
      error: err => {
        console.error('[Shop] categories error:', err);
        this.categories = [];
        this.refreshView();
      },
    });
  }

  private loadBanners(): void {
    this.shopService.getBanners().subscribe({
      next: data => {
        if (data.length > 0) {
          this.slides = data;
          this.activeIndex = 0;
          this.restartSlider();
        }
        this.refreshView();
      },
      error: err => {
        console.error('[Shop] banners error:', err);
        this.refreshView();
      },
    });
  }

  private refreshView(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }

  private applyProductFilters(): void {
    const filteredProducts = this.allProducts.filter(product =>
      this.matchesSelectedCategory(product) && this.matchesSearchTerm(product),
    );

    this.products = this.sortProducts(filteredProducts, this.selectedSort);
    this.refreshView();
  }

  private matchesSelectedCategory(product: ShopProduct): boolean {
    if (this.selectedCategoryId === null) {
      return true;
    }

    const selectedCategory = this.categories.find(category => category.id === this.selectedCategoryId);
    const normalizedProductCategory = String(product.categoria ?? '').trim().toLowerCase();
    const normalizedSelectedCategoryName = String(selectedCategory?.nombre ?? '').trim().toLowerCase();

    return (
      product.categoriaId === this.selectedCategoryId ||
      product.categoria === this.selectedCategoryId ||
      normalizedProductCategory === String(this.selectedCategoryId) ||
      (!!normalizedSelectedCategoryName && normalizedProductCategory === normalizedSelectedCategoryName)
    );
  }

  private matchesSearchTerm(product: ShopProduct): boolean {
    if (!this.searchTerm) {
      return true;
    }

    const normalizedName = String(product.nombre ?? '').trim().toLowerCase();
    return normalizedName.includes(this.searchTerm);
  }

  private sortProducts(products: ShopProduct[], sort: string): ShopProduct[] {
    const sortedProducts = [...products];

    switch (sort) {
      case 'COP_PRICE_ASC':
        return sortedProducts.sort(
          (a, b) =>
            this.getDiscountedCopPrice(a.cop, a.descuento) -
            this.getDiscountedCopPrice(b.cop, b.descuento),
        );
      case 'COP_PRICE_DESC':
        return sortedProducts.sort(
          (a, b) =>
            this.getDiscountedCopPrice(b.cop, b.descuento) -
            this.getDiscountedCopPrice(a.cop, a.descuento),
        );
      case 'USD_PRICE_ASC':
        return sortedProducts.sort(
          (a, b) =>
            this.getDiscountedUsdPrice(a.usd, a.descuento) -
            this.getDiscountedUsdPrice(b.usd, b.descuento),
        );
      case 'USD_PRICE_DESC':
        return sortedProducts.sort(
          (a, b) =>
            this.getDiscountedUsdPrice(b.usd, b.descuento) -
            this.getDiscountedUsdPrice(a.usd, a.descuento),
        );
      default:
        return sortedProducts;
    }
  }

  private startSlider(): void {
    if (this.slides.length <= 1) return;
    this.slideTimer = setInterval(() => {
      this.activeIndex = (this.activeIndex + 1) % this.slides.length;
      this.refreshView();
    }, 5000);
  }

  private restartSlider(): void {
    clearInterval(this.slideTimer);
    this.startSlider();
  }
}
