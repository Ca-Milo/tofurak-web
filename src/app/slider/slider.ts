import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { NgxGlideModule } from 'ngx-glide';

@Component({
  selector: 'app-slider',
  imports: [NgxGlideModule],
  templateUrl: './slider.html',
  styleUrl: './slider.scss',
  encapsulation: ViewEncapsulation.None,
})
export class Slider implements OnInit {
  @Input("shopFus")
  shopfus = false;
  constructor() { }

  ngOnInit(): void {
  }
}