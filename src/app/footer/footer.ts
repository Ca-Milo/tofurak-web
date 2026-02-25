import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Globals } from '../globals/globals';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss'],
})
export class Footer {
  constructor(public global: Globals) {}
}
