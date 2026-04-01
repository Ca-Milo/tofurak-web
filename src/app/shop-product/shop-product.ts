import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderShop } from '../header-shop/header-shop';
import { ShopFooter } from '../shop-footer/shop-footer';
import { ShopService, ShopProduct, ShopCategory, CompositionItem } from '../services/shop.service';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-shop-product',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderShop, ShopFooter],
  templateUrl: './shop-product.html',
  styleUrl: './shop-product.scss',
})
export class ShopProductComponent implements OnInit {
  product: ShopProduct | null = null;
  categories: ShopCategory[] = [];
  compositionItems: CompositionItem[] = [];
  isLoading = true;
  showNotification = false;
  isLimitReached = false;
  selectedQuantity = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shopService: ShopService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.shopService.getCategories().subscribe({
      next: data => {
        this.categories = data;
        this.refreshView();
      },
      error: () => {
        this.categories = [];
        this.refreshView();
      },
    });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadProduct(id);
    } else {
      this.isLoading = false;
      this.refreshView();
    }
  }

  addToCart(): void {
    if (!this.product) return;
    this.isLimitReached = this.cartService.isAtLimit(this.product.id);
    if (!this.isLimitReached) {
      this.cartService.add(
        {
          id: this.product.id,
          nombre: this.product.nombre,
          imagen: this.product.imagen,
          cop: this.getDiscountedCopPrice(this.product.cop, this.product.descuento),
          usd: this.getDiscountedUsdPrice(this.product.usd, this.product.descuento),
          originalCop: this.product.cop,
          originalUsd: this.product.usd,
          descuento: this.product.descuento,
        },
        this.selectedQuantity,
      );
    }
    this.showNotification = true;
    this.refreshView();
  }

  goToCart(): void {
    this.router.navigate(['/shop-cart']);
  }

  goToCategory(categoryId: number | null): void {
    this.router.navigate(['/shop'], { queryParams: categoryId ? { categoria: categoryId } : {} });
  }

  scrollToDetails(): void {
    document.getElementById('detailsSection')?.scrollIntoView({ behavior: 'smooth' });
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
    return `+${ogrinas} ogrinas extra`;
  }

  getFormattedDescription(description?: string): string {
    if (!description) return '';

    if (/<[a-z][\s\S]*>/i.test(description)) {
      return description;
    }

    const escaped = description
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');

    return escaped
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split(/\n{2,}/)
      .map(block => `<p>${block.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  private loadProduct(id: number): void {
    this.isLoading = true;
    this.shopService.getProductById(id).subscribe({
      next: data => {
        this.product = data;
        this.isLoading = false;
        this.refreshView();
        this.loadComposition(id);
      },
      error: () => {
        this.product = null;
        this.isLoading = false;
        this.refreshView();
      },
    });
  }

  private loadComposition(id: number): void {
    this.shopService.getProductComposition(id).subscribe({
      next: data => {
        this.compositionItems = data;
        this.refreshView();
      },
      error: () => {
        this.compositionItems = [];
        this.refreshView();
      },
    });
  }

  private refreshView(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }
}
