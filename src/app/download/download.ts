import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Header } from '../header/header';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-download',
  standalone: true,
  imports: [
    CommonModule,
    Header,
    Footer
  ],
  templateUrl: './download.html',
  styleUrls: ['./download.scss'],
})
export class DownloadComponent {

  serverName = 'Aermyfus';
  version = '1.82';

  downloads = [
    {
      title: 'DESCARGAR CLIENTE PORTABLE',
      subtitle: 'SIN LAUNCHER (32 - 64 BITS)',
      version: this.version,
      recommended: false,
      url: '#'
    },
    {
      title: 'DESCARGAR LAUNCHER',
      subtitle: 'RECOMENDADO',
      version: this.version,
      recommended: true,
      url: '#'
    },
    {
      title: 'DESCARGAR CLIENTE BÁSICO',
      subtitle: 'PC DE BAJOS RECURSOS (32 BITS)',
      version: this.version,
      recommended: false,
      url: '#'
    }
  ];
}
