import { Component, HostListener, OnInit, Renderer2 } from '@angular/core';
import { NgIf, AsyncPipe, NgForOf } from '@angular/common';
import { ServerStatusService } from '../services/server-status.service';
import { Hart } from '../services/hart';
import { Observable, of } from 'rxjs';
import { map, catchError, startWith } from 'rxjs/operators';
import { Globals } from '../globals/globals';
import { Router, RouterLink } from '@angular/router';
import { Slider } from '../slider/slider';

@Component({
  selector: 'app-home-body',
  standalone: true,
  imports: [NgIf, Slider, AsyncPipe, NgForOf, RouterLink],
  templateUrl: './home-body.html',
  styleUrl: './home-body.scss',
})
export class HomeBody implements OnInit {
  onlineCount$: Observable<string> = of('0');
  // últimas noticias (hasta 4)
  news$: Observable<any[]> = of([]);
  // noticias organizadas en filas de 2 para mantener layout 2x2
  newsRows$: Observable<any[][]> = of([[null, null], [null, null]]);

  constructor(
    public global: Globals,
    private renderer: Renderer2,
    private serverStatus: ServerStatusService,
    private hart: Hart, 
  ) {}

  ngOnInit(): void {
    this.onlineCount$ = this.serverStatus.getServerStatus().pipe(
      map((res: any) => {
        if (res && res.success && res.data && (res.data.count !== undefined && res.data.count !== null)) {
          return String(res.data.count);
        }
        return '0';
      }),
      catchError(err => {
        console.error('Error obteniendo server-status', err);
        return of('0');
      }),
      startWith('0')
    );
    // Obtener las últimas noticias desde Hart.getNewsUltimate()
    this.news$ = this.hart.getNewsUltimate().pipe(
      map((res: any) => {
        if (!res) return [];
        if (res.success && Array.isArray(res.data)) return res.data.slice(0, 4);
        if (Array.isArray(res)) return res.slice(0, 4);
        if (Array.isArray(res.data)) return res.data.slice(0, 4);
        return [];
      }),
      catchError(err => {
        console.error('Error obteniendo noticias desde Hart', err);
        return of([]);
      }),
      startWith([])
    );
    // Convertir la lista plana en filas de 2 (2x2) y rellenar con nulls para mantener layout
    this.newsRows$ = this.news$.pipe(
      map(list => {
        const items = (list || []).slice(0, 4);
        while (items.length < 4) items.push(null);
        return [items.slice(0, 2), items.slice(2, 4)];
      }),
      startWith([[null, null], [null, null]])
    );
  }

  chonchito = false;
  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event) {
    const scrollY = window.scrollY || window.pageYOffset;
    this.chonchito = scrollY > 500;
  }

  scrollToTop() {
    this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
  }
}