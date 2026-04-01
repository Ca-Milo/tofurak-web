import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
export class Shop implements OnInit {
  slides: ShopBanner[] = [
  ];
 
  activeIndex = 0;
  private slideTimer: any;

  products: ShopProduct[] = [];
  categories: ShopCategory[] = [];
  selectedCategoryId: number | null = null;
  selectedSort = 'RELEVANCE';

  constructor(
    private shopService: ShopService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadBanners();
    this.loadCategories();
    const rawCategoryId = this.route.snapshot.queryParamMap.get('categoria');
    const parsedCategoryId = rawCategoryId !== null ? Number(rawCategoryId) : NaN;
    this.selectedCategoryId = Number.isNaN(parsedCategoryId) ? null : parsedCategoryId;
    this.loadProducts(this.selectedCategoryId);
    this.startSlider();
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

  loadProducts(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
    this.shopService.getProducts(categoryId, this.selectedSort).subscribe({
      next: data => {
        console.log('[Shop] products:', data);
        this.products = data;
        this.refreshView();
      },
      error: err => {
        console.error('[Shop] products error:', err);
        this.products = [];
        this.refreshView();
      },
    });
  }

  onSortChange(): void {
    this.loadProducts(this.selectedCategoryId);
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

  private startSlider(): void {
    if (this.slides.length <= 1) return;
    this.slideTimer = setInterval(() => {
      this.activeIndex = (this.activeIndex + 1) % this.slides.length;
    }, 5000);
  }

  private restartSlider(): void {
    clearInterval(this.slideTimer);
    this.startSlider();
  }
}
