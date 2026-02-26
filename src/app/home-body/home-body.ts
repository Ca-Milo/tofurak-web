import { Component, HostListener, OnInit, Renderer2 } from '@angular/core';
import { NgIf, AsyncPipe } from '@angular/common';
import { ServerStatusService } from '../services/server-status.service';
import { Observable, of } from 'rxjs';
import { map, catchError, startWith } from 'rxjs/operators';
import { Globals } from '../globals/globals';
import { Router, RouterLink } from '@angular/router';
import { Slider } from '../slider/slider';

@Component({
  selector: 'app-home-body',
  standalone: true,
  imports: [NgIf, Slider, AsyncPipe, RouterLink],
  templateUrl: './home-body.html',
  styleUrl: './home-body.scss',
})
export class HomeBody implements OnInit {
  onlineCount$: Observable<string> = of('0');

  constructor(
    public global: Globals,
    private router: Router,
    private renderer: Renderer2,
    private serverStatus: ServerStatusService
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