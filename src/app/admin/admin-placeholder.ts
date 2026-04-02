import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-placeholder',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-placeholder.html',
  styleUrl: './admin-placeholder.scss',
})
export class AdminPlaceholder {
  private readonly route = inject(ActivatedRoute);

  readonly title = computed(() => String(this.route.snapshot.data['title'] ?? 'Modulo admin'));
  readonly description = computed(
    () => String(this.route.snapshot.data['description'] ?? 'Pendiente por migrar'),
  );
}
