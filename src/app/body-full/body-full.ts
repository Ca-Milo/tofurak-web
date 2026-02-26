import { Component } from '@angular/core';
import { Header } from '../header/header';
import { HomeBody } from '../home-body/home-body';
import { Footer } from '../footer/footer';
import { StaticNavbar } from '../static-navbar/static-navbar';

@Component({
  selector: 'app-body-full',
  imports: [Header, HomeBody, Footer, StaticNavbar],
  standalone : true,
  templateUrl: './body-full.html',
  styleUrl: './body-full.scss',
})
export class BodyFull {

}
