import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Hart } from '../services/hart';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-news-complete',
  standalone: true,
  imports: [CommonModule, MatIconModule, Header, Footer],
  templateUrl: './news-complete.html',
  styleUrl: './news-complete.scss',
})
export class NewsComplete implements OnInit {
  noticia: any = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private hart: Hart,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('infoNew');
    if (id) {
      this.loadNews(Number(id));
    }
  }

  loadNews(id: number) {
    this.hart.getNewsById(id).subscribe({
      next: (response) => {
        if (response && response.success) {
          const data = response.data;
          this.noticia = {
            titulo: data.titulo,
            date: new Date(data.fecha).toLocaleDateString(),
            fullContentHTML: data.contenido_html,
            imagen: data.imagen_url
          };
          this.cd.detectChanges(); // Forzar actualización de la vista
        }
      },
      error: (error) => {
        console.error('Error cargando detalle de noticia', error);
      }
    });
  }

  goBack() {
    this.router.navigate(['/news']);
  }
}
