import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
  imports: [RouterLink, RouterLinkActive],
})
export class Navbar {
  isMobileNavOpen = false;

  constructor() {}

  toggleMobileNav(): void {
    this.isMobileNavOpen = !this.isMobileNavOpen;
  }

  previewResume(): void {
    // Basic preview functionality
    console.log('Preview clicked');
    // Implement your preview logic here
  }
}
