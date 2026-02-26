import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Hart } from '../services/hart';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [
    CommonModule,
    Header,
    Footer
  ],
  templateUrl: './news.html',
  styleUrl: './news.scss',
})
export class News implements OnInit {
  serverNews: any[] = [];

  constructor(
    private hart: Hart,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNews();
  }

  loadNews() {
    this.hart.getNews().subscribe({
      next: (response) => {
        if (response && response.success) {
          console.log('Noticias cargadas del servidor:', response.data); // Log para verificar datos
          this.serverNews = response.data.map((item: any) => ({
            id: item.id,
            titulo: item.titulo,
            descripcion: item.descripcion,
            imagen: item.imagen_url,
            date: new Date(item.fecha).toLocaleDateString(),
            big: 0
          }));
          this.cd.detectChanges(); // Forzar actualización de la vista
        }
      },
      error: (error) => {
        console.error('Error cargando noticias', error);
      }
    });
  }

  goNew(news: any) {
    this.router.navigate(['/new', news.id]);
  }
}
