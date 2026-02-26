import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChildrenOutletContexts } from '@angular/router';
import { slideInAnimation } from './animations';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  animations: [
    slideInAnimation
  ]
})
export class App {
  protected readonly title = signal('cms_ankama');
  constructor(private contexts: ChildrenOutletContexts) {}
  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }
}
