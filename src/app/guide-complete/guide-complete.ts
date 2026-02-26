import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Hart } from '../services/hart';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-guide-complete',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    Header,
    Footer
  ],
  templateUrl: './guide-complete.html',
  styleUrl: './guide-complete.scss',
})
export class GuideComplete implements OnInit {
  guia: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private hart: Hart,
    private sanitizer: DomSanitizer,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadGuide(id);
      }
    });
  }

  loadGuide(id: number) {
    this.hart.getGuideById(id).subscribe({
      next: (response) => {
        if (response && response.success) {
          const data = response.data;
          this.guia = {
            ...data,
            date: new Date(data.fecha).toLocaleDateString(),
            // Sanitizamos el HTML para poder mostrarlo de forma segura
            fullContentHTML: this.sanitizer.bypassSecurityTrustHtml(data.contenido_html)
          };
          this.cd.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error cargando guía', error);
        this.router.navigate(['/guide']);
      }
    });
  }

  goBack() {
    this.router.navigate(['/guide']);
  }
}
