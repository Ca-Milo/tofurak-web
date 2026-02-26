import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Hart } from '../services/hart';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-guide',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    Header,
    Footer
  ],
  templateUrl: './guide.html',
  styleUrl: './guide.scss',
})
export class Guide implements OnInit {
  serverGuides: any[] = [];
  categories: any[] = [];
  selection: any = null;

  constructor(
    private hart: Hart,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadGuides();
  }

  loadCategories() {
    this.hart.getGuideCategories().subscribe({
      next: (response) => {
        if (response && response.success) {
          this.categories = response.data;
        }
      },
      error: (error) => console.error('Error cargando categorías', error)
    });
  }

  loadGuides(categoryId?: number) {
    this.hart.getGuides(categoryId).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.serverGuides = response.data.map((item: any, index: number) => ({
            id: item.id,
            titulo: item.titulo,
            descripcion: item.descripcion,
            imagen: item.imagen_url,
            date: new Date(item.fecha).toLocaleDateString(),
            categoria: item.nombre_categoria,
            big: 0
          }));
          this.cd.detectChanges();
        }
      },
      error: (error) => console.error('Error cargando guías', error)
    });
  }

  selectChange() {
    const catId = this.selection ? this.selection.id : undefined;
    this.loadGuides(catId);
  }

  goGuide(guide: any) {
    this.router.navigate(['/guide', guide.id]);
  }
}