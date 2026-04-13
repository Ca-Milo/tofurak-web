import { Component, OnDestroy, signal } from '@angular/core';
import { Router, RouterOutlet, ChildrenOutletContexts, NavigationEnd } from '@angular/router';
import { slideInAnimation } from './animations';
import { filter, Subject, takeUntil } from 'rxjs';
import { Hart } from './services/hart';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  animations: [
    slideInAnimation
  ]
})
export class App implements OnDestroy {
  private destroy$ = new Subject<void>();
  protected readonly title = signal('cms_ankama');

  constructor(
    private contexts: ChildrenOutletContexts,
    private router: Router,
    private hart: Hart,
  ) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.hart.refreshCurrentUser();
      });
  }

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
