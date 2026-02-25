import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-static-navbar',
  imports: [CommonModule],
  templateUrl: './static-navbar.html',
  styleUrl: './static-navbar.scss',
})
export class StaticNavbar {
  isOpen: boolean = false;
  modalConfig: string = '{"target": "#modalVideo"}';

  reduceVideo() {
    this.isOpen = !this.isOpen;
  }

  openModal() {
    // Your logic to open the modal
  }
}
