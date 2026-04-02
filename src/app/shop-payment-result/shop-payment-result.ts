import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HeaderShop } from '../header-shop/header-shop';

@Component({
  selector: 'app-shop-payment-result',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderShop],
  templateUrl: './shop-payment-result.html',
  styleUrl: './shop-payment-result.scss',
})
export class ShopPaymentResult {
  private readonly route = inject(ActivatedRoute);

  readonly status = computed(
    () => this.route.snapshot.data['status'] as 'approved' | 'rejected' | 'pending',
  );
  readonly isApproved = computed(() => this.status() === 'approved');
  readonly isPending = computed(() => this.status() === 'pending');
}
